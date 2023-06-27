import React, { useEffect, useRef, useState } from 'react';
import './audioselector.scss';
import LabelSelector from 'components/label-selector/label-selector';
import { Col, Row } from 'antd/lib/grid';
import { Canvas } from 'cvat-canvas-wrapper';
import { CombinedState, ObjectType } from 'reducers';
import { Space } from 'antd';
import { getCore, Job, ObjectState } from 'cvat-core-wrapper';
import { number } from 'prop-types';
import DeleteOutlined from '@ant-design/icons/lib/icons/DeleteOutlined';
interface Props{
    labels: any[],
    startFrame: number,
    stopFrame: number,
    frameNumber: number,
    jobInstance: Job,
    selectionObject: {
        audio_selected_segments: {start: number, end: number}[]
        label: any
    },
    onRemoveAnnotation(objectState: any): void;
    onUpdateAnnotations(states: ObjectState[]): void
}

const cvat = getCore();




export default function AudioSelectorItem (props: Props) {
    const {
        startFrame, stopFrame, labels, selectionObject,
        onUpdateAnnotations, onRemoveAnnotation
    } = props;


    const [dragging, setDragging] = useState<string | null>(null);


    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);


    return (
        selectionObject.audio_selected_segments.length ?
        <div>
        <Row >
            <Col span={3}>
                <div style={{display: 'flex', height: '100%'}}>
                <Space style={{margin: 'auto'}}>
                    <LabelSelector labels={labels} value={selectionObject.label.id} onChange={(label: any) => {
                        selectionObject.label = label;
                        onUpdateAnnotations([selectionObject])
                    }}/>
                </Space>
                </div>
            </Col>
            <Col span={1}>
                <div style={{display: 'flex', height: '100%'}}>
                    <DeleteOutlined style={{margin: 'auto'}} onClick={() => onRemoveAnnotation(selectionObject)}/>
                </div>
            </Col>
            <Col span={20}>
                <div className='audioselector-selector'
                    ref={selectorRef}
                    onMouseUp={() => setDragging(null)}
                    onMouseMove={(e)=>{
                        if (dragging && selectorRef.current) {
                            const clientX = e.clientX;
                            const selectorBoundingRectX = selectorRef.current.getBoundingClientRect().x;
                            const selectorBoundingRectWidth = selectorRef.current.getBoundingClientRect().width;
                            if (dragging === 'left') {

                                // const diff = e.clientX - (leftRef.current?.getBoundingClientRect().x || 0);
                                let newPos = (
                                    selectorRef.current &&
                                    (clientX - selectorBoundingRectX) / selectorBoundingRectWidth
                                    ) * (stopFrame - startFrame) + startFrame;

                                newPos = Math.max(Math.round(Math.min(newPos, selectionObject.audio_selected_segments[0].end - 5)), 0);

                                selectionObject.audio_selected_segments = [{
                                    start: newPos,
                                    end: selectionObject.audio_selected_segments[0].end
                                }];
                                onUpdateAnnotations([selectionObject])

                            }
                            else if (dragging === 'right') {
                                let newPos = (
                                    selectorRef.current &&
                                    (clientX - selectorBoundingRectX) / selectorBoundingRectWidth
                                    ) * (stopFrame - startFrame) + startFrame;
                                newPos = Math.min(Math.round(Math.max(newPos,  selectionObject.audio_selected_segments[0].start + 5)), stopFrame - startFrame)
                                selectionObject.audio_selected_segments = [{
                                    start: selectionObject.audio_selected_segments[0].start,
                                    end: newPos
                                }];
                                onUpdateAnnotations([selectionObject])
                            }
                        }
                    }}
                >
                    <div className='audioselector-selection'
                        style={{
                            left: `${selectionObject.audio_selected_segments[0].start * 100 / (stopFrame - startFrame)}%`,
                            width: `${
                                (
                                    selectionObject.audio_selected_segments[0].end - selectionObject.audio_selected_segments[0].start
                                ) * 100 / (stopFrame - startFrame)
                            }%`
                        }}
                        onMouseUp={() => setDragging(null)}
                    >
                        <div className='audioselector-dragbars audioselector-dragbar-left'
                            onMouseDown={()=> setDragging('left')}
                            ref={leftRef}
                            onMouseUp={() => setDragging(null)}

                        ></div>
                        <div className='audioselector-dragbars audioselector-dragbar-right'
                            onMouseDown={()=> setDragging('right')}
                            ref={rightRef}
                            onMouseUp={() => setDragging(null)}
                        ></div>
                    </div>
                </div>
            </Col>
        </Row>
    </div> : <></>);
}