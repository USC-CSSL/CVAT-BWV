import React, { useEffect, useRef, useState } from 'react';
import './audioselector.scss';
import LabelSelector from 'components/label-selector/label-selector';
import { Col, Row } from 'antd/lib/grid';
import { Canvas } from 'cvat-canvas-wrapper';
import { CombinedState, ObjectType } from 'reducers';
import { Space } from 'antd';
import { getCore, Job, ObjectState } from 'cvat-core-wrapper';
interface Props{
    labels: any[],
    startFrame: number,
    stopFrame: number,
    frameNumber: number,
    index: number,
    jobInstance: Job,

    onCreateAnnotations(sessionInstance: Job, frame: number, states: ObjectState[]): void,
    onUpdateAnnotations(states: ObjectState[]): void
}

const cvat = getCore();


export interface Selector{
    selections: {
        start: number,
        end: number;
    }[];
    removed: boolean;
}



export default function AudioSelectorItem (props: Props) {
    const {
        startFrame, stopFrame, labels,frameNumber, index, jobInstance,
        onCreateAnnotations,
        onUpdateAnnotations,
    } = props;


    const [dragging, setDragging] = useState<string | null>(null);
    const [selectedLabelID, setSelectedLabelID] = useState<number>(labels[0].id);
    const [selector, setSelector] = useState<Selector | null>(null);


    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        const newSelector = {
            selections: [
                {
                    start: frameNumber,
                    end: Math.min(frameNumber + 40, stopFrame)
                }
            ],
            removed: false,
        }

        setSelector(newSelector);


    }, [])

    return (
        selector && !selector.removed ?
        <div>
        <Row >
            <Col span={4}>
                <Space>
                    <LabelSelector labels={labels} value={selectedLabelID} onChange={(value: any) => setSelectedLabelID(value.id)}/>
                </Space>

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

                                newPos = Math.max(Math.min(newPos, selector.selections[0].end - 5), 0);
                                setSelector({
                                    ...selector,
                                    selections: [{
                                        ...selector.selections[0],
                                        start: newPos,
                                    }]
                                })
                            }
                            else if (dragging === 'right') {
                                let newPos = (
                                    selectorRef.current &&
                                    (clientX - selectorBoundingRectX) / selectorBoundingRectWidth
                                    ) * (stopFrame - startFrame) + startFrame;
                                newPos = Math.min(Math.max(newPos, selector.selections[0].start + 5), stopFrame - startFrame)
                                setSelector({
                                    ...selector,
                                    selections: [{
                                        ...selector.selections[0],
                                        end: newPos,
                                    }]
                                })
                            }
                        }
                    }}
                >
                    <div className='audioselector-selection'
                        style={{
                            left: `${selector.selections[0].start * 100 / (stopFrame - startFrame)}%`,
                            width: `${(selector.selections[0].end - selector.selections[0].start) * 100 / (stopFrame - startFrame)}%`
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