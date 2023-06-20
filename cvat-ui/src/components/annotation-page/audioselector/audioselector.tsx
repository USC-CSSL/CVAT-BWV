import { Canvas3d } from 'cvat-canvas3d-wrapper';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { connect } from 'react-redux';
import './audioselector.scss';

import { ActiveControl, CombinedState, ObjectType } from 'reducers';
import Button from 'antd/lib/button';
import { CaretDownOutlined, CaretUpOutlined, PlusOutlined } from '@ant-design/icons';
import CVATTooltip from 'components/common/cvat-tooltip';
import AudioSelectorItem from './audioselectoritem';
import { Col, Row } from 'antd/lib/grid';

import { getCore, ObjectState, Job } from 'cvat-core-wrapper';
import {
    createAnnotationsAsync,
    removeObject,
    updateAnnotationsAsync,
} from 'actions/annotation-actions';

const cvat = getCore();

interface StateToProps {
    canvasInstance: Canvas3d;
    activeControl: ActiveControl;
    labels: any[];
    jobInstance: any;
    startFrame: number,
    stopFrame: number,
    playing: boolean,
    frameNumber: number;
    states: any[];
}

interface DispatchToProps {
    onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void
    onUpdateAnnotations(states: ObjectState[]): void;
    onRemoveAnnotation(objectState: any): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void {
            dispatch(createAnnotationsAsync(sessionInstance, frame, states));
        },
        onUpdateAnnotations(states: ObjectState[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
        onRemoveAnnotation(objectState: any): void {
            dispatch(removeObject(objectState, false));
        }
    };
}

interface Props {
    labels: any[],
    startFrame: number,
    stopFrame: number,
    canvasInstance: Canvas3d,
    frameNumber: number,
    onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void
    onUpdateAnnotations(states: ObjectState[]): void;
    onRemoveAnnotation(objectState: any): void;
    jobInstance: Job,
    states: any[],
}


function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance, activeControl },
            job: { labels, instance: jobInstance },
            player: {
                playing,
                frame: {
                    number: frameNumber,
                    delay: frameDelay,
                    fetching: frameFetching,
                },
            },
            annotations: { states }
        },
    } = state;

    const {startFrame, stopFrame} = jobInstance;

    return {
        canvasInstance: canvasInstance as Canvas3d,
        activeControl,
        labels,
        jobInstance,
        startFrame,
        stopFrame,
        playing,
        frameNumber,
        states
    };
}



function AudioSelector(props: Props): JSX.Element {

    const [audioselections, setAudioSelections] = useState<any[]>([]);
    const {states} = props;

    useEffect(() => {
        setAudioSelections(states.filter(((s: any)  => s.objectType === ObjectType.AUDIOSELECTION)));
    }, [states])


    const [dims, setDims] = useState([0, 0]);
    const [showControls, setShowControls] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const {
        canvasInstance, startFrame, stopFrame, frameNumber, labels, jobInstance,
        onCreateAnnotations,
        onUpdateAnnotations,
        onRemoveAnnotation
    } = props;
    console.log(props.canvasInstance, canvasInstance)

    useLayoutEffect(() => {
        setDims([ref.current?.offsetWidth || 0, ref.current?.offsetHeight || 0]);
      }, []);

    return (
        <div
            ref={ref}
            className={'audioselector-parent'}
        >
            {
                showControls && <div className='audioselector-controls' style={{
                    height: `${50 + 50 * audioselections.length}px`
                }}>
                    <div style={{position: 'relative'}}>
                        {
                            audioselections.length > 0 && (
                                <div className='audioselector-curFrameHighlightContainer'>
                                    <Row>
                                        <Col span={6}></Col>
                                        <Col span={18}>
                                        <div className='audioselector-curFrameHighlightInnerContainer'>
                                            <div className='audioselector-curFrameHighlight'
                                                style={{height: `${50 * audioselections.length}px`, left: `${(frameNumber * 100) / (stopFrame - startFrame)}%`}}
                                            />
                                        </div>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        }
                        {
                            audioselections.map((audioselection) => (
                                <AudioSelectorItem
                                    labels={labels}
                                    startFrame={startFrame}
                                    stopFrame={stopFrame}
                                    frameNumber={frameNumber}
                                    selectionObject={audioselection}
                                    jobInstance={jobInstance}
                                    onUpdateAnnotations={onUpdateAnnotations}
                                    onRemoveAnnotation={onRemoveAnnotation}
                                    />
                            ))
                        }
                        <CVATTooltip title={`Click to highlight a section from audio`}>
                            <Button
                                type='primary'
                                className='cvat-add-tag-button'
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    const objectState = new cvat.classes.ObjectState({
                                        objectType: ObjectType.AUDIOSELECTION,
                                        label: labels.filter((label: any) => label.id === labels[0].id)[0],
                                        frame: frameNumber,
                                        audio_selected_segments: [
                                            {
                                                start: frameNumber,
                                                end: Math.min(frameNumber + 40, stopFrame)
                                            }
                                        ]
                                    });
                                    onCreateAnnotations(jobInstance, frameNumber, [objectState]);
                                }}
                            />
                        </CVATTooltip>
                    </div>
                </div>
            }
            <div className='audioselector-bring-down' onClick={() => setShowControls(!showControls)}>
                <div style={{margin: 'auto', width: 'fit-content'}}>
                {showControls ? <CaretUpOutlined/> : <CaretDownOutlined />}
                </div>
            </div>

        </div>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioSelector);