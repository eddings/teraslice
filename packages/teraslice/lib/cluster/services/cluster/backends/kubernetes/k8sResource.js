'use strict';

const fs = require('fs');
const path = require('path');

const barbe = require('barbe');
const _ = require('lodash');

const { safeEncode } = require('../../../../../../lib/utils/encoding_utils');
const { addEnvToContainerEnv } = require('./utils');

class K8sResource {
    /**
     * K8sResource allows the generation of k8s resources based on templates.
     * After creating the object, the k8s resource is accessible on the objects
     * .resource property.
     *
     * @param {String} resourceType - jobs/services/deployments
     * @param {String} resourceName - worker/execution_controller
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     */
    constructor(resourceType, resourceName, terasliceConfig, execution) {
        this.execution = execution;
        this.jobLabelPrefix = 'job.teraslice.terascope.io';
        this.nodeType = resourceName;
        this.terasliceConfig = terasliceConfig;

        if (resourceName === 'worker') {
            this.nameInfix = 'wkr';
        } else if (resourceName === 'execution_controller') {
            this.nameInfix = 'exc';
        } else {
            throw new Error(`Unsupported resourceName: ${resourceName}`);
        }

        this.templateGenerator = this._makeTemplate(resourceType, resourceName);
        this.templateConfig = this._makeConfig();
        this.resource = this.templateGenerator(this.templateConfig);

        this._setJobLabels();

        // services don't have pod templates that need modification by these
        // methods
        if (resourceType !== 'services') {
            // Apply job `targets` setting as k8s nodeAffinity
            // We assume that multiple targets require both to match ...
            // NOTE: If you specify multiple `matchExpressions` associated with
            // `nodeSelectorTerms`, then the pod can be scheduled onto a node
            // only if *all* `matchExpressions` can be satisfied.
            this._setTargets();
            this._setResources();
            this._setVolumes();
            this._setAssetsVolume();
            this._setImagePullSecret();
        }
    }

    _makeConfig() {
        const clusterName = _.get(this.terasliceConfig, 'name');
        const clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        const configMapName = _.get(
            this.terasliceConfig,
            'kubernetes_config_map_name',
            `${this.terasliceConfig.name}-worker`
        );
        const dockerImage = this.execution.kubernetes_image
            || this.terasliceConfig.kubernetes_image;
        // name needs to be a valid DNS name since it is used in the svc name,
        // so we can only permit alphanumeric and - characters.  _ is forbidden.
        const jobNameLabel = this.execution.name.replace(/[^a-zA-Z0-9\-.]/g, '-').substring(0, 63);
        const name = `ts-${this.nameInfix}-${jobNameLabel.substring(0, 35)}-${this.execution.job_id.substring(0, 13)}`;
        const shutdownTimeoutMs = _.get(this.terasliceConfig, 'shutdown_timeout', 60000);
        const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);

        const config = {
            // assetsDirectory: _.get(this.terasliceConfig, 'assets_directory', ''),
            // assetsVolume: _.get(this.terasliceConfig, 'assets_volume', ''),
            clusterName,
            clusterNameLabel,
            configMapName,
            dockerImage,
            execution: safeEncode(this.execution),
            exId: this.execution.ex_id,
            jobId: this.execution.job_id,
            jobNameLabel,
            name,
            namespace: _.get(this.terasliceConfig, 'kubernetes_namespace', 'default'),
            nodeType: this.nodeType,
            replicas: this.execution.workers,
            shutdownTimeout: shutdownTimeoutSeconds
        };
        return config;
    }

    _makeTemplate(folder, fileName) {
        const filePath = path.join(__dirname, folder, `${fileName}.hbs`);
        const templateData = fs.readFileSync(filePath, 'utf-8');
        const templateKeys = ['{{', '}}'];

        return (config) => {
            const templated = barbe(templateData, templateKeys, config);
            return JSON.parse(templated);
        };
    }

    _setImagePullSecret() {
        if (this.terasliceConfig.kubernetes_image_pull_secret) {
            this.resource.spec.template.spec.imagePullSecrets = [
                { name: this.terasliceConfig.kubernetes_image_pull_secret }
            ];
        }
    }

    _setAssetsVolume() {
        if (this.terasliceConfig.assets_directory && this.terasliceConfig.assets_volume) {
            this.resource.spec.template.spec.volumes.push({
                name: this.terasliceConfig.assets_volume,
                persistentVolumeClaim: { claimName: this.terasliceConfig.assets_volume }
            });
            this.resource.spec.template.spec.containers[0].volumeMounts.push({
                name: this.terasliceConfig.assets_volume,
                mountPath: this.terasliceConfig.assets_directory
            });
        }
    }

    _setJobLabels() {
        if (this.execution.labels != null) {
            _.forEach(this.execution.labels, (label) => {
                const keyName = label[0].replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63);
                const key = `${this.jobLabelPrefix}/${keyName}`;
                const value = label[1].replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63);
                this.resource.metadata.labels[key] = value;

                if (this.resource.kind !== 'Service') {
                    // Services don't have templates, so if it's a service,
                    // don't add this
                    this.resource.spec.template.metadata.labels[key] = value;
                }
            });
        }
    }

    _setVolumes() {
        if (this.execution.volumes != null) {
            _.forEach(this.execution.volumes, (volume) => {
                this.resource.spec.template.spec.volumes.push({
                    name: volume.name,
                    persistentVolumeClaim: { claimName: volume.name }
                });
                this.resource.spec.template.spec.containers[0].volumeMounts.push({
                    name: volume.name,
                    mountPath: volume.path
                });
            });
        }
    }

    _setResources() {
        // The settings on the executions override the cluster configs
        const cpu = this.execution.cpu || this.terasliceConfig.cpu || -1;
        const memory = this.execution.memory || this.terasliceConfig.memory || -1;
        // use teraslice config as defaults and execution config will override it
        const envVars = Object.assign({}, this.terasliceConfig.env_vars, this.execution.env_vars);

        const container = this.resource.spec.template.spec.containers[0];

        if (cpu !== -1) {
            _.set(container, 'resources.requests.cpu', cpu);
            _.set(container, 'resources.limits.cpu', cpu);
        }

        if (memory !== -1) {
            _.set(container, 'resources.requests.memory', memory);
            _.set(container, 'resources.limits.memory', memory);
        }

        addEnvToContainerEnv(container.env, envVars, memory);
    }

    _setTargets() {
        if (_.has(this.execution, 'targets') && (!_.isEmpty(this.execution.targets))) {
            _.forEach(this.execution.targets, (target) => {
                // `required` is the default if no `constraint` is provided for
                // backwards compatibility and as the most likely case
                if (target.constraint === 'required' || !_.has(target, 'constraint')) {
                    this._setTargetRequired(target);
                }

                if (target.constraint === 'preferred') {
                    this._setTargetPreferred(target);
                }

                if (target.constraint === 'accepted') {
                    this._setTargetAccepted(target);
                }
            });
        }
    }

    _setTargetRequired(target) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution';
        if (!_.has(this.resource, targetKey)) {
            const nodeSelectorObj = {
                nodeSelectorTerms: [{ matchExpressions: [] }]
            };
            _.set(this.resource, targetKey, nodeSelectorObj);
        }

        this.resource.spec.template.spec.affinity.nodeAffinity
            .requiredDuringSchedulingIgnoredDuringExecution
            .nodeSelectorTerms[0].matchExpressions.push({
                key: target.key,
                operator: 'In',
                values: [target.value]
            });
    }

    _setTargetPreferred(target) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution';
        if (!_.has(this.resource, targetKey)) {
            _.set(this.resource, targetKey, []);
        }

        this.resource.spec.template.spec.affinity.nodeAffinity
            .preferredDuringSchedulingIgnoredDuringExecution.push({
                weight: 1,
                preference: {
                    matchExpressions: [{
                        key: target.key,
                        operator: 'In',
                        values: [target.value]
                    }]
                }
            });
    }

    _setTargetAccepted(target) {
        const targetKey = 'spec.template.spec.tolerations';
        if (!_.has(this.resource, targetKey)) {
            _.set(this.resource, targetKey, []);
        }

        this.resource.spec.template.spec.tolerations.push({
            key: target.key,
            operator: 'Equal',
            value: target.value,
            effect: 'NoSchedule'
        });
    }
}

module.exports = K8sResource;
