// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import { Row, Col } from 'antd/lib/grid';
import Dropdown from 'antd/lib/dropdown';
import { PlusOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import { importActions } from 'actions/import-actions';
import { SortingComponent, ResourceFilterHOC, defaultVisibility } from 'components/resource-sorting-filtering';
import { CombinedState, TasksQuery } from 'reducers';
import { usePrevious } from 'utils/hooks';
import { MultiPlusIcon } from 'icons';
import CvatDropdownMenuPaper from 'components/common/cvat-dropdown-menu-paper';
import {
    localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues, config,
} from './tasks-filter-configuration';
import topBar from 'components/jobs-page/top-bar';

const FilteringComponent = ResourceFilterHOC(
    config, localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues,
);

interface VisibleTopBarProps {
    onApplyFilter(filter: string | null): void;
    onApplySorting(sorting: string | null): void;
    onApplySearch(search: string | null): void;
    query: TasksQuery;
    importing: boolean;
}

interface StateToProps {
    isOrganizationOwner: boolean
}

type Props = VisibleTopBarProps & StateToProps;

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        auth: {
            user,
        },
        organizations: { fetching: organizationsFetching, current: currentOrganization },
    } = state;

    return {
        isOrganizationOwner: !organizationsFetching && currentOrganization?.owner.username === user.username
    };
}

function TopBarComponent(props: Props): JSX.Element {
    const dispatch = useDispatch();
    const {
        importing, query, onApplyFilter, onApplySorting, onApplySearch, isOrganizationOwner
    } = props;
    const [visibility, setVisibility] = useState(defaultVisibility);
    const history = useHistory();
    const prevImporting = usePrevious(importing);

    useEffect(() => {
        if (prevImporting && !importing) {
            onApplyFilter(query.filter);
        }
    }, [importing]);

    return (
        <Row className='cvat-tasks-page-top-bar' justify='center' align='middle'>
            <Col md={22} lg={18} xl={16} xxl={14}>
                <div className='cvat-tasks-page-filters-wrapper'>
                    <Input.Search
                        enterButton
                        onSearch={(phrase: string) => {
                            onApplySearch(phrase);
                        }}
                        defaultValue={query.search || ''}
                        className='cvat-tasks-page-search-bar'
                        placeholder='Search ...'
                    />
                    <div>
                        <SortingComponent
                            visible={visibility.sorting}
                            onVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, sorting: visible })
                            )}
                            defaultFields={query.sort?.split(',') || ['-ID']}
                            sortingFields={['ID', 'Owner', 'Status', 'Assignee', 'Updated date', 'Subset', 'Mode', 'Dimension', 'Project ID', 'Name', 'Project name']}
                            onApplySorting={onApplySorting}
                        />
                        <FilteringComponent
                            value={query.filter}
                            predefinedVisible={visibility.predefined}
                            builderVisible={visibility.builder}
                            recentVisible={visibility.recent}
                            onPredefinedVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, predefined: visible })
                            )}
                            onBuilderVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, builder: visible })
                            )}
                            onRecentVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, builder: visibility.builder, recent: visible })
                            )}
                            onApplyFilter={onApplyFilter}
                        />
                    </div>
                </div>
                <div>
                    { isOrganizationOwner &&
                    <Dropdown
                        trigger={['click']}
                        overlay={(
                            <CvatDropdownMenuPaper>
                                <Button
                                    className='cvat-create-task-button'
                                    type='primary'
                                    onClick={(): void => history.push('/tasks/create')}
                                    icon={<PlusOutlined />}
                                >
                                    Create a new task
                                </Button>
                                <Button
                                    className='cvat-create-multi-tasks-button'
                                    type='primary'
                                    onClick={(): void => history.push('/tasks/create?many=true')}
                                    icon={<span className='anticon'><MultiPlusIcon /></span>}
                                >
                                    Create multi tasks
                                </Button>
                                <Button
                                    className='cvat-import-task-button'
                                    type='primary'
                                    disabled={importing}
                                    icon={<UploadOutlined />}
                                    onClick={() => dispatch(importActions.openImportBackupModal('task'))}
                                >
                                    Create from backup
                                    {importing && <LoadingOutlined />}
                                </Button>
                            </CvatDropdownMenuPaper>
                        )}
                    >
                        <Button type='primary' className='cvat-create-task-dropdown' icon={<PlusOutlined />} />
                    </Dropdown>
                    }
                </div>
            </Col>
        </Row>
    );
}

export default connect(mapStateToProps)(React.memo(TopBarComponent));
