import React, { useEffect, useRef, useState } from 'react';
import {personColors} from './conf'
interface Props {
    appliedStyle: any,
    segment: {
        start: number,
        end: number,
        text: string,
        speaker: string,
    },
    index: number
    scrollFn: (target: HTMLDivElement) => void,
    changeFrame: (frame: number) => void,
    frameSpeed: number,
    stopFrame: number,
    personColors: any,
    onChangeTranscript: (index: number, segment: any) => void,
    isCurrent: boolean,
    playing: boolean,
    onSwitchPlay: (play: boolean) => void
    speakerCount: number,
    isSelected: boolean,
    isLastSelected: boolean,
    clearSelected: () => void;
    changeSpeakerBulk: (speaker: string) => void

}

import {Row, Col, Avatar, Dropdown, Menu} from 'antd'
import {DeleteOutlined, UserOutlined} from '@ant-design/icons'
import './style.scss';
function TransciptUtteranceText(props: Props) {
    const {appliedStyle, scrollFn, isCurrent, playing, onSwitchPlay, changeFrame, segment, frameSpeed, stopFrame,
    personColors, onChangeTranscript, index, speakerCount, isSelected, isLastSelected, clearSelected, changeSpeakerBulk} = props;

    const utteranceRef = useRef<HTMLDivElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [editingText, setEditingText] = useState(false);
    const [editedContent, setEditedContent] = useState(segment?.text)

    useEffect(() => {
        if ((isLastSelected || isCurrent) && utteranceRef.current) {
            scrollFn(utteranceRef.current);
        }

        setEditingText(false);

        if (segment.text !== editedContent) {
            onChangeTranscript(index, {
                ...segment,
                text: editedContent
            })
        }

    }, [isLastSelected, isCurrent]);


    return (
        <>
            <div
                ref={utteranceRef}
                style={{
                    marginTop: 10,
                    cursor: 'pointer',
                    ...appliedStyle,
                    backgroundColor: isSelected ? 'rgb(19, 72, 123)' : 'rgb(0, 21, 41)'
                }}
                onClick={(e) => {
                    clearSelected();
                    if (playing) {
                        onSwitchPlay(false);
                    }
                    changeFrame(Math.min(Math.ceil(segment.start * frameSpeed), stopFrame));
                }}
            >
                <div>
                    {segment.speaker && (
                        <Dropdown overlayClassName='speakerChangeDropDown' overlayStyle={{animationDuration: '0s'}} overlay={<Menu mode="horizontal" style={{
                            backgroundColor: 'rgba(0, 22, 40, 0.5)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            {Array(speakerCount).fill(0).map((_, idx) => (
                                <Menu.Item onClick={()=>{
                                    if (!isSelected) {
                                        onChangeTranscript(index, {
                                            ...segment,
                                            speaker: "SPEAKER_"+(idx)
                                        })
                                    } else {
                                        changeSpeakerBulk("SPEAKER_"+(idx));
                                    }
                                }}>
                                    <div style={{ height: 36}} >
                                    <Avatar
                                    size={32}
                                    icon={<UserOutlined />}
                                    style={{
                                        backgroundColor: personColors[idx],
                                    }}
                                     />
                                    </div>
                                </Menu.Item>
                            ))}
                        </Menu>} trigger={['contextMenu']}>
                        <Avatar
                            size={32}
                            icon={<UserOutlined />}
                            style={{
                                backgroundColor: personColors[parseInt(segment.speaker.split('_')[1])],
                            }}

                        />
                      </Dropdown>

                    )}
                </div>
                <Row>
                    <Col span={2}>
                        {isCurrent && (
                            <DeleteOutlined
                                style={{ fontSize: 12 }}
                                onClick={() => {
                                    onChangeTranscript(index, null);
                                }}
                            />
                        )}
                    </Col>
                    <Col span={21}>
                        <div onDoubleClick={() => {
                            if (isCurrent) {
                                setEditingText(true);
                            }
                        }} >
                            {editingText && <textarea ref={textareaRef} style={{
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                height: textareaRef.current && textareaRef.current.scrollHeight || 'auto',
                                resize: 'none'
                            }} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} ></textarea>}
                            {!editingText && segment.text}
                        </div>
                    </Col>
                    <Col span={1}></Col>
                </Row>
            </div>
        </>
    );
}


export default React.memo(TransciptUtteranceText);