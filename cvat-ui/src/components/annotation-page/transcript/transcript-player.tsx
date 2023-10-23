import { changeFrameAsync, fetchAudioAsync, fetchAudioPreviewAsync, fetchTranscriptAsync, switchPlay, updateTranscript } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {connect} from 'react-redux';
import { CombinedState } from 'reducers';
import Layout from 'antd/lib/layout';
import {Row, Col} from 'antd'
import {UserOutlined} from '@ant-design/icons'
import {Avatar} from 'antd';
import {personColors} from './conf'

import {
    DeleteOutlined
  } from '@ant-design/icons';
import TranscriptUtteranceText from './transcript-utterance-text';

interface StateToProps {
    transcriptData: any,
    transcriptFetching: boolean;
    startFrame: number;
    stopFrame: number;
    canvasIsReady: boolean;
    playing: boolean;
    frameNumber: number;
    frameSpeed: number;
}

interface DispatchToProps {
    fetchTranscript: () => void;
    changeFrame: (frame: number) => void;
    onSwitchPlay: (play: boolean) => void;
    onChangeTranscript(index: number, segment: any): void;
}


function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            job: {
                instance: {
                    startFrame,
                    stopFrame
                }
            },
            player: {
                transcript: {
                    data: transcriptData,
                    fetching: transcriptFetching,

                },
                playing,
                frame: {
                    number: frameNumber,
                },
            },
            canvas: {
                ready: canvasIsReady
            }
        },
        settings: {
            player: {
                frameSpeed
            }
        }
    } = state;
    return {
        transcriptData,
        transcriptFetching,
        canvasIsReady,
        playing,
        frameNumber,
        startFrame,
        stopFrame,
        frameSpeed
    }
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        fetchTranscript: (): void => dispatch(fetchTranscriptAsync()),
        changeFrame(frame: number): void {
            dispatch(changeFrameAsync(frame));
        },
        onSwitchPlay(playing: boolean): void {
            dispatch(switchPlay(playing));
        },
        onChangeTranscript(index: number, segment: any): void {
            dispatch(updateTranscript(index, segment));
        },
    }
}

const currentStyle = {
    fontWeight: 'bold',
    opacity: '100%'
}

const otherStyle = {
    opacity: '50%'
}



function TranscriptPlayerComponent(props: StateToProps & DispatchToProps) {
    const {transcriptData, transcriptFetching, playing, frameNumber, frameSpeed, startFrame, stopFrame,
        fetchTranscript, onSwitchPlay, changeFrame, onChangeTranscript} = props;


    const scrollFn = useCallback((node: HTMLDivElement) => {
       if (node) {
        node.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        })
       }
      }, []);
    useEffect(() => {
        if (!transcriptData && !transcriptFetching) {
            fetchTranscript();
        }

    }, []);


    const currentTimeInSeconds = (frameNumber - startFrame) / frameSpeed;
    let currentIdx = -1;
    const speakers = new Set();
    transcriptData && transcriptData.segments.forEach((segment: any, index: number) => {
        if (currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end) {
            currentIdx = index;
        }
        segment.speaker && speakers.add(parseInt(segment.speaker.split('_')[1]))

    });

    return <>
       <Layout.Sider width={300} style={{fontSize: 18, overflowY: 'scroll'}}>
        <div style={{padding: '10px', textAlign: 'center', color: 'white'}}>
            {!transcriptData && !transcriptFetching && 'No Transcript'}
            {!transcriptData && transcriptFetching && 'Loading Transcript...'}
            {transcriptData && <>
                {transcriptData.segments.map((segment: any, index: number) =>
                {
                    const isCurrent = currentIdx === index;
                    const appliedStyle = (isCurrent) ? currentStyle : otherStyle;
                    // return <>

                    // <div style={{
                    //     marginTop: 10,
                    //     cursor: 'pointer',
                    //     ...appliedStyle
                    //     }}
                    //     ref={isCurrent ? scrollFn : null}
                    //     onClick={(e) => {
                    //         scrollFn(e.target as HTMLDivElement)
                    //         if (playing) {
                    //             onSwitchPlay(false);
                    //         }
                    //         changeFrame(Math.min(Math.ceil(segment.start * frameSpeed), stopFrame))
                    //     }}
                    //     >
                    //     <div>{segment.speaker &&

                    //         <Avatar size={32} icon={<UserOutlined />} style={{
                    //             backgroundColor: personColors[parseInt(segment.speaker.split('_')[1]) ],
                    //         }} />
                    //     }</div>
                    //     <Row ><Col span={2}>{isCurrent && <DeleteOutlined style={{fontSize: 12}} onClick={()=>{
                    //         onChangeTranscript(index, null);
                    //     }}/>}</Col><Col span={21}><div contentEditable={isCurrent}>{segment.text}</div></Col><Col span={1}></Col></Row>
                    // </div>
                    // </>

                    return <TranscriptUtteranceText
                        speakerCount={speakers.size}
                        appliedStyle={appliedStyle} isCurrent={isCurrent} stopFrame={stopFrame}
                        scrollFn={scrollFn} changeFrame={changeFrame} playing={playing}
                        segment={segment} index={index} personColors={personColors} frameSpeed={frameSpeed}
                        onSwitchPlay={onSwitchPlay} onChangeTranscript={onChangeTranscript}
                    />
                }
                )}
            </>}
        </div>
       </Layout.Sider>
    </>



}

export default connect(mapStateToProps, mapDispatchToProps)(TranscriptPlayerComponent);
