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
import TranscriptPlayer from '../transcript/transcript-player';
import WaveformSlider from '../transcript/waveform-slider';

interface StateToProps {
    jobPhase: string;
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
        jobPhase: jobInstance.phase
    };
}
function StandardWorkspaceComponent(props: StateToProps): JSX.Element {
    const { jobPhase } = props;
    return (<>
        <AudioPlaybackComponent />
        <Layout hasSider className='cvat-standard-workspace'>
            { jobPhase !== 'phase2' &&
            <ControlsSideBarContainer />
            }
            <Layout.Content>
                <Layout>
                    <Layout.Header style={{padding: '10px', }}>

                        <WaveformSlider/>

                    </Layout.Header>
                    {jobPhase === 'phase1a' && <AudioSelector/>}
                    <CanvasLayout />

                </Layout>
            </Layout.Content>
            <TranscriptPlayer />
            { jobPhase !== 'phase2' ?
                <ObjectSideBarComponent objectsList={<ObjectsListContainer />} />:
                <QuestionAnnotation/>
            }
            <PropagateConfirmComponent />
            <CanvasContextMenuContainer />
            <CanvasPointContextMenuComponent />
            <IssueAggregatorComponent />
            <RemoveConfirmComponent />
        </Layout></>
    );
}

export default connect(mapStateToProps)(StandardWorkspaceComponent);
