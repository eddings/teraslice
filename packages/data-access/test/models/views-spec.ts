import 'jest-extended';
import { Views, ViewModel } from '../../src/models/views';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';
import { SpaceModel } from 'packages/data-access/src';

describe('Views', () => {
    const client = makeClient();
    const views = new Views(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(views);
        return views.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(views);
        return views.shutdown();
    });

    describe('when testing view creation', () => {
        it('should be able to create a view', async () => {
            const created = await views.create({
                name: 'hello',
                data_type: 'some-data-type-id',
                roles: ['role-id'],
                excludes: ['example'],
                includes: ['other'],
            });

            const fetched = await views.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });

    describe('when getting a view for a role', () => {
        let view1: ViewModel;
        let view2: ViewModel;

        const roleId = 'some-role-id';

        beforeAll(async () => {
            view1 = await views.create({
                name: 'hello',
                data_type: 'another-data-type-id',
                roles: [roleId],
            });

            view2 = await views.create({
                name: 'howdy',
                data_type: 'another-data-type-id',
                roles: [],
            });
        });

        it('should return the view if using the right space', async () => {
            // @ts-ignore
            const space: SpaceModel = {
                views: [view1.id, view2.id],
            };

            const found = await views.getViewOfSpace(space, roleId);
            expect(found).toEqual(view1);
        });

        it('should return a non-restrictive view if not found', async () => {
            // @ts-ignore
            const space: SpaceModel = {
                data_type: 'FakeDataType',
                roles: [roleId],
                views: [view2.id],
            };

            const result = await views.getViewOfSpace(space, roleId);

            expect(result).toMatchObject({
                id: `default-view-for-role-${roleId}`,
                name: `Default View for Role ${roleId}`,
                data_type: space.data_type,
                roles: space.roles,
            });
        });
    });
});
