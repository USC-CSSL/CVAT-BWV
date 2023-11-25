import { changeFrameAsync, updateTranscriptBulk, fetchTranscriptAsync, switchPlay, updateTranscript } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {connect} from 'react-redux';
import { CombinedState, ObjectType } from 'reducers';
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
    phase: string;
    allStates: any[];
    allStatesFrameImages: any[];
    audioData: any
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
                    stopFrame,
                    phase,
                }
            },
            annotations: {
                allStates,
                allStatesFrameImages
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
                audio: {
                    data: audioData,
                }
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
        frameSpeed,
        phase,
        allStates: phase === 'phase0' ? [] : allStates,
        allStatesFrameImages: phase === 'phase0' ? [] : allStatesFrameImages,
        audioData
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
    const {
        transcriptData,
        transcriptFetching,
        playing, frameNumber,
        frameSpeed, startFrame,
        stopFrame, phase, allStates,
        allStatesFrameImages,
        audioData,
        fetchTranscript, onSwitchPlay, changeFrame, onChangeTranscript} = props;

    const [croppedImageMap, setCroppedImageMap] = useState<any>(null);
    useEffect(() => {
        // cropped images of the people
        const peopleIndices :number[] = [];
        allStates.forEach((state, idx) => {
            // person tags which are NOT audio selection
            if (state.label.name.startsWith('person:') && state.objectType !== ObjectType.AUDIOSELECTION) {
                peopleIndices.push(idx);
            }
        })
        const images = peopleIndices.map(() => new Image());
        Promise.all(images.map(async (image, i) => {
            const cnv = document.createElement('canvas');
            const ctx = cnv.getContext('2d');

            const p1X = Math.min(allStates[peopleIndices[i]].points[0], allStates[peopleIndices[i]].points[2]);
            const p2X = Math.max(allStates[peopleIndices[i]].points[0], allStates[peopleIndices[i]].points[2]);

            const p1Y = Math.min(allStates[peopleIndices[i]].points[1], allStates[peopleIndices[i]].points[3]);
            const p2Y = Math.max(allStates[peopleIndices[i]].points[1], allStates[peopleIndices[i]].points[3]);

            const sX = p1X,
                sY = p1Y,
                sW = p2X - p1X,
                sH = p2Y - p1Y;

            cnv.width = sW;
            cnv.height = sH;
            return await (new Promise((resolve) => {
                image.onload = () => {
                    ctx?.drawImage(image, sX, sY, sW, sH, 0, 0, sW, sH);
                    const cropped = cnv.toDataURL();
                    cnv.remove();
                    resolve(cropped);
                };
                image.src = URL.createObjectURL(allStatesFrameImages[peopleIndices[i]]);
            }));
        })).then((imgs) => setCroppedImageMap(
            imgs.reduce((acc: any, cur, idx) => {
                acc[allStates[peopleIndices[idx]].clientID] = cur;
                return acc;
            }, {})
            )
        );

    }, [allStates, allStatesFrameImages]);

    const [audioBlobURL, setAudioBlobURL] = useState('');
    const [audioFrameMap, setAudioFrameMap] = useState<any>(null);
    useEffect(() => {
        if(audioData) {
            const blb = new Blob([audioData], {type: 'audio/mp3'});
            setAudioBlobURL(URL.createObjectURL(blb));
        }

        return () => {
            if (audioBlobURL.length) {
                URL.revokeObjectURL(audioBlobURL)
            }
        }
    }, [audioData]);

    useEffect(() => {
        setAudioFrameMap(
            allStates.
                filter((state) =>
                    state.label.name.startsWith('person:') &&
                    state.objectType === ObjectType.AUDIOSELECTION
                ).
                reduce((acc: any, cur) => {
                    acc[cur.clientID] = cur.frame;
                    return acc;
                }, {})
        );
    }, [allStates])

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

    if (phase === 'phase0') {
        // stuff for multiselect
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
    }

    useEffect(() => {
        if (!transcriptData && !transcriptFetching) {
            fetchTranscript();
        }

    }, []);

    useEffect(() => {
        setSelected([]);
    }, [transcriptData]);

    const audioRef = useRef<HTMLAudioElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const playAudio = useCallback((play: boolean, frame: number) => {
        if (audioRef.current ) {
            if (play) {
                audioRef.current.currentTime = frame / frameSpeed;
                audioRef.current.play();
                timeoutRef.current = setTimeout(() => {
                    audioRef.current && audioRef.current.pause();
                }, 5000)
            } else {
                audioRef.current.pause();
                timeoutRef.current && clearTimeout(timeoutRef.current)
            }
        }
    }, [audioBlobURL]);

    return <>
       <Layout.Sider width={300} style={{fontSize: 18, overflowY: 'scroll'}}>
        <audio ref={audioRef} src={audioBlobURL}></audio>
        <div style={{padding: '10px', textAlign: 'center', color: 'white'}}>
            {!transcriptData && !transcriptFetching && 'No Transcript'}
            {!transcriptData && transcriptFetching && 'Loading Transcript...'}
            {transcriptData && <>
                {transcriptData.segments.map((segment: any, index: number) =>
                {
                    const isCurrent = currentIdx === index;
                    const appliedStyle = (isCurrent) ? currentStyle : otherStyle;

                    return <TranscriptUtteranceText
                        phase={phase}
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
                        images = {phase === 'phase0' ? null : croppedImageMap}
                        audios = {phase === 'phase0' ? null : audioFrameMap}
                        playAudio={playAudio}
                    />
                }
                )}
            </>}
        </div>
       </Layout.Sider>
    </>



}

export default connect(mapStateToProps, mapDispatchToProps)(TranscriptPlayerComponent);
