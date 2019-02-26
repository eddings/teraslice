import * as es from 'elasticsearch';
import { Omit, uniq, TSError } from '@terascope/utils';
import rolesConfig from './config/roles';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

/**
 * Manager for Roles
*/
export class Roles extends Base<RoleModel, CreateRoleInput, UpdateRoleInput> {
    static ModelConfig = rolesConfig;
    static GraphQLSchema =  `
        type Role {
            id: ID!
            name: String!
            description: String
            spaces: [String]
            created: String
            updated: String
        }

        input CreateRoleInput {
            name: String!
            description: String
            spaces: [String]
        }

        input UpdateRoleInput {
            id: ID!
            name: String
            description: String
            spaces: [String]
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, rolesConfig);
    }

    async hasAccessToSpace(role: RoleModel, space: string): Promise<boolean> {
        return role.spaces.includes(space);
    }

    /** Associate space to multiple roles */
    async addSpaceToRoles(space: string, roles: string[]): Promise<void> {
        if (!space) {
            throw new TSError('Missing space id to attach roles to', {
                statusCode: 422
            });
        }

        await Promise.all(uniq(roles).map((id) => {
            return this.appendToArray(id, 'spaces', space);
        }));
    }

    async removeSpaceFromRoles(spaceId: string) {
        const roles = await this.find(`spaces: ${spaceId}`);
        const promises = roles.map(({ id }) => {
            console.log('HERE', { id, spaceId });
            return this.removeFromArray(id, 'spaces', spaceId);
        });
        await Promise.all(promises);
    }

}

/**
 * The definition a Role model
*/
export interface RoleModel extends BaseModel {
    /**
     * Name of the Role
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;

    /**
     * A list of assocciated Spaces
    */
    spaces: string[];
}

export type CreateRoleInput = Omit<RoleModel, (keyof BaseModel)>;
export type UpdateRoleInput = Omit<RoleModel, Exclude<(keyof BaseModel), 'id'>>;
