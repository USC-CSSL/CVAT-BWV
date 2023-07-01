// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import Layout from 'antd/lib/layout';

import CanvasLayout from 'components/annotation-page/canvas/grid-layout/canvas-layout';
import ControlsSideBarContainer from 'containers/annotation-page/standard-workspace/controls-side-bar/controls-side-bar';
import CanvasContextMenuContainer from 'containers/annotation-page/canvas/canvas-context-menu';
import ObjectsListContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/objects-list';
import ObjectSideBarComponent from 'components/annotation-page/standard-workspace/objects-side-bar/objects-side-bar';
import CanvasPointContextMenuComponent from 'components/annotation-page/canvas/views/canvas2d/canvas-point-context-menu';
import IssueAggregatorComponent from 'components/annotation-page/review/issues-aggregator';
import RemoveConfirmComponent from 'components/annotation-page/standard-workspace/remove-confirm';
import PropagateConfirmComponent from 'components/annotation-page/standard-workspace/propagate-confirm';
import AudioSelector from '../audioselector/audioselector';
import AudioPlaybackComponent from './audio-playback';
import { CombinedState } from 'reducers';
import { connect } from 'react-redux';
import QuestionAnnotation from './objects-side-bar/question-annotation';

interface StateToProps {
    isPhase2: boolean;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            job: {
                instance: jobInstance
            }
        }
    } = state;

    return {
        isPhase2: jobInstance.stage === 'acceptance'
    };
}
function StandardWorkspaceComponent(props: StateToProps): JSX.Element {
    const { isPhase2 } = props;
    return (<>
        <AudioPlaybackComponent />
        <Layout hasSider className='cvat-standard-workspace'>
            {!isPhase2 &&
            <ControlsSideBarContainer />
            }
            <CanvasLayout />
            {!isPhase2 ?
                <ObjectSideBarComponent objectsList={<ObjectsListContainer />} />:
                <QuestionAnnotation/>
            }
            <PropagateConfirmComponent />
            <CanvasContextMenuContainer />
            <AudioSelector isPhase2={isPhase2}/>
            <CanvasPointContextMenuComponent />
            <IssueAggregatorComponent />
            <RemoveConfirmComponent />
        </Layout></>
    );
}

export default connect(mapStateToProps)(StandardWorkspaceComponent);
