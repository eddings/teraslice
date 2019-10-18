
// @ts-ignore
import createCircle from '@turf/circle';
import { geoMatcher } from './helpers';
import { parseGeoPoint, parseGeoDistance } from '../../../utils';
import * as i from '../../interfaces';
import { UtilsTranslateQueryOptions } from '../../../translator/interfaces';
import { AnyQuery } from '../../../translator';

function validate(params: i.Term[]) {
    const distanceParam = params.find((node) => node.field === 'distance');
    const geoPointParam = params.find((node) => node.field === 'point');

    if (distanceParam == null) throw new Error('geoDistance query needs to specify a "distance" parameter');
    if (geoPointParam == null) throw new Error('geoDistance query needs to specify a "point" parameter');

    const point = parseGeoPoint(geoPointParam.value as string);
    const distance = parseGeoDistance(distanceParam.value as string);

    return {
        ...point,
        ...distance
    };
}

const geoDistance: i.FunctionDefinition = {
    name: 'geoDistance',
    version: '1',
    create(field: string, params: any, { logger }) {
        if (!field || field === '*') throw new Error('field for geoDistance cannot be empty or "*"');
        // eslint-disable-next-line @typescript-eslint/camelcase
        const {
            lat, lon, distance, unit: paramUnit
        } = validate(params);

        function toElasticsearchQuery(options: UtilsTranslateQueryOptions) {
            const unit = paramUnit || options.geo_sort_unit;
            const order = options.geo_sort_order;

            const query: AnyQuery = {};
            query.geo_distance = {
                distance: `${distance}${unit}`,
            };
            query.geo_distance[field] = {
                lat,
                lon,
            };

            const sort = {
                _geo_distance: {
                    order,
                    unit,
                    [field]: {
                        lat,
                        lon
                    }
                }
            };

            logger.trace('built geo distance query', { query });

            return {
                query,
                sort
            };
        }

        function matcher() {
            // There is a mismatch between elasticsearch and turf on just inch
            const units = paramUnit === 'inch' ? 'inches' : paramUnit;
            const geoPoint = [lon, lat];
            const config = { units };
            let polygon: createCircle;

            if (lat != null && lon != null) {
                polygon = createCircle(
                    geoPoint,
                    distance,
                    config
                );
            }

            // Nothing matches so return false
            if (polygon == null) return () => false;
            return geoMatcher(polygon);
        }

        return {
            match: matcher(),
            toElasticsearchQuery
        };
    }
};

export default geoDistance;