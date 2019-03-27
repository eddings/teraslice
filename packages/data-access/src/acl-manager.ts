import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { CreateRecordInput, UpdateRecordInput } from 'elasticsearch-store';
import { TypeConfig, LuceneQueryAccess } from 'xlucene-evaluator';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
 *
 * @todo add multi-tenant support
 * @todo only superadmins can write to to everything
 * @todo an admin should only have access its "client_id"
 * @todo add "client_id" to all of the models
 * @todo add read permissions for roles, views, spaces, and data types
*/
export class ACLManager {
    static GraphQLSchema = `
        type DataAccessConfig {
            user_id: String!
            role_id: String!
            search_config: SpaceSearchConfig
            streaming_config: SpaceStreamingConfig
            data_type: DataType!
            view: View!
        }

        type Query {
            authenticate(username: String, password: String, api_token: String): User!
            findUser(id: ID!): User
            findUsers(query: String): [User]!

            findRole(id: ID!): Role
            findRoles(query: String): [Role]!

            findDataType(id: ID!): DataType
            findDataTypes(query: String): [DataType]!

            findSpace(id: ID!): Space
            findSpaces(query: String): [Space]!

            findView(id: ID!): View
            findViews(query: String): [View]!

            getViewForSpace(api_token: String!, space: String!): DataAccessConfig!
        }

        type Mutation {
            createUser(user: CreateUserInput!, password: String!): User!
            updateUser(user: UpdateUserInput!): User!
            updatePassword(id: String!, password: String!): Boolean!
            updateToken(id: String!): String!
            removeUser(id: ID!): Boolean!

            createRole(role: CreateRoleInput!): Role!
            updateRole(role: UpdateRoleInput!): Role!
            removeRole(id: ID!): Boolean!

            createDataType(dataType: CreateDataTypeInput!): DataType!
            updateDataType(dataType: UpdateDataTypeInput!): DataType!
            removeDataType(id: ID!): Boolean!

            createView(view: CreateViewInput!): View!
            updateView(view: UpdateViewInput!): View!
            removeView(id: ID!): Boolean!

            createSpace(space: CreateSpaceInput!): Space!
            updateSpace(space: UpdateSpaceInput!): Space!
            removeSpace(id: ID!): Boolean!
        }
    `;

    logger: ts.Logger;

    private readonly _roles: models.Roles;
    private readonly _spaces: models.Spaces;
    private readonly _users: models.Users;
    private readonly _views: models.Views;
    private readonly _dataTypes: models.DataTypes;

    constructor(client: es.Client, config: ManagerConfig) {
        this.logger = config.logger || ts.debugLogger('acl-manager');
        this._roles = new models.Roles(client, config);
        this._spaces = new models.Spaces(client, config);
        this._users = new models.Users(client, config);
        this._views = new models.Views(client, config);
        this._dataTypes = new models.DataTypes(client, config);
    }

     /**
     * Initialize all index stores
     */
    async initialize() {
        await Promise.all([
            this._roles.initialize(),
            this._spaces.initialize(),
            this._users.initialize(),
            this._views.initialize(),
            this._dataTypes.initialize(),
        ]);
    }

    /**
     * Shutdown all index stores
     */
    async shutdown() {
        await Promise.all([
            this._roles.shutdown(),
            this._spaces.shutdown(),
            this._users.shutdown(),
            this._views.shutdown(),
            this._dataTypes.shutdown(),
        ]);
    }

    /**
     * Authenticate user with an api_token or username and password
     */
    async authenticate(args: { username?: string, password?: string, api_token?: string }): Promise<models.User> {
        if (args.username && args.password) {
            return this._users.authenticate(args.username, args.password);
        }

        if (args.api_token) {
            return this._users.authenticateWithToken(args.api_token);
        }

        throw new ts.TSError('Missing credentials', {
            statusCode: 401
        });
    }

    /**
     * Find user by id
    */
    async findUser(args: { id: string }, authUser: models.User) {
        const type = this._getUserType(authUser);

        const authUserId = authUser && authUser.id;
        if (type !== 'SUPERADMIN') {
            const clientId = this._getUserClientId(authUser);
            const canSeeToken = type === 'ADMIN' || authUserId === args.id;

            const queryAccess = new LuceneQueryAccess<models.User>({
                constraint: clientId ? `client_id:${clientId}` : undefined,
                excludes:  canSeeToken ? ['hash', 'salt'] : ['api_token', 'hash', 'salt'],
            });

            return this._users.findById(args.id, queryAccess);
        }
        return this._users.findById(args.id);
    }

    /**
     * Find all users by a given query
    */
    async findUsers(args: { query?: string } = {}, authUser: models.User) {
        const type = this._getUserType(authUser);
        if (type !== 'SUPERADMIN') {
            const clientId = this._getUserClientId(authUser);
            const canSeeToken = type === 'ADMIN';

            const queryAccess = new LuceneQueryAccess<models.User>({
                constraint: clientId ? `client_id:${clientId}` : undefined,
                excludes: canSeeToken ? ['hash', 'salt'] : ['api_token', 'hash', 'salt'],
                allow_implicit_queries: true
            });
            return this._users.find(args.query, {}, queryAccess);
        }
        return this._users.find(args.query);
    }

    /**
     * Create a user
    */
    async createUser(args: { user: models.CreateUserInput, password: string }, authUser: models.User|false) {
        await this._validateUserInput(args.user, authUser);

        return this._users.createWithPassword(args.user, args.password);
    }

    /**
     * Update user without password
     *
     * This cannot include private information
    */
    async updateUser(args: { user: models.UpdateUserInput }, authUser: models.User): Promise<models.User> {
        await this._validateUserInput(args.user, authUser);

        await this._users.update(args.user);
        return this._users.findById(args.user.id);
    }

    /**
     * Update user's password
    */
    async updatePassword(args: { id: string, password: string }, authUser: models.User): Promise<boolean> {
        await this._validateUserInput({ id: args.id }, authUser);
        await this._users.updatePassword(args.id, args.password);
        return true;
    }

    /**
     * Generate a new API Token for a user
    */
    async updateToken(args: { id: string }, authUser: models.User): Promise<string> {
        await this._validateUserInput({ id: args.id }, authUser);
        return await this._users.updateToken(args.id);
    }

    /**
     * Remove user by id
    */
    async removeUser(args: { id: string }, authUser: models.User): Promise<boolean> {
        const type = this._getUserType(authUser);
        if (authUser && type === 'USER' && args.id === authUser.id) {
            throw new ts.TSError('User doesn\'t have permission to remove itself', {
                statusCode: 403
            });
        }

        await this._validateUserInput({ id: args.id }, authUser);

        const exists = await this._users.exists(args.id);
        if (!exists) return false;

        await this._validateUserInput({ id: args.id }, authUser);
        await this._users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
    */
    async findRole(args: { id: string }, authUser: models.User) {
        return this._roles.findById(args.id);
    }

    /**
     * Find roles by a given query
    */
    async findRoles(args: { query?: string } = {}, authUser: models.User) {
        return this._roles.find(args.query);
    }

    /**
     * Create a role
    */
    async createRole(args: { role: CreateRecordInput<models.Role> }, authUser: models.User) {
        await this._validateCanCreate('roles', authUser);
        await this._validateRoleInput(args.role);

        return this._roles.create(args.role);
    }

    /**
     * Update a role
    */
    async updateRole(args: { role: UpdateRecordInput<models.Role> }, authUser: models.User) {
        await this._validateCanUpdate('roles', authUser);
        await this._validateRoleInput(args.role);

        await this._roles.update(args.role);
        return this._roles.findById(args.role.id);
    }

    /**
     * Remove role and remove from any associated views or users
    */
    async removeRole(args: { id: string }, authUser: models.User) {
        await this._validateCanRemove('roles', authUser);

        const exists = await this._roles.exists(args.id);
        if (!exists) return false;

        await Promise.all([
            this._views.removeRoleFromViews(args.id),
            this._users.removeRoleFromUsers(args.id),
            this._roles.deleteById(args.id),
        ]);

        return true;
    }

    /**
     * Find data type by id
    */
    async findDataType(args: { id: string }, authUser: models.User) {
        return this._dataTypes.findById(args.id);
    }

    /**
     * Find data types by a given query
    */
    async findDataTypes(args: { query?: string } = {}, authUser: models.User) {
        return this._dataTypes.find(args.query);
    }

    /**
     * Create a data type
    */
    async createDataType(args: { dataType: CreateRecordInput<models.DataType> }, authUser: models.User) {
        await this._validateCanCreate('data types', authUser);
        await this._validateDataTypeInput(args.dataType);

        return this._dataTypes.create(args.dataType);
    }

    /**
     * Update a data type
    */
    async updateDataType(args: { dataType: UpdateRecordInput<models.DataType> }, authUser: models.User) {
        await this._validateCanUpdate('data types', authUser);
        await this._validateDataTypeInput(args.dataType);

        await this._dataTypes.update(args.dataType);
        return this._dataTypes.findById(args.dataType.id);
    }

    /**
     * Remove a data type, this is really dangerous since there are views and spaces linked this
     *
     * @question should we remove the views and spaces associated with the data-type?
    */
    async removeDataType(args: { id: string }, authUser: models.User) {
        await this._validateCanRemove('data types', authUser);

        const exists = await this._dataTypes.exists(args.id);
        if (!exists) return false;

        await this._dataTypes.deleteById(args.id);

        return true;
    }

    /**
     * Find space by id
    */
    async findSpace(args: { id: string }, authUser: models.User) {
        return this._spaces.findById(args.id);
    }

    /**
     * Find spaces by a given query
    */
    async findSpaces(args: { query?: string } = {}, authUser: models.User) {
        return this._spaces.find(args.query);
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
     *
    */
    async createSpace(args: { space: CreateRecordInput<models.Space> }, authUser: models.User) {
        await this._validateCanCreate('spaces', authUser);
        await this._validateSpaceInput(args.space);

        return this._spaces.create(args.space);
    }

    /**
     * Update a space
    */
    async updateSpace(args: { space: UpdateRecordInput<models.Space> }, authUser: models.User) {
        await this._validateCanUpdate('spaces', authUser);
        await this._validateSpaceInput(args.space);

        await this._spaces.update(args.space);
        return this._spaces.findById(args.space.id);
    }

    /**
     * Remove a space by id, this will clean up any associated views and roles
     */
    async removeSpace(args: { id: string }, authUser: models.User) {
        await this._validateCanRemove('spaces', authUser);

        const exists = await this._spaces.exists(args.id);
        if (!exists) return false;

        await this._spaces.deleteById(args.id);
        return true;
    }

    /**
     * Find view by id
    */
    async findView(args: { id: string }, authUser: models.User) {
        return this._views.findById(args.id);
    }

    /**
     * Find views by a given query
    */
    async findViews(args: { query?: string } = {}, authUser: models.User) {
        return this._views.find(args.query);
    }

    /**
     * Create a view, this will attach to the space and the role
    */
    async createView(args: { view: CreateRecordInput<models.View> }, authUser: models.User) {
        await this._validateCanCreate('views', authUser);
        await this._validateViewInput(args.view);

        const result = await this._views.create(args.view);
        return result;
    }

    /**
     * Update a view, this will attach to the space and the role
    */
    async updateView(args: { view: UpdateRecordInput<models.View> }, authUser: models.User) {
        await this._validateCanUpdate('views', authUser);

        const { view } = args;
        await this._validateViewInput(view);

        let oldDataType: string|undefined;
        if (args.view.data_type) {
            const currentView = await this._views.findById(view.id);
            oldDataType = currentView.data_type;
        }

        if (args.view.data_type) {
            if (oldDataType && oldDataType !== args.view.data_type) {
                throw new ts.TSError('Cannot not update the data_type on a view', {
                    statusCode: 422
                });
            }
        }

        await this._views.update(args.view);
        return this._views.findById(args.view.id);
    }

    /**
     * Remove views and remove from any associated spaces
    */
    async removeView(args: { id: string }, authUser: models.User) {
        await this._validateCanRemove('views', authUser);

        const exists = await this._views.exists(args.id);
        if (!exists) return false;

        await this._spaces.removeViewFromSpaces(args.id);
        await this._views.deleteById(args.id);
        return true;
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { api_token: string, space: string }, authUser: models.User): Promise<DataAccessConfig> {
        const user = await this.authenticate(args);

        if (!user.role) {
            const msg = `User "${user.username}" is not assigned to a role`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [role, space] = await Promise.all([
            this._roles.findById(user.role),
            this._spaces.findByAnyId(args.space),
        ]);

        const hasAccess = space.roles.includes(user.role);
        if (!hasAccess) {
            const msg = `User "${user.username}" does not have access to space "${space.id}"`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [view, dataType] = await Promise.all([
            this._views.getViewOfSpace(space, role.id),
            this._dataTypes.findById(space.data_type)
        ]);

        return this._parseDataAccessConfig({
            user_id: user.id,
            role_id: role.id,
            space_id: space.id,
            search_config: space.search_config,
            streaming_config: space.streaming_config,
            data_type: dataType,
            view
        });
    }

    private _getUserClientId(authUser: models.User|false): number {
        if (!authUser || authUser.type === 'SUPERADMIN') return 0;
        if (authUser.client_id == null) return -1;
        return authUser.client_id;
    }

    private async _getCurrentUserInfo(authUser: models.User|false, user: Partial<models.User>): Promise<{ client_id: number, type: models.UserType }> {
        let currentUser: models.User|false;
        if (!user.id) {
            currentUser = user as models.User;
        } else if (authUser && authUser.id !== user.id) {
            currentUser = await this._users.findById(user.id);
        } else {
            currentUser = authUser;
        }

        return {
            client_id: this._getUserClientId(currentUser),
            type: this._getUserType(currentUser)
        };
    }

    private _getUserType(authUser: models.User|false): models.UserType {
        if (!authUser) return 'SUPERADMIN';
        return authUser.type || 'USER';
    }

    private _parseDataAccessConfig(config: DataAccessConfig): DataAccessConfig {
        const searchConfig = config.search_config!;

        if (searchConfig.default_date_field) {
            searchConfig.default_date_field = ts.trimAndToLower(searchConfig.default_date_field);
        }

        if (searchConfig.default_geo_field) {
            searchConfig.default_geo_field = ts.trimAndToLower(searchConfig.default_geo_field);
        }

        const typeConfig: TypeConfig = config.data_type.type_config || {};

        const dateField = searchConfig.default_date_field;
        if (dateField && !typeConfig[dateField]) {
            typeConfig[dateField] = 'date';
        }

        const geoField = searchConfig.default_geo_field;
        if (geoField && !typeConfig[geoField]) {
            typeConfig[geoField] = 'geo';
        }

        config.data_type.type_config = typeConfig;
        return config;
    }

    private async _validateUserInput(user: Partial<models.User>, authUser: models.User|false) {
        if (!user) {
            throw new ts.TSError('Invalid User Input', {
                statusCode: 422
            });
        }

        if (this._users.isPrivateUser(user)) {
            const fields = models.Users.PrivateFields.join(', ');
            throw new ts.TSError(`Cannot update restricted fields, ${fields}`, {
                statusCode: 422,
            });
        }

        if (user.role) {
            const exists = await this._roles.exists(user.role);
            if (!exists) {
                throw new ts.TSError(`Missing role with user, ${user.role}`, {
                    statusCode: 422
                });
            }
        }

        const authType = this._getUserType(authUser);
        const authClientId = this._getUserClientId(authUser);
        const {
            client_id: currentClientId,
            type: currentType
        } = await this._getCurrentUserInfo(authUser, user);

        if (authType === 'ADMIN' && authClientId !== currentClientId) {
            throw new ts.TSError('User doesn\'t have permission to write to users outside of the their client id', {
                statusCode: 403
            });
        }

        if (authUser && authType === 'USER' && authUser.id !== user.id) {
            throw new ts.TSError('User doesn\'t have permission to write to other users', {
                statusCode: 403
            });
        }

        if (currentClientId != null && authType === 'ADMIN' && currentType === 'SUPERADMIN') {
            throw new ts.TSError('User doesn\'t have permission to write to users with SUPERADMIN access', {
                statusCode: 403
            });
        }

        if (user.type && user.type !== currentType) {
            if (authType === 'USER' ||
                authType === 'ADMIN' && user.type === 'SUPERADMIN') {
                throw new ts.TSError(`User doesn't have permission to elevate user to ${user.type}`, {
                    statusCode: 403
                });
            }
        }

        if (authType !== 'SUPERADMIN' && user.client_id != null && user.client_id !== currentClientId) {
            throw new ts.TSError('User doesn\'t have permission to change client on user', {
                statusCode: 403
            });
        }
    }

    private async _validateSpaceInput(space: Partial<models.Space>) {
        if (!space) {
            throw new ts.TSError('Invalid Space Input', {
                statusCode: 422
            });
        }

        if (space.roles) {
            space.roles = ts.uniq(space.roles);

            const exists = await this._roles.exists(space.roles);
            if (!exists) {
                const rolesStr = space.roles.join(', ');
                throw new ts.TSError(`Missing roles with space, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }

        if (space.data_type) {
            const exists = await this._dataTypes.exists(space.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${space.data_type}`, {
                    statusCode: 422
                });
            }
        }

        if (space.views) {
            space.views = ts.uniq(space.views);

            const views = await this._views.findAll(space.views);
            if (views.length !== space.views.length) {
                const viewsStr = space.views.join(', ');
                throw new ts.TSError(`Missing views with space, ${viewsStr}`, {
                    statusCode: 422
                });
            }

            const dataTypes = views.map(view => view.data_type);
            if (space.data_type && dataTypes.length && !dataTypes.includes(space.data_type)) {
                throw new ts.TSError('Views must have the same data type', {
                    statusCode: 422
                });
            }

            const roles: string[] = [];
            views.forEach((view) => {
                roles.push(...ts.uniq(view.roles));
            });
            if (ts.uniq(roles).length !== roles.length) {
                throw new ts.TSError('Multiple views cannot contain the same role within a space', {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateRoleInput(role: Partial<models.Role>) {
        if (!role) {
            throw new ts.TSError('Invalid Role Input', {
                statusCode: 422
            });
        }
    }

    private async _validateDataTypeInput(dataType: Partial<models.DataType>) {
        if (!dataType) {
            throw new ts.TSError('Invalid DataType Input', {
                statusCode: 422
            });
        }
    }

    private async _validateViewInput(view: Partial<models.View>) {
        if (!view) {
            throw new ts.TSError('Invalid View Input', {
                statusCode: 422
            });
        }

        if (view.roles) {
            view.roles = ts.uniq(view.roles);

            const exists = await this._roles.exists(view.roles);
            if (!exists) {
                const rolesStr = view.roles.join(', ');
                throw new ts.TSError(`Missing roles with view, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }

        if (view.data_type) {
            const exists = await this._dataTypes.exists(view.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${view.data_type}`, {
                    statusCode: 422
                });
            }
        }
    }

    /**
     * Validate a user can create a resource
     *
     * This works for all models except users
    */
    private async _validateCanCreate(resource: Resource, authUser: models.User) {
        const type = this._getUserType(authUser);
        const resources: Resource[] = ['spaces', 'data types'];

        if (type === 'USER' || (type === 'ADMIN' && resources.includes(resource))) {
            throw new ts.TSError(`User doesn't have permission to create ${resource}`, {
                statusCode: 403
            });
        }
    }

    /**
     * Validate a user can update a resource
     *
     * This works for all models except users
    */
    private async _validateCanUpdate(resource: Resource, authUser: models.User) {
        const type = this._getUserType(authUser);
        if (type === 'USER') {
            throw new ts.TSError(`User doesn't have permission to update ${resource}`, {
                statusCode: 403
            });
        }
    }

    /**
     * Validate a user can remove a resource
     *
     * This works for all models except users
    */
    private async _validateCanRemove(resource: Resource, authUser: models.User) {
        const type = this._getUserType(authUser);
        const resources: Resource[] = ['spaces', 'data types'];
        if (type === 'USER' || (type === 'ADMIN' && resources.includes(resource))) {
            throw new ts.TSError(`User doesn't have permission to remove ${resource}`, {
                statusCode: 403
            });
        }
    }
}

type Resource = 'roles'|'data types'|'views'|'spaces';

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and SearchAccess
*/
export interface DataAccessConfig {
    /**
     * The id of the user authenticated
    */
    user_id: string;

    /**
     * The id of the Role used
    */
    role_id: string;

    /**
     * The id of the space
    */
    space_id: string;

    /**
     * The space's search configuration
    */
    search_config?: models.SpaceSearchConfig;

    /**
     * The space's streaming configuration
    */
    streaming_config?: models.SpaceStreamingConfig;

    /**
     * The data type associated with the view
    */
    data_type: models.DataType;

    /**
     * The authenticated user's view of the space
    */
    view: models.View;
}

export const graphqlQueryMethods: (keyof ACLManager)[] = [
    'authenticate',
    'findUser',
    'findUsers',
    'findRole',
    'findRoles',
    'findDataType',
    'findDataTypes',
    'findSpace',
    'findSpaces',
    'findView',
    'findViews',
    'getViewForSpace',
];

export const graphqlMutationMethods: (keyof ACLManager)[] = [
    'createUser',
    'updateUser',
    'updatePassword',
    'updateToken',
    'removeUser',
    'createRole',
    'updateRole',
    'removeRole',
    'createDataType',
    'updateDataType',
    'removeDataType',
    'createSpace',
    'updateSpace',
    'removeSpace',
    'createView',
    'updateView',
    'removeView',
];

export const graphqlSchemas = [
    ACLManager.GraphQLSchema,
    models.DataTypes.GraphQLSchema,
    models.Roles.GraphQLSchema,
    models.Spaces.GraphQLSchema,
    models.Users.GraphQLSchema,
    models.Views.GraphQLSchema,
];
