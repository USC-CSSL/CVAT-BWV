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
    modalUpdateAsync,
    removeObject,
    updateAnnotationsAsync,
} from 'actions/annotation-actions';
import getAutoIncrementedIdentifierAttr from 'utils/label-identifier-auto-increment';
import Popover from 'antd/lib/popover';
import AudioSelectorPopover from './audioselectorpopover';

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
}

interface DispatchToProps {
    onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[], cb: Function | null): void
    onUpdateAnnotations(states: ObjectState[]): void;
    onRemoveAnnotation(objectState: any): void;
    showPersonModal(people: any[], mode: string): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onCreateAnnotations(sessionInstance: any, frame: number, states: any[], cb: Function | null = null): void {
            dispatch(createAnnotationsAsync(sessionInstance, frame, states, cb));
        },
        onUpdateAnnotations(states: ObjectState[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
        onRemoveAnnotation(objectState: any): void {
            dispatch(removeObject(objectState, false));
        },
        showPersonModal(people: any[], mode: string): void {
            dispatch(modalUpdateAsync({
                people,
                visible: true,
                mode
            }))
        }
    };
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
                audio: {
                    preview: audioPreview
                }
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
        states,
        audioPreview
    };
}

interface Props {
    isPhase2: boolean;
}



function AudioSelector(props: StateToProps & DispatchToProps & Props): JSX.Element {

    const [audioselections, setAudioSelections] = useState<any[]>([]);
    const {states, showPersonModal} = props;

    const [newAudioSelectorPopoverOpen, setNewAudioSelectorPopoverOpen] = useState(false);


    useEffect(() => {
        setAudioSelections(states.filter(((s: any)  => s.objectType === ObjectType.AUDIOSELECTION)));
    }, [states])


    const [showControls, setShowControls] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const [imageData, setImageData] = useState('');

    const {
        startFrame, stopFrame, frameNumber, labels, jobInstance,
        onCreateAnnotations,
        onUpdateAnnotations,
        onRemoveAnnotation,
        isPhase2,
        audioPreview,
    } = props;

    const personLabels = labels.filter(label => label.name.startsWith('person:'));

    const [newAudioSelectorLabel, setNewAudioSelectorLabel] = useState<any>(null);

    useEffect(() => {
        if (audioPreview.length) {
            const offScreenCVS = document.createElement('canvas');
            const offScreenCTX = offScreenCVS.getContext("2d");
            const mx = Math.max(...audioPreview);
            offScreenCVS.width = 2048;
            offScreenCVS.height = 64;

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
    }, [audioPreview])

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
                                        <Col span={4}></Col>
                                        <Col span={20}>
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
                                    labels={personLabels}
                                    startFrame={startFrame}
                                    stopFrame={stopFrame}
                                    frameNumber={frameNumber}
                                    selectionObject={audioselection}
                                    jobInstance={jobInstance}
                                    onUpdateAnnotations={onUpdateAnnotations}
                                    onRemoveAnnotation={onRemoveAnnotation}
                                    imageData={imageData}
                                    />
                            ))
                        }
                        {!isPhase2 &&
                        <div style={{display: 'flex'}}>
                        {/* <CVATTooltip title={`Click to highlight a section from audio`} >
                            <Button
                                type='primary'
                                className='cvat-add-tag-button'
                                style={{margin: 'auto'}}
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    const label = labels.filter((label: any) => label.id === labels[0].id)[0];
                                    const attrId = label.attributes[0]?.id;
                                    const objectState = new cvat.classes.ObjectState({
                                        objectType: ObjectType.AUDIOSELECTION,
                                        label:label,
                                        frame: frameNumber,
                                        audio_selected_segments: [
                                            {
                                                start: frameNumber,
                                                end: Math.min(frameNumber + 40, stopFrame)
                                            }
                                        ],
                                        attributes: {
                                            [attrId]: getAutoIncrementedIdentifierAttr(label).toString(),
                                        }
                                    });
                                    onCreateAnnotations(jobInstance, frameNumber, [objectState]);
                                }}
                            />
                        </CVATTooltip> */}
                        <Popover
                                overlayClassName='cvat-add-audioselection-popover'
                                placement='right'
                                trigger="click"
                                visible={newAudioSelectorPopoverOpen}
                                onVisibleChange={(visible) => {
                                    setNewAudioSelectorPopoverOpen(visible);
                                }}

                                content={
                                    <AudioSelectorPopover
                                        selectedLabelID={newAudioSelectorLabel && newAudioSelectorLabel.id}
                                        onChangeLabel={(val) => {
                                            setNewAudioSelectorLabel(val);
                                        }}
                                        labels={personLabels}
                                        jobInstance={jobInstance}
                                        onAdd={()=> {
                                            if (newAudioSelectorLabel) {
                                                const label = newAudioSelectorLabel;
                                                const attrId = label.attributes[0]?.id;
                                                const objectState = new cvat.classes.ObjectState({
                                                    objectType: ObjectType.AUDIOSELECTION,
                                                    label:label,
                                                    frame: frameNumber,
                                                    audio_selected_segments: [
                                                        {
                                                            start: frameNumber,
                                                            end: Math.min(frameNumber + 150, stopFrame)
                                                        }
                                                    ],
                                                    attributes: {
                                                        [attrId]: getAutoIncrementedIdentifierAttr(label).toString(),
                                                    }
                                                });
                                                onCreateAnnotations(jobInstance, frameNumber, [objectState], (clientIds: number[]) => {
                                                    // if (label.name.startsWith('person:') && clientIds.length) {
                                                    //     showPersonModal([{
                                                    //         clientID: clientIds[0],
                                                    //         frameNumber: objectState.frame
                                                    //     }], 'person_demographics');
                                                    // }
                                                });
                                                setNewAudioSelectorLabel(null);
                                                setNewAudioSelectorPopoverOpen(false);
                                            }

                                        }
                                        }
                                    ></AudioSelectorPopover>
                                }
                            >
                                <Button
                                type='primary'
                                className='cvat-add-tag-button'
                                style={{margin: 'auto'}}
                                icon={<PlusOutlined />}></Button>
                        </Popover>
                        </div>}
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