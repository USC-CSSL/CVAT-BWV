// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { changeFrameAsync, modalUpdateAsync, switchPlay } from 'actions/annotation-actions';
import { Col, Row } from 'antd';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import React from 'react';
import { connect } from 'react-redux';
import { ColorBy, CombinedState, ObjectType } from 'reducers';
import getLabelDisplayName from 'utils/label-display';
import { ThunkDispatch } from 'utils/redux';
import { getColor } from './shared';
interface StateToProps {
    allStates: any[];
    colorBy: ColorBy;
    playing: boolean;
    jobInstance: any;
}

interface DispatchToProps {
    changeFrame(frame: number): void;
    modalUpdate(update: any): void;
    onSwitchPlay(playing: boolean): void;
}


function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            annotations: {
                allStates
            },
            player: {
                playing
            },
            job: {
                instance: jobInstance
            }
        },
        settings: {
            shapes: {
                colorBy
            }
        }
    } = state;

    return {
        allStates,
        colorBy,
        playing,
        jobInstance
    };
}

function mapDispatchToProps(dispatch: ThunkDispatch): DispatchToProps {
    return {
        changeFrame(frame: number): void {
            dispatch(changeFrameAsync(frame));
        },
        onSwitchPlay(playing: boolean): void {
            dispatch(switchPlay(playing));
        },
        modalUpdate(update: any): void {
            dispatch(modalUpdateAsync(update));
        }
    };
}


function AllObjectsListComponent(props: StateToProps & DispatchToProps): JSX.Element {

    const {allStates, colorBy, changeFrame, onSwitchPlay, modalUpdate, playing, jobInstance} = props;
    return (
        <div className='cvat-objects-sidebar-states-list'>
            {allStates.slice(0).sort((a, b) => a.frame - b.frame).map(state =>
                (
                    <div style={{border: '1px solid black', background: getColor(state, colorBy)}}>
                        <Text>
                            {
                                (
                                    state.objectType === ObjectType.TAG || state.objectType === ObjectType.AUDIOSELECTION
                                ) ? state.objectType.toUpperCase() : `${state.shapeType.toUpperCase()} ${state.objectType.toUpperCase()}`
                            }
                        </Text>
                        <br/>
                        <Text>
                            Label: {['auto_unlabeled', 'manual_unlabeled'].includes(state.source) ? 'Unlabeled '+state.label.name.split(':')[0]: getLabelDisplayName(state.label.name)}
                        </Text>
                        <br/>

                        <Text>
                            Frame: {state.frame}
                        </Text>
                        <br/>
                        <Row >
                            <Col sm={10}>
                                <Button onClick={() => {
                                    if (playing) {
                                        onSwitchPlay(false);
                                    }
                                    changeFrame(state.frame)
                                }}>Go To Frame</Button>
                            </Col>
                            <Col sm={2}></Col>
                            <Col sm={10}>
                                { jobInstance.phase === 'phase1b' &&
                                <Button onClick={() => {
                                    if (playing) {
                                        onSwitchPlay(false);
                                    }

                                    modalUpdate({
                                        mode: 'person_demographics',
                                        people: [{
                                            clientID: state.clientID,
                                            frameNumber: state.frame
                                        }],
                                        visible: true
                                    });

                                }}>Fill Demographics</Button>
                            }
                            </Col>
                        </Row>


                    </div>
                ))}
        </div>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(AllObjectsListComponent));
