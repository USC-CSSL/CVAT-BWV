import { changeFrameAsync, updateTranscriptBulk, fetchTranscriptAsync, switchPlay, updateTranscript } from 'actions/annotation-actions';
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
    onChangeTranscriptBulk(indexes: number[], segments: any[]): void;
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
        onChangeTranscriptBulk(indexes: number[], segments: any[]) {
            dispatch(updateTranscriptBulk(indexes, segments));
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

    const [currentIdx, setCurrentIdx] = useState(-1);
    const [speakerCount, setSpeakerCount] = useState(0);

    const [selected, setSelected] = useState<number[]>([]);


    useEffect(() => {
        const currentTimeInSeconds = (frameNumber - startFrame) / frameSpeed;
        let cIdx = -1;
        const speakers = new Set();
        transcriptData && transcriptData.segments.forEach((segment: any, index: number) => {
            if (currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end) {
                cIdx = index;
            }
            segment.speaker && speakers.add(parseInt(segment.speaker.split('_')[1]))

        });

        setCurrentIdx(cIdx)

        setSpeakerCount(speakers.size)
    }, [frameNumber])


    const scrollFn = useCallback((node: HTMLDivElement) => {
       if (node) {
        node.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        })
       }
      }, []);

    const clearSelected = useCallback(() => {
        setSelected([]);
    }, []);

    const changeSpeakerBulk = useCallback((speaker: string) => {
        const sel = Array.from(new Set(selected));
        const segments = [];
        for( const idx of sel) {
            segments.push({
                ...transcriptData.segments[idx],
                speaker: speaker
            })
        }

        updateTranscriptBulk(sel, segments);
    }, [selected, transcriptData])
    useEffect(() => {
        const keyDownFn = (event: KeyboardEvent) => {
            if (event.shiftKey && event.key === 'ArrowUp') {
                if (!selected.length) {
                    selected.push(currentIdx);
                    selected.push(currentIdx - 1);
                }
                else if (currentIdx < selected[selected.length - 1]) {
                    selected.pop();
                }
                else {
                    if (selected[selected.length - 1] > 0) {
                        selected.push(selected[selected.length - 1] - 1);
                    }
                }
            } else if (event.shiftKey && event.key === 'ArrowDown') {
                if (!selected.length) {
                    selected.push(currentIdx);
                    selected.push(currentIdx + 1);
                }
                else if (currentIdx > selected[selected.length - 1]) {
                    selected.pop();
                }
                else {
                    if (selected[selected.length - 1] < transcriptData?.segments?.length) {
                        selected.push(selected[selected.length - 1] + 1);
                    }
                }

            }
            setSelected([...selected]);
        }


        document.addEventListener('keydown', keyDownFn);

        return () => {
            document.removeEventListener('keydown', keyDownFn);
        }
    }, [selected, currentIdx, transcriptData]);

    useEffect(() => {
        if (!transcriptData && !transcriptFetching) {
            fetchTranscript();
        }

    }, []);

    useEffect(() => {
        setSelected([]);
    }, [transcriptData])




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

                    return <TranscriptUtteranceText
                        key={segment.key}
                        speakerCount={speakerCount}
                        appliedStyle={appliedStyle} isCurrent={isCurrent} stopFrame={stopFrame}
                        scrollFn={scrollFn} changeFrame={changeFrame} playing={playing}
                        segment={segment} index={index} personColors={personColors} frameSpeed={frameSpeed}
                        onSwitchPlay={onSwitchPlay} onChangeTranscript={onChangeTranscript}
                        isSelected={selected.includes(index)}
                        isLastSelected={selected && selected[selected.length - 1] === index}
                        clearSelected={clearSelected}
                        changeSpeakerBulk={changeSpeakerBulk}
                    />
                }
                )}
            </>}
        </div>
       </Layout.Sider>
    </>



}

export default connect(mapStateToProps, mapDispatchToProps)(TranscriptPlayerComponent);
