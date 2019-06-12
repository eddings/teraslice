import React, { useState, FormEvent } from 'react';
import PropTypes from 'prop-types';
import { Menu, Input, Icon, Table, Button, Label } from 'semantic-ui-react';
import ConfirmRemoval from './ConfirmRemoval';
import { UpdateQueryState } from './interfaces';

const Toolbar: React.FC<Props> = props => {
    const { numCols, numSelected, updateQueryState, onAction } = props;
    const [query, updateQuery] = useState(props.query || '');

    const submitQuery = (e: React.FormEvent) => {
        e.preventDefault();
        updateQueryState({ query: query || '*' });
    };

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell colSpan={numCols} style={{ padding: 0 }}>
                    <Menu secondary size="small">
                        <Menu.Item icon disabled={!numSelected}>
                            <ConfirmRemoval
                                numSelected={numSelected}
                                onConfirm={() => onAction('REMOVE')}
                            >
                                <Button
                                    as="div"
                                    labelPosition="right"
                                    disabled={!numSelected}
                                >
                                    <Button
                                        icon
                                        color={
                                            numSelected > 0 ? 'red' : undefined
                                        }
                                    >
                                        <Icon name="trash alternate" />
                                    </Button>
                                    {numSelected > 0 && (
                                        <Label basic pointing="left">
                                            {`Delete (${numSelected} selected)`}
                                        </Label>
                                    )}
                                </Button>
                            </ConfirmRemoval>
                        </Menu.Item>
                        <Menu.Item position="right">
                            <form onSubmit={submitQuery}>
                                <Input
                                    action={
                                        <Button
                                            basic
                                            icon="search"
                                            onClick={submitQuery}
                                        />
                                    }
                                    value={query === '*' ? '' : query}
                                    onChange={(e: FormEvent, { value }) => {
                                        updateQuery(value);
                                    }}
                                    placeholder="Search ..."
                                />
                            </form>
                        </Menu.Item>
                    </Menu>
                </Table.HeaderCell>
            </Table.Row>
        </Table.Header>
    );
};

type Props = {
    numSelected: number;
    query?: string;
    numCols: number;
    updateQueryState: UpdateQueryState;
    onAction: (action: 'REMOVE') => void;
};

Toolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    query: PropTypes.string,
    numCols: PropTypes.number.isRequired,
    onAction: PropTypes.func.isRequired,
    updateQueryState: PropTypes.func.isRequired,
};

export default Toolbar;