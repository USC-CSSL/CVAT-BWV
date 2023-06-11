// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Empty from 'antd/lib/empty';
import { CombinedState } from 'reducers';
import { connect } from 'react-redux';

interface OriginalProps {
    notFound: boolean;
}

interface StateToProps {
    isOrganizationOwner: boolean;
}

type Props = OriginalProps & StateToProps;

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        auth: {
            user,
        },
        organizations: { fetching: organizationsFetching, current: currentOrganization },
    } = state;

    return {
        isOrganizationOwner: !organizationsFetching && currentOrganization.owner.username === user.username
    };
}

function EmptyListComponent(props: Props): JSX.Element {
    const { notFound, isOrganizationOwner } = props;
    return (
        <div className='cvat-empty-projects-list'>
            <Empty description={notFound ? (
                <Text strong>No results matched your search...</Text>
            ) : (
                <>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Text strong>No projects created yet ...</Text>
                        </Col>
                    </Row>
                    { isOrganizationOwner && (
                    <>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text type='secondary'>To get started with your annotation project</Text>
                            </Col>
                        </Row>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Link to='/projects/create'>create a new one</Link>
                            </Col>
                        </Row>
                    </>)}
                </>
            )}
            />
        </div>
    );
}

export default connect(mapStateToProps)(React.memo(EmptyListComponent));
