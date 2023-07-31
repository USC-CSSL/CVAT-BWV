// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { changeFrameAsync, switchPlay } from 'actions/annotation-actions';
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
}

interface DispatchToProps {
    changeFrame(frame: number): void;
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
        playing
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
    };
}


function AllObjectsListComponent(props: StateToProps & DispatchToProps): JSX.Element {

    const {allStates, colorBy, changeFrame, onSwitchPlay, playing} = props;
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
                        <Button onClick={() => {
                            if (playing) {
                                onSwitchPlay(false);
                            }
                            changeFrame(state.frame)
                        }}>Go To Frame</Button>

                    </div>
                ))}
        </div>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(AllObjectsListComponent));
