import { Canvas3d } from 'cvat-canvas3d-wrapper';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { connect } from 'react-redux';

import { ActiveControl, CombinedState, ObjectType } from 'reducers';
import Button from 'antd/lib/button';
import { CaretDownOutlined, CaretUpOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd/lib/grid';

import { getCore, ObjectState, Job } from 'cvat-core-wrapper';
import {
    changeFrameAsync,
    createAnnotationsAsync,
    modalUpdateAsync,
    removeObject,
    switchPlay,
    updateAnnotationsAsync,
    updateTranscript
} from 'actions/annotation-actions';
import getAutoIncrementedIdentifierAttr from 'utils/label-identifier-auto-increment';
import { personColors } from './conf';

import {Property} from 'csstype';

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
    audioPreview: number[];
    jobPhase: string;
    transcriptData: any;
    frameSpeed: number;
}

interface DispatchToProps {
    onSwitchPlay(play: boolean): void;
    changeFrame: (frame: number) => void;
    onChangeTranscript(index: number, segment: any): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onSwitchPlay(play: boolean): void {
            dispatch(switchPlay(play));
        },
        changeFrame(frame: number): void {
            dispatch(changeFrameAsync(frame));
        },
        onChangeTranscript(index: number, segment: any): void {
            dispatch(updateTranscript(index, segment));
        },
    };
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance, activeControl },
            job: { labels, instance: jobInstance },
            player: {
                playing,
                transcript: {
                    data: transcriptData
                },
                frame: {
                    number: frameNumber,

                },
                audio: {
                    preview: audioPreview
                }
            },
            annotations: { states },

        },
        settings: {
            player: {
                frameSpeed
            }
        }
    } = state;

    const {startFrame, stopFrame, phase: jobPhase} = jobInstance;

    return {
        canvasInstance: canvasInstance as Canvas3d,
        activeControl,
        labels,
        jobInstance,
        startFrame,
        stopFrame,
        playing,
        frameNumber,
        states,
        audioPreview,
        jobPhase,
        transcriptData,
        frameSpeed,
    };
}

interface Props {
}



function WaveformSlider(props: StateToProps & DispatchToProps & Props): JSX.Element {



    const [imageData, setImageData] = useState('');

    const {
        startFrame, stopFrame, frameNumber,
        onSwitchPlay,
        playing,
        transcriptData,
        audioPreview,
        frameSpeed,
        changeFrame,
        onChangeTranscript
    } = props;

    const sliderRef = useRef<HTMLDivElement>(null);

    const MULTIPLIER_WIDTH = 1;

    const [activatedIdx, setActivatedIdx] = useState(-1);
    const [leftBound, setLeftBound] = useState(-1);
    const [rightBound, setRightBound] = useState(-1);
    const [dragging, setDragging] = useState<String | null>(null);


    useEffect(() => {

        const setDraggingNull = () => setDragging(null);
        const changeBound = (e: MouseEvent) => {
            if (sliderRef.current) {

                if (activatedIdx !== -1) {
                    const xPos = e.clientX;
                    const sliderMid = sliderRef.current.getBoundingClientRect().x + sliderRef.current.getBoundingClientRect().width / 2;
                    const newTime = (frameNumber + (xPos - sliderMid) * MULTIPLIER_WIDTH) / frameSpeed;
                    if (dragging === 'left') {
                        if (newTime < rightBound - 1) setLeftBound(newTime);
                    }
                    else if (dragging === 'right') {
                        if (newTime > leftBound + 1) setRightBound(newTime);
                    }
                }
            }
        }

        document.addEventListener('mouseup', setDraggingNull);
        document.addEventListener('mousemove', changeBound);

        return () => {
            document.removeEventListener('mouseup', setDraggingNull);
            document.removeEventListener('mousemove', changeBound);
        }
    }, [activatedIdx, dragging, sliderRef, frameNumber, frameNumber]);




    useEffect(() => {
        if (audioPreview.length) {
            const offScreenCVS = document.createElement('canvas');
            const offScreenCTX = offScreenCVS.getContext("2d");
            const mx = Math.max(...audioPreview);
            offScreenCVS.width =  (stopFrame - startFrame)*MULTIPLIER_WIDTH;
            offScreenCVS.height = 512;

            const num = audioPreview.length;
            const eachSize = offScreenCVS.width / num;

            for (let i = 0; i < num; i++) {
                const height = (audioPreview[i]) / mx * (offScreenCVS.height / 2);
                offScreenCTX?.beginPath();

                offScreenCTX?.moveTo(i * eachSize, (offScreenCVS.height/2));
                offScreenCTX?.lineTo(i * eachSize  + eachSize / 2, (offScreenCVS.height / 2) - height);
                offScreenCTX?.lineTo(i * eachSize  + eachSize, (offScreenCVS.height / 2));
                offScreenCTX?.lineTo(i * eachSize  + eachSize / 2, (offScreenCVS.height / 2)  + height);
                offScreenCTX?.fill();
            }

            setImageData(offScreenCVS.toDataURL());
        }
    }, [audioPreview]);


    const sliderWidth = sliderRef.current?.clientWidth || 0;

    return (
        <>

            <div style={{width: '100%', margin: 'auto', height: '100%', position: 'relative', backgroundColor: '#eee', overflowX: 'clip'}}>
                <div style={{position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', backgroundColor: 'red'}}></div>
                <div style={{
                    backgroundImage: `url("${imageData}")`,
                    backgroundColor: '#00000000',
                    backgroundSize: `${(stopFrame - startFrame)*MULTIPLIER_WIDTH}px 100%`,
                    backgroundRepeat: 'no-repeat',
                    width: '100%',
                    height: '100%',
                    backgroundPosition: sliderWidth? `${(sliderWidth / 2 - MULTIPLIER_WIDTH*frameNumber)}px 0px` : '0px 0px',

                }} ref={sliderRef}></div>

                {
                    transcriptData && transcriptData.segments.map((segment: any, idx: number) => {
                        if (segment.speaker) {
                            const color  = personColors[parseInt(segment.speaker.split('_')[1])];
                            const currentlyBeingSpoken = segment.start * frameSpeed < (frameNumber - startFrame) &&
                                segment.end * frameSpeed > (frameNumber - startFrame);

                            const sliderStyle = {
                                position: 'absolute' as Property.Position,
                                bottom: 0,
                                translate: '-50% 50%',
                                color: 'blue',
                                width: currentlyBeingSpoken ? '20px' : '15px',
                                height: currentlyBeingSpoken ? '20px' : '15px',
                                backgroundColor: color,
                                borderRadius: '25px',
                                boxShadow: '2px 2px 2px black',
                                cursor: 'pointer',
                                // boxSizing: 'border-box' as Property.BoxSizing,
                                border: currentlyBeingSpoken ? '1px solid white' : 'none'

                            };
                            return (<>
                                {/* Left slider */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: sliderWidth/2 + MULTIPLIER_WIDTH * ((activatedIdx === idx ? leftBound : segment.start) * frameSpeed - frameNumber),
                                        width: '1px', height: '100%',
                                        backgroundColor: color,
                                        opacity: activatedIdx === -1 || activatedIdx === idx ? 1 : 0.5,
                                    }}>
                                    <div style={{
                                        ...sliderStyle,
                                        display: activatedIdx === -1 || activatedIdx === idx ? 'block': 'none',
                                        zIndex: 1,
                                    }}  onMouseDown={() =>{
                                        if (activatedIdx === -1) {
                                            if (playing) onSwitchPlay(false);

                                            changeFrame(Math.min(startFrame + Math.round(segment.start * frameSpeed) + 1, stopFrame))

                                            setLeftBound(segment.start);
                                            setRightBound(segment.end);
                                            setActivatedIdx(idx)
                                        }
                                        setDragging('left');
                                    }}></div>

                                </div>


                                { activatedIdx === idx && <>
                                    <Button type="primary" style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '50%',
                                        lineHeight: '20px',
                                        zIndex: 1,
                                        translate: '-150% 150%',
                                    }} onClick={()=>{
                                        if (playing) onSwitchPlay(false);
                                        setActivatedIdx(-1)
                                    }}>Cancel Changes</Button>
                                    <Button type="primary" style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '50%',
                                        lineHeight: '20px',
                                        zIndex: 1,
                                        translate: '0% 150%',
                                    }} onClick={()=>{
                                        if (playing) onSwitchPlay(false);
                                        onChangeTranscript(idx, {
                                            ...segment, start: leftBound, end: rightBound
                                        })
                                        changeFrame(Math.min(startFrame + Math.round(leftBound * frameSpeed) + 1, stopFrame))
                                        setActivatedIdx(-1);

                                    }}>Apply Changes</Button>
                                    <div
                                    style={{
                                        position: 'absolute',
                                        left: sliderWidth/2 + MULTIPLIER_WIDTH * ((activatedIdx === idx ? leftBound : segment.start) * frameSpeed - frameNumber),
                                        width: MULTIPLIER_WIDTH * ((activatedIdx === idx ? (rightBound - leftBound) : (segment.end - segment.start)) * frameSpeed),
                                        backgroundColor: color,
                                        opacity: 0.7,
                                        top: 0,
                                        height: '100%'
                                    }}
                                    ></div>
                                    {/* Right slider */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: sliderWidth/2 + MULTIPLIER_WIDTH * ((activatedIdx === idx ? rightBound : segment.end) * frameSpeed - frameNumber),
                                            width: '1px',
                                            height: '100%',
                                            backgroundColor: color
                                        }
                                    }>
                                        <div style={{
                                            ...sliderStyle,
                                            display: activatedIdx === -1 || activatedIdx === idx ? 'block': 'none',
                                            zIndex: 1
                                        }} onMouseDown={() =>{
                                            setDragging('right');
                                        }}></div>
                                    </div>
                                </>
                                }

                            </>
                            )
                        }

                        return <></>

                    })
                }

            </div>
        </>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(WaveformSlider);
