import { TSError, getFirst, DataEntity, Omit } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
*/
export class ACLManager {
    static GraphQLSchema = `
        type Query {
            findUser(id: ID!): PublicUser
        }

        input CreateSpaceInput {
            id: ID!
            name: String!
            description: String
        }

        input CreateViewInput {
            name: String!
            description: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
        }

        type CreateSpaceResult {
            space: Space!,
            views: [View]!
        }

        type Mutation {
            createUser(user: CreateUserInput!, password: String!): User!
            updateUser(user: UpdateUserInput!): User!
            updatePassword(id: ID!, password: String!): Boolean
            removeUser(id: ID!): Boolean
            createRole(role: CreateRoleInput!): Role
            updateRole(role: UpdateRoleInput!): Role
            createSpace(space: CreateSpaceInput!, views: [CreateViewInput]): CreateSpaceResult
        }
    `;

    readonly roles: models.Roles;
    readonly spaces: models.Spaces;
    readonly users: models.Users;
    readonly views: models.Views;

    constructor(client: es.Client, config: ManagerConfig) {
        this.roles = new models.Roles(client, config);
        this.spaces = new models.Spaces(client, config);
        this.users = new models.Users(client, config);
        this.views = new models.Views(client, config);
    }

    async initialize() {
        await Promise.all([
            this.roles.initialize(),
            this.spaces.initialize(),
            this.users.initialize(),
            this.views.initialize(),
        ]);
    }

    async shutdown() {
        await Promise.all([
            this.roles.shutdown(),
            this.spaces.shutdown(),
            this.users.shutdown(),
            this.views.shutdown(),
        ]);
    }

    findUser(id: string) {
        return this.users.findByAnyId(id);
    }

    async createUser(input: models.CreateUserInput, password: string) {
        await this._validateUserInput(input);

        return this.users.createWithPassword(input, password);
    }

    /**
     * Update user without password
    */
    async updateUser(input: models.UpdateUserInput): Promise<models.UserModel> {
        await this._validateUserInput(input);

        // @ts-ignore
        await this.users.update(input);
        return this.users.findById(input.id);
    }

    /**
     * Update user with password
    */
    async updatePassword(id: string, password: string): Promise<boolean> {
        await this.users.updateWithPassword(id, password);
        return true;
    }

    /**
     * Remove user by id
    */
    async removeUser(id: string): Promise<boolean> {
        await this.users.deleteById(id);
        return true;
    }

    async createRole(input: models.CreateRoleInput) {
        await this._validateRoleInput(input);

        return this.roles.create(input);
    }

    async updateRole(input: models.UpdateRoleInput) {
        await this._validateRoleInput(input);

        await this.roles.update(input);
        return this.roles.findById(input.id);
    }

    /**
     * Create space with views
    */
    async createSpace(space: CreateSpaceInput, views: CreateSpaceViewInput[] = []) {
        const spaceDoc = await this.spaces.create({ ...space, views: [] });

        const viewDocs = await Promise.all(views.map(async (view) => {
            await this._validateViewInput(view);
            return this.views.create({ ...view, space: spaceDoc.id });
        }));

        spaceDoc.views = viewDocs.map((viewDoc) => viewDoc.id);
        await this.spaces.update(spaceDoc);

        return {
            space: spaceDoc,
            views: viewDocs,
        };
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getDataAccessConfig(username: string, spaceId: string): Promise<DataAccessConfig> {
        const user = await this.users.findByAnyId(username);
        if (!user) {
            throw new TSError(`Unable to find user "${username}"`, {
                statusCode: 404
            });
        }

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const role = await this.roles.findById(roleId);

        const hasAccess = await this.roles.hasAccessToSpace(roleId, spaceId);
        if (!hasAccess) {
            const msg = `User "${username}" does not have access to space "${spaceId}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const view = await this.views.getViewForRole(roleId, spaceId);

        return {
            user: this.users.omitPrivateFields(user),
            view,
            role: role.name,
        };
    }

    private async _validateUserInput(input: Partial<models.UserModel>) {
        if (!input) {
            throw new TSError('Invalid User Input', {
                statusCode: 422
            });
        }

        if (input && input.roles && input.roles.length) {
            try {
                await this.roles.findAll(input.roles);
            } catch (err) {
                const rolesStr = input.roles.join(', ');
                throw new TSError(`Missing roles with user, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateRoleInput(input: Partial<models.RoleModel>) {
        if (!input) {
            throw new TSError('Invalid Role Input', {
                statusCode: 422
            });
        }

        if (input.spaces && input.spaces.length) {
            try {
                await this.spaces.findAll(input.spaces);
            } catch (err) {
                const rolesStr = input.spaces.join(', ');
                throw new TSError(`Missing spaces with role, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateViewInput(input: Partial<models.ViewModel>) {
        if (!input) {
            throw new TSError('Invalid View Input', {
                statusCode: 422
            });
        }

        if (input.roles && input.roles.length) {
            try {
                await this.roles.findAll(input.roles);
            } catch (err) {
                const rolesStr = input.roles.join(', ');
                throw new TSError(`Missing roles with view, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }
}

type CreateSpaceInput = Omit<models.CreateSpaceInput, 'views'>;
type CreateSpaceViewInput = Omit<models.CreateViewInput, 'space'>;

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and QueryAccess
*/
export interface DataAccessConfig {
    /**
     * The User Model
    */
    user: DataEntity<models.UserModel>;

    /**
     * The View Model
    */
    view: DataEntity<models.ViewModel>;

    /**
     * The name of the Role
    */
    role: string;
}

export const graphqlSchemas = [
    ACLManager.GraphQLSchema,
    models.Roles.GraphQLSchema,
    models.Spaces.GraphQLSchema,
    models.Users.GraphQLSchema,
    models.Views.GraphQLSchema,
];
