import { PluginRoute } from '@terascope/ui-components';
import config from './config';
import Form from './Form';
import List from './List';

const routes: PluginRoute[] = [
    {
        name: `${config.pluralLabel}`,
        path: `/${config.pathname}`,
        icon: 'eye',
        component: List,
        access: ['DATAADMIN', 'ADMIN'],
        actions: [`/${config.pathname}/create`],
    },
    {
        name: `Create ${config.singularLabel}`,
        path: `/${config.pathname}/create`,
        icon: 'add',
        hidden: true,
        access: ['DATAADMIN', 'ADMIN'],
        component: Form,
    },
    {
        name: `Edit ${config.singularLabel}`,
        path: `/${config.pathname}/edit/:id`,
        icon: 'pencil alternate',
        hidden: true,
        access: ['DATAADMIN', 'ADMIN'],
        component: Form,
    },
];

export default routes;
