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
    phase: string;
    images: any | null;
    audios: any | null;
    playAudio: (play: boolean, frame: number) => void

}

import {Row, Col, Avatar, Dropdown, Menu} from 'antd'
import {DeleteOutlined, SoundOutlined, UserOutlined} from '@ant-design/icons'
import './style.scss';
function TransciptUtteranceText(props: Props) {
    const {
        appliedStyle, scrollFn, isCurrent, playing, onSwitchPlay, changeFrame, segment, frameSpeed, stopFrame,
    personColors, onChangeTranscript, index, speakerCount, isSelected, isLastSelected, clearSelected, changeSpeakerBulk,
    phase, images, audios, playAudio

} = props;

    console.log(images);

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

    const speakerColorId = segment.speaker && parseInt(segment.speaker.split('_')[1]);
    const speakerClientId = segment.speaker && segment.speaker.split('_')[2] && parseInt(segment.speaker.split('_')[2]);

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
                        <Dropdown
                            overlayClassName='speakerChangeDropDown'
                            onVisibleChange={() => {
                                onSwitchPlay(false);
                            }}
                            overlayStyle={{animationDuration: '0s'}}
                            overlay={<Menu mode="horizontal" style={{
                            backgroundColor: 'rgba(0, 22, 40, 0.5)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            {phase === 'phase0' && Array(speakerCount).fill(0).map((_, idx) => (
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
                            {phase === 'phase1a' &&  images &&
                                Array(Object.keys(images).length).fill(0).map((_, idx) => (
                                    <Menu.Item onClick={()=>{
                                        onChangeTranscript(index, {
                                            ...segment,
                                            speaker: "SPEAKER_"+speakerColorId+'_'+(Object.keys(images)[idx])
                                        })
                                    }}>
                                        <div style={{ height: 66}} >
                                        <Avatar
                                        size={64}

                                        style={{
                                            border: `2px solid ${personColors[speakerColorId]}`,
                                            backgroundImage: `url(${images[Object.keys(images)[idx]]})`,
                                            backgroundSize: 'contain',
                                        }}
                                        />
                                        </div>
                                    </Menu.Item>
                                ))
                            }
                            {phase === 'phase1a' &&  audios &&
                                Array(Object.keys(audios).length).fill(0).map((_, idx) => (
                                    <Menu.Item onClick={()=>{
                                        onChangeTranscript(index, {
                                            ...segment,
                                            speaker: "SPEAKER_"+speakerColorId+'_'+(Object.keys(audios)[idx])
                                        })
                                    }}>
                                        <div style={{ height: 66}}
                                            onMouseEnter={() => {
                                                playAudio(true, audios[Object.keys(audios)[idx]])
                                            }}

                                            onMouseLeave={() => {
                                                playAudio(false, 0);
                                            }}
                                        >
                                        <Avatar
                                        size={64}
                                        icon={<SoundOutlined />}
                                        style={{
                                            backgroundColor: personColors[speakerColorId],
                                        }}
                                        />
                                        </div>
                                    </Menu.Item>
                                ))
                            }
                        </Menu>} trigger={['contextMenu']}>
                        <Avatar
                            size={32}
                            icon={
                                speakerClientId ?
                                    (images[speakerClientId] ? <></> : <SoundOutlined />)
                                    : <UserOutlined />
                            }
                            style={{
                                backgroundColor: personColors[speakerColorId],
                                backgroundImage: speakerClientId && images[speakerClientId] ? `url(${images[speakerClientId]})` :undefined,
                                backgroundSize: 'contain',
                                border: speakerClientId ? `2px solid ${personColors[speakerColorId]}` : undefined,
                            }}

                        />
                      </Dropdown>

                    )}
                </div>
                <Row>
                    <Col span={2}>

                        {isCurrent && phase === 'phase0' && (
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
                            if (isCurrent && phase === 'phase0') {
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