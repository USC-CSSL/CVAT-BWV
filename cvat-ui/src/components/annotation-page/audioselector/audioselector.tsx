import { Canvas3d } from 'cvat-canvas3d-wrapper';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { connect } from 'react-redux';
import './audioselector.scss';

import { ActiveControl, CombinedState, ObjectType } from 'reducers';
import Button from 'antd/lib/button';
import LabelSelector from 'components/label-selector/label-selector';
import { CaretDownOutlined, CaretUpOutlined, PlusOutlined } from '@ant-design/icons';
import CVATTooltip from 'components/common/cvat-tooltip';
import AudioSelectorItem from './audioselectoritem';
import {Selector} from './audioselectoritem';
import { Col, Row } from 'antd/lib/grid';

import { getCore, ObjectState, Job } from 'cvat-core-wrapper';
import {
    createAnnotationsAsync,
    updateAnnotationsAsync,
} from 'actions/annotation-actions';

interface StateToProps {
    canvasInstance: Canvas3d;
    activeControl: ActiveControl;
    labels: any[];
    jobInstance: any;
    startFrame: number,
    stopFrame: number,
    playing: boolean,
    frameNumber: number;
}

interface DispatchToProps {
    onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void
    onUpdateAnnotations(states: ObjectState[]): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void {
            dispatch(createAnnotationsAsync(sessionInstance, frame, states));
        },
        onUpdateAnnotations(states: ObjectState[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
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
    jobInstance: Job,
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
        frameNumber
    };
}



function AudioSelector(props: Props): JSX.Element {

    const [count, setCount] = useState(0);


    const [dims, setDims] = useState([0, 0]);
    const [showControls, setShowControls] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const {
        canvasInstance, startFrame, stopFrame, frameNumber, labels, jobInstance,
        onCreateAnnotations,
        onUpdateAnnotations,
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
                    height: `${50 + 50 * count}px`
                }}>
                    <div style={{position: 'relative'}}>
                        {
                            count > 0 && (
                                <div className='audioselector-curFrameHighlightContainer'>
                                    <Row>
                                        <Col span={4}></Col>
                                        <Col span={20}>
                                        <div className='audioselector-curFrameHighlightInnerContainer'>
                                            <div className='audioselector-curFrameHighlight'
                                                style={{height: `${50 * count}px`, left: `${(frameNumber * 100) / (stopFrame - startFrame)}%`}}
                                            />
                                        </div>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        }
                        {
                            Array.from(Array(count)).map((_, index) => (
                                <AudioSelectorItem
                                    labels={labels}
                                    startFrame={startFrame}
                                    stopFrame={stopFrame}
                                    frameNumber={frameNumber}
                                    index={index}
                                    jobInstance={jobInstance}
                                    onCreateAnnotations={onCreateAnnotations}
                                    onUpdateAnnotations={onUpdateAnnotations}
                                    />
                            ))
                        }
                        <CVATTooltip title={`Click to highlight a section from audio`}>
                            <Button
                                type='primary'
                                className='cvat-add-tag-button'
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setCount((val) => val + 1)
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