import { changeFrameAsync, fetchAudioAsync, fetchAudioPreviewAsync, fetchTranscriptAsync, switchPlay } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {connect} from 'react-redux';
import { CombinedState } from 'reducers';
import Layout from 'antd/lib/layout';
import {UserOutlined} from '@ant-design/icons'
import {Avatar} from 'antd';

interface StateToProps {
    transciptData: any,
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
                    data: transciptData,
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
        transciptData,
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
    }
}

const personColors = ['#6b5b95', '#feb236', '#d64161' ,'#ff7b25', '#86af49', '#c0ded9', '#563f46'];
function TranscriptPlayerComponent(props: StateToProps & DispatchToProps) {
    const {transciptData, transcriptFetching, playing, frameNumber, frameSpeed, startFrame, stopFrame,
        fetchTranscript, onSwitchPlay, changeFrame} = props;

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
        if (!transciptData && !transcriptFetching) {
            fetchTranscript();
        }

    }, [])

    const currentStyle = {
        fontWeight: 'bold',
        opacity: '100%'
    }

    const otherStyle = {
        opacity: '50%'
    }

    const currentTimeInSeconds = (frameNumber - startFrame) / frameSpeed;
    return <>
       <Layout.Sider width={300} style={{fontSize: 18, overflowY: 'scroll'}}>
        <div style={{padding: '10px', textAlign: 'center', color: 'white'}}>
            {!transciptData && !transcriptFetching && 'No Transcript'}
            {!transciptData && transcriptFetching && 'Loading Transcript...'}
            {transciptData && <>
                {transciptData.segments.map((segment: any) =>
                {
                    const isCurrent = currentTimeInSeconds > segment.start && currentTimeInSeconds < segment.end;
                    const appliedStyle = (isCurrent) ? currentStyle : otherStyle;
                    return <>

                    <div style={{
                        marginTop: 10,
                        cursor: 'pointer',
                        ...appliedStyle
                        }}
                        ref={isCurrent ? scrollFn : null}
                        onClick={(e) => {
                            scrollFn(e.target as HTMLDivElement)
                            if (playing) {
                                onSwitchPlay(false);
                            }
                            changeFrame(Math.min(Math.ceil(segment.start * frameSpeed), stopFrame))
                        }}
                        >
                        <div>{segment.speaker &&

                            <Avatar size={32} icon={<UserOutlined />} style={{
                                backgroundColor: personColors[parseInt(segment.speaker.split('_')[1]) - 1],
                            }} />
                        }</div>
                        <div contentEditable={isCurrent}>{segment.text}</div>

                    </div>
                    </>
                }
                )}
            </>}
        </div>
       </Layout.Sider>
    </>



}

export default connect(mapStateToProps, mapDispatchToProps)(TranscriptPlayerComponent);
