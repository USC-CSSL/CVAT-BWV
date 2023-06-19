import React, { useRef, useState } from 'react';
import './audioselector.scss';
import LabelSelector from 'components/label-selector/label-selector';
import { Col, Row } from 'antd/lib/grid';
import { Canvas } from 'cvat-canvas-wrapper';
import { CombinedState } from 'reducers';
import { Space } from 'antd';
interface Props{
    labels: any[],
    startFrame: number,
    stopFrame: number,
    frameNumber: number
}



export default function AudioSelectorItem (props: Props) {
    const {startFrame, stopFrame, frameNumber, labels} = props;
    const [bounds, setBounds] = useState([frameNumber - startFrame, Math.min(frameNumber + 40, stopFrame - startFrame)]);
    const [dragging, setDragging] = useState<string | null>(null);
    const [selectedLabelID, setSelectedLabelID] = useState<number | null>(0);


    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);

    return (
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
                                const newPos = (
                                    selectorRef.current &&
                                    (clientX - selectorBoundingRectX) / selectorBoundingRectWidth
                                    ) * (stopFrame - startFrame) + startFrame;
                                setBounds((bound) => [Math.max(Math.min(newPos, bound[1] - 5), 0), bound[1]])
                            }
                            else if (dragging === 'right') {
                                const newPos = (
                                    selectorRef.current &&
                                    (clientX - selectorBoundingRectX) / selectorBoundingRectWidth
                                    ) * (stopFrame - startFrame) + startFrame;
                                setBounds((bound) => [bound[0], Math.min(Math.max(newPos, bound[0] + 5), stopFrame - startFrame)])
                            }
                        }
                    }}
                >
                    <div className='audioselector-selection'
                        style={{
                            left: `${bounds[0] * 100 / (stopFrame - startFrame)}%`,
                            width: `${(bounds[1] - bounds[0]) * 100 / (stopFrame - startFrame)}%`
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
    </div>);
}