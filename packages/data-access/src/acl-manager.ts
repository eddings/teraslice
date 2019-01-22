import * as es from 'elasticsearch';
import * as models from './models';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
*/
export class ACLManager {
    readonly roles: models.Roles;
    readonly spaces: models.Spaces;
    readonly users: models.Users;
    readonly views: models.Views;

    constructor(client: es.Client) {
        this.roles = new models.Roles(client);
        this.spaces = new models.Spaces(client);
        this.users = new models.Users(client);
        this.views = new models.Views(client);
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

    /**
     * Get the User's view of a "Space"
     */
    async getViewForUser(username: string, space: string): Promise<DataAccessConfig> {
        const user = await this.users.findByUsername(username);
        const roles = await this.roles.findAllForUser(user, space);

        // QUESTION?: What do we do if there are multiple views
        // @ts-ignore
        const views = await this.views.findAllForRoles(roles, space);

        // @ts-ignore FIXME
        return {};
    }

    // FIXME add more higher level apis...
}

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
    user: models.UserModel;

    /**
     * The View Model
    */
    view: models.ViewModel;

    /**
     * The name of the space
    */
    space: models.SpaceModel;

    /**
     * The name of the Role
    */
    role: string;
}
