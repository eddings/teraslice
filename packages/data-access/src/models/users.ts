import * as es from 'elasticsearch';
import * as store from 'elasticsearch-store';
import {  DataEntity, TSError, Omit } from '@terascope/utils';
import usersConfig, {
    GraphQLSchema,
    UserModel,
    UserType
} from './config/users';
import * as utils from '../utils';

/**
 * Manager for Users
*/
export class Users extends store.IndexModel<UserModel> {
    static PrivateFields: string[] = ['api_token', 'salt', 'hash'];
    static ModelConfig = usersConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, options: store.IndexModelOptions) {
        super(client, options, usersConfig);
    }

    /**
     * Create user with password, returns private fields
     */
    async createWithPassword(record: CreateUserModel, password: string): Promise<UserModel> {
        const salt = await utils.generateSalt();
        const hash = await utils.generatePasswordHash(password, salt);
        const apiToken = await utils.generateAPIToken(hash, record.username);

        return super.create({
            ...record,
            api_token: apiToken,
            hash,
            salt,
        });
    }

    async updatePassword(id: string, password: string) {
        const record = await super.findByAnyId(id);
        const salt = await utils.generateSalt();
        const hash = await utils.generatePasswordHash(password, salt);

        return super.update({
            id: record.id,
            hash,
            salt,
        });
    }

    /**
     * Authenticate the user
    */
    async authenticate(username: string, password: string): Promise<UserModel> {
        let user: UserModel;

        try {
            user = await super.findBy({ username });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user', {
                    statusCode: 403
                });
            }

            throw err;
        }

        const hash = await utils.generatePasswordHash(password, user.salt);

        if (user.hash !== hash) {
            throw new TSError('Unable to authenticate user with credentials', {
                statusCode: 403
            });
        }

        return user;
    }

    /**
     * Update the API Token for a user
    */
    async updateToken(id: string): Promise<string> {
        const user = await super.findByAnyId(id);
        const apiToken = await utils.generateAPIToken(user.hash, user.username);

        await super.update({
            id: user.id,
            api_token: apiToken
        });

        return apiToken;
    }

    /**
     * Authenticate user by api token, returns private fields
     */
    async authenticateWithToken(apiToken?: string): Promise<UserModel> {
        if (!apiToken) {
            throw new TSError('Missing api_token for authentication', {
                statusCode: 401
            });
        }

        try {
            return await super.findBy({ api_token: apiToken });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user with api token', {
                    statusCode: 403
                });
            }

            throw err;
        }
    }

    /**
     * Find users, returns public user fields
     */
    async find(q: string = '*', size: number = 10, fields?: (keyof UserModel)[], sort?: string): Promise<UserModel[]> {
        const users = await super.find(q, size, fields, sort);
        return users.map((user) => this.omitPrivateFields(user));
    }

    /**
     * Find user by id, returns public user fields
     */
    async findById(id: string): Promise<UserModel> {
        const user = await super.findById(id);
        return this.omitPrivateFields(user);
    }

    /**
     * Find user by any id, returns public user fields
     */
    async findByAnyId(id: string): Promise<UserModel> {
        const user = await super.findByAnyId(id);
        return this.omitPrivateFields(user);
    }

    /**
     * Find user by any id, returns public user fields
     */
    async findBy(fields: store.FieldMap<UserModel>, joinBy = 'AND'): Promise<UserModel> {
        const user = await super.findBy(fields, joinBy);
        return this.omitPrivateFields(user);
    }

    /**
     * Find multiple users by id, returns public user fields
     */
    // @ts-ignore
    async findAll(ids: string[]): Promise<UserModel[]> {
        const users = await super.findAll(ids);
        return users.map((user) => this.omitPrivateFields(user));
    }

    isPrivateUser(user: Partial<UserModel>): boolean {
        if (!user) return false;

        const fields = Object.keys(user);
        return Users.PrivateFields.some((field) => {
            return fields.includes(field);
        });
    }

    omitPrivateFields(user: UserModel): UserModel {
        if (!this.isPrivateUser(user)) return user;

        const publicUser = {};
        const privateFields = Users.PrivateFields;

        for (const [key, val] of Object.entries(user)) {
            if (!privateFields.includes(key)) {
                publicUser[key] = val;
            }
        }

        // @ts-ignore
        return DataEntity.make(publicUser, DataEntity.getMetadata(user));
    }

    async removeRoleFromUsers(roleId: string) {
        const users = await this.find(`role: ${roleId}`);
        const promises = users.map(async ({ id }) => {
            try {
                await this.update({
                    id,
                    role: ''
                });
            } catch (err) {
                if (err && err.statusCode === 404) {
                    return;
                }
                throw err;
            }
        });
        await Promise.all(promises);
    }
}

type CreateUserModel = Omit<store.CreateIndexModel<UserModel>, 'api_token'|'hash'|'salt'>;
type UpdateUserModel = Omit<store.UpdateIndexModel<UserModel>, 'api_token'|'hash'|'salt'>;
export { UserModel, UserType, CreateUserModel, UpdateUserModel };
