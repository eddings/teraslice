import 'jest-extended';
import { TSError } from '@terascope/utils';
import { Users, UserModel } from '../../src/models/users';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Users', () => {
    const client = makeClient();
    const users = new Users(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(users);
        return users.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(users);
        return users.shutdown();
    });

    describe('when testing user access', () => {
        const username = 'billyjoe';
        const password = 'secret-password';

        let created: UserModel;

        beforeAll(async () => {
            created = await users.create({
                username,
                firstname: 'Billy',
                lastname: 'Joe',
                email: 'billy.joe@example.com',
                client_id: 123,
                roles: [
                    'example-role-id'
                ]
            }, password);
        });

        it('should be able fetch the user', async () => {
            const fetched = await users.findById(created.id);

            expect(created).toMatchObject(fetched);
            expect(created).toHaveProperty('api_token');
            expect(created).toHaveProperty('hash');
            expect(created).toHaveProperty('salt');
        });

        it('should be able to omit private fields', () => {
            const omitted = users.omitPrivateFields(created);

            expect(omitted).not.toBe(created);

            expect(omitted).not.toHaveProperty('api_token');
            expect(omitted).not.toHaveProperty('hash');
            expect(omitted).not.toHaveProperty('salt');
        });

        it('should be able to update the api_token', async () => {
            await expect(users.findByToken(created.api_token))
                .resolves.toEqual(created);

            const newToken = await users.updateToken(username);

            const fetched = await users.findById(created.id);

            expect(created.api_token).not.toEqual(newToken);
            expect(fetched.api_token).toEqual(newToken);

            await expect(users.findByToken(newToken))
                .resolves.toEqual(fetched);
        });

        describe('when give the correct password', () => {
            it('should be able to authenticate the user', async () => {
                const result = await users.authenticate(username, password);
                expect(result).toBeTrue();
            });
        });

        describe('when give the incorrect password', () => {
            it('should NOT be able to authenticate the user', async () => {
                const result = await users.authenticate(username, 'wrong-password');
                expect(result).toBeFalse();
            });
        });
    });

    describe('when testing user validation', () => {
        describe('when adding multiple roles', () => {
            it('should throw a validation error', async () => {
                expect.hasAssertions();

                try {
                    await users.create({
                        username: 'coolbeans',
                        firstname: 'Cool',
                        lastname: 'Beans',
                        email: 'cool.beans@example.com',
                        client_id: 123,
                        // @ts-ignore
                        roles: [
                            'example-role-id-2',
                            'example-role-id',
                        ]
                    }, 'supersecret');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toEqual('.roles should NOT have more than 1 items');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when adding an invalid email address', () => {
            it('should throw a validation error', async () => {
                expect.hasAssertions();

                try {
                    await users.create({
                        username: 'coolbeans',
                        firstname: 'Cool',
                        lastname: 'Beans',
                        email: 'cool.beans',
                        client_id: 123,
                        roles: [
                            'example-role-id',
                        ]
                    }, 'supersecret');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toEqual('.email should match format \"email\"');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when adding a messy email address', () => {
            it('should trim and to lower the email address', async () => {
                const result = await users.create({
                    username: 'coolbeans',
                    firstname: 'Cool',
                    lastname: 'Beans',
                    email: ' cool.BEANS@example.com ',
                    client_id: 123,
                    roles: [
                        'example-role-id',
                    ]
                }, 'supersecret');

                expect(result.email).toEqual('cool.beans@example.com');
            });
        });
    });
});