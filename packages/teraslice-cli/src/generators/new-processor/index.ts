'use strict';

import path from 'path';
import _ from 'lodash';
// @ts-ignore
import Generator from 'yeoman-generator';

export default class extends Generator {
    argument: any;
    // TODO: what is this????
    options: any;
    answers!: any;
    prompt: any;
    destinationRoot: any;
    fs: any;
    templatePath: any;
    destinationPath: any;

    constructor(args:any, opts:any) {
        super(args, opts);
        this.argument('asset_path', { type: String, required: true });
        // @ts-ignore
        this.option('new');
         // @ts-ignore
        this.sourceRoot(`${__dirname}/templates`);
    }

    async prompting() {
        if (this.options.new === true) {
            this.answers = await this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'New Processor name',
                    validate: (value:string) => {
                        if (value.length < 1) {
                            return 'Please enter a value';
                        }
                        return true;
                    },
<<<<<<< HEAD:packages/teraslice-cli/src/generators/new-processor/index.ts
                    filter: (value:string) => _.snakeCase(value)
=======
                    filter: (value) => _.snakeCase(value)
>>>>>>> master:packages/teraslice-cli/generators/new-processor/index.js
                },
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select the type of processor',
                    choices: [
                        'batch',
                        'map',
                        'filter'
                    ]
                }
            ]);
        }
    }

    paths() {
        this.destinationRoot(path.join(this.options.asset_path));
    }

    createProcessor() {
        function capitolizeFirstLetter(value:string) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        let name = 'example';
        let type = 'batch';

        if (this.options.new === true) {
            name = this.answers.name; // eslint-disable-line
            type = this.answers.type; // eslint-disable-line
        }

        this.fs.copyTpl(this.templatePath('base-op/schema.js'), this.destinationPath(`asset/${name}/schema.js`));

        this.fs.copyTpl(this.templatePath(`base-op/${type}.js`),
            this.destinationPath(`asset/${name}/processor.js`),
            { name: capitolizeFirstLetter(_.camelCase(name)) });

        this.fs.copyTpl(this.templatePath(`tests/${type}-spec.js`),
            this.destinationPath(`test/${name}-spec.js`),
            { name });
    }
}
