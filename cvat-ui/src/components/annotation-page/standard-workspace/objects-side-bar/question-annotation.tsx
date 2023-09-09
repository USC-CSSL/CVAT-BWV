// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { Dispatch, TransitionEvent, useEffect, useState } from 'react';
import { AnyAction } from 'redux';
import { connect } from 'react-redux';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Text from 'antd/lib/typography/Text';
import Tabs from 'antd/lib/tabs';
import Layout from 'antd/lib/layout';

import { CombinedState, ObjectType } from 'reducers';
import { DimensionType } from 'cvat-core-wrapper';
import { collapseSidebar as collapseSidebarAction, lockAllAnnotations, switchPlay } from 'actions/annotation-actions';
import Collapse from 'antd/lib/collapse';
import Radio from 'antd/lib/radio';
import Space from 'antd/lib/space';

interface OwnProps {
}

interface StateToProps {
    sidebarCollapsed: boolean;
    jobInstance: any;
    frame: number;
    pausePoints: number[];
    statesInFrame: any[];
}

interface DispatchToProps {
    collapseSidebar(): void;
    lockAllObjects(): void;
    onSwitchPlay(playing: boolean): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            sidebarCollapsed,
            job: { instance: jobInstance },
            annotations: {
                states
            },
            player: {
                frame: {
                    number: frameNumber
                }
            }
        },

    } = state;

    const pausePoints: number[] = [];
    const statesInFrame: any[] = [];
    states.forEach((objState) => {
        if (objState.objectType !==  ObjectType.AUDIOSELECTION) {
            if (!pausePoints.includes(objState.frame)) {
                pausePoints.push(objState.frame);
            }

            if (objState.frame === frameNumber) {
                statesInFrame.push(objState);

            }
        } else {
            objState.audio_selected_segments?.forEach((sgmt: any) => {
                if (!pausePoints.includes(sgmt.end)) {
                    pausePoints.push(sgmt[1]);
                }

                if (frameNumber >= sgmt.start && frameNumber <= sgmt.end) {
                    statesInFrame.push(objState);
                }
            });

        }
    });


    return {
        sidebarCollapsed,
        jobInstance,
        frame: frameNumber,
        pausePoints,
        statesInFrame
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        collapseSidebar(): void {
            dispatch(collapseSidebarAction());
        },
        lockAllObjects(): void {
            dispatch(lockAllAnnotations());
        },
        onSwitchPlay(playing: boolean): void {
            dispatch(switchPlay(playing));
        },
    };
}

function QuestionsSideBar(props: StateToProps & DispatchToProps & OwnProps): JSX.Element {
    const {
        sidebarCollapsed, collapseSidebar, jobInstance, lockAllObjects, frame, pausePoints, onSwitchPlay, statesInFrame
    } = props;

    const [questionAns, setQuestionAns] = useState<any>({});

    useEffect(() => {
        lockAllObjects();
    }, [frame]);

    useEffect(() => {
        if (pausePoints.includes(frame)) {
            onSwitchPlay(false);
        }
    }, [frame])

    const collapse = (): void => {
        const [collapser] = window.document.getElementsByClassName('cvat-objects-sidebar');
        const listener = (event: TransitionEvent): void => {
            if (event.target && event.propertyName === 'width' && event.target === collapser) {
                window.dispatchEvent(new Event('resize'));
                (collapser as HTMLElement).removeEventListener('transitionend', listener as any);
            }
        };

        if (collapser) {
            (collapser as HTMLElement).addEventListener('transitionend', listener as any);
        }

        collapseSidebar();
    };


    const peopleInFrame = {};
    statesInFrame.forEach((state) => {
        peopleInFrame[`${state.label.name} ${state.attributes[state.label.attributes[0].id]}`] = {
            label: state.label.name
        }
    })
    return (
        // <Layout.Sider
        //     className='cvat-objects-sidebar'
        //     theme='light'
        //     width={300}
        //     collapsedWidth={0}
        //     reverseArrow
        //     collapsible
        //     trigger={null}
        //     collapsed={sidebarCollapsed}
        // >
        //     {/* eslint-disable-next-line */}
        //     <span
        //         className={`cvat-objects-sidebar-sider
        //             ant-layout-sider-zero-width-trigger
        //             ant-layout-sider-zero-width-trigger-left`}
        //         onClick={collapse}
        //     >
        //         {sidebarCollapsed ? <MenuFoldOutlined title='Show' /> : <MenuUnfoldOutlined title='Hide' />}
        //     </span>

        //     Questions
        //     <Tabs type='card' defaultActiveKey='objects' className='cvat-objects-sidebar-tabs'>
        //         {Object.keys(peopleInFrame).map((personName) => (
        //             <>
        //                 <Tabs.TabPane tab={<Text strong>{personName}</Text>} key='objects'>
        //                 <Collapse className='cvat-objects-sidebar-state-item-elements-collapse'>
        //                     <Collapse.Panel
        //                         header={(
        //                             <>
        //                                 <Text style={{ fontSize: 10 }} type='secondary'>DEMOGRAPHICS</Text>
        //                                 <br />
        //                             </>
        //                         )}
        //                         key='demographic'
        //                     >
        //                         <Text>Demographic Question 1</Text><br/>
        //                         <Radio.Group name={`${personName}Q1`} onChange={(e) => {
        //                             setQuestionAns({
        //                                 ...questionAns,
        //                                 [personName]: {
        //                                     ...questionAns[personName],
        //                                     [e.target.name]: e.target.value
        //                                 }
        //                             })
        //                         }} value={null}>
        //                             <Space direction="vertical">
        //                                 <Radio value={1}>Option A</Radio>
        //                                 <Radio value={2}>Option B</Radio>
        //                                 <Radio value={3}>Option C</Radio>

        //                             </Space>
        //                         </Radio.Group>
        //                     </Collapse.Panel>
        //                     <Collapse.Panel
        //                         header={(
        //                             <>
        //                                 <Text style={{ fontSize: 10 }} type='secondary'>BEHAVIOUR</Text>
        //                                 <br />
        //                             </>
        //                         )}
        //                         key='behavior'
        //                     >
        //                         <Text>Behaviour Question 1</Text><br/>
        //                         <Radio.Group name={`${personName}Q2`} onChange={(e) => {
        //                             setQuestionAns({
        //                                 ...questionAns,
        //                                 [personName]: {
        //                                     ...questionAns[personName],
        //                                     [e.target.name]: e.target.value
        //                                 }
        //                             })
        //                         }} value={null}>
        //                             <Space direction="vertical">
        //                                 <Radio value={1}>Option A</Radio>
        //                                 <Radio value={2}>Option B</Radio>
        //                                 <Radio value={3}>Option C</Radio>

        //                             </Space>
        //                         </Radio.Group>
        //                     </Collapse.Panel>
        //                 </Collapse>
        //                 </Tabs.TabPane>
        //             </>
        //         )) }


        //     </Tabs>
        // </Layout.Sider>
        <></>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(QuestionsSideBar));
