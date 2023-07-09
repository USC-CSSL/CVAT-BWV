import { fetchAudioAsync, fetchAudioPreviewAsync } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import React, { useEffect, useState } from 'react';
import {connect} from 'react-redux';
import { CombinedState } from 'reducers';

interface StateToProps {
    audioData: any,
    audioFetching: boolean;
    canvasIsReady: boolean;
    playing: boolean
    frameNumber: number;
    startFrame: number;
    stopFrame: number;
    frameSpeed: number;
}

interface DispatchToProps {
    fetchAudio: () => void;
    fetchPreview: () => void;
    setFrameSpeed: (x: number) => void;
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
                audio: {
                    data: audioData,
                    fetching: audioFetching,

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
        audioData,
        audioFetching,
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
        fetchAudio: (): void => dispatch(fetchAudioAsync()),
        fetchPreview: (): void => dispatch(fetchAudioPreviewAsync()),
        setFrameSpeed: (x: number): void => dispatch(changeFrameSpeed(x)),
    }
}



function AudioPlaybackComponent(props: StateToProps & DispatchToProps) {
    const { fetchAudio, audioData, audioFetching, frameNumber, startFrame, stopFrame, playing , frameSpeed, fetchPreview, setFrameSpeed} = props;

    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
    const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
    const [lastAudioOffset, setLastAudioOffset] = useState<[number, number]>([0, 0]);
    const [audioSlowDownFactor, setAudioSlowDownFactor] = useState(1);
    useEffect(() => {
        if (!audioData && !audioFetching) {
            setAudioCtx(new AudioContext())
            fetchAudio();
            fetchPreview();
        }
    }, []);

    useEffect(() => {
        if (audioCtx && !audioFetching && audioData) {

            audioCtx.decodeAudioData(audioData.slice(0)).then((buffer) => {
                const duration = buffer.duration;
                const frameRate = (stopFrame - startFrame) / duration;
                setFrameSpeed(frameRate);
                setBuffer(buffer);
            });
        }
    }, [audioCtx, audioData, audioFetching])

    function reOffset() {
        {
            if (audioCtx && !audioFetching && audioData) {
                if (audioSource) {
                    try {
                        audioSource.stop();
                    } catch(err) {

                    }
                }

                if (playing) {
                    setAudioSource(audioCtx.createBufferSource());
                }
            }
        }
    }

    useEffect(() => {
        reOffset();
    }, [audioFetching, playing]);

    useEffect(() => {
        if (frameNumber % 200 === 0) {
            if (audioCtx && audioSource && playing && audioSource.buffer) {
                const videoCurTime = (frameNumber - startFrame) / frameSpeed;
                const [lastOffset, lastTime] = lastAudioOffset;
                const currentAudioOffset = lastOffset + (audioCtx.currentTime - lastTime) * audioSource.playbackRate.value;

                if (audioCtx.state === 'running' && audioCtx.currentTime) {
                    if (currentAudioOffset - videoCurTime > 0.1) {
                        console.log('video lag', currentAudioOffset - videoCurTime)
                        setAudioSlowDownFactor(audioSlowDownFactor * 0.98)
                        reOffset();
                    } else if (currentAudioOffset - videoCurTime < -0.1) {
                        console.log('audio lag', currentAudioOffset - videoCurTime)
                        setAudioSlowDownFactor(audioSlowDownFactor * 1.02)
                        reOffset();
                    }
                }
            }
        }
    }, [frameNumber]);

    useEffect(() => {
        if (audioCtx && audioSource && playing && buffer) {
            const videoDuration = (stopFrame - startFrame) / frameSpeed;
            const audioDuration = buffer.duration;
            audioSource.buffer = buffer;
            audioSource.playbackRate.value = audioDuration / videoDuration * audioSlowDownFactor;

            const portionVideo = (frameNumber - startFrame) / (stopFrame - startFrame);
            const offsetAudio = portionVideo * audioDuration;
            setLastAudioOffset([offsetAudio, audioCtx.currentTime]);
            audioSource.start(0, offsetAudio);
            audioSource.connect(audioCtx.destination);

            if (audioCtx.state !== 'running') {
                audioCtx.resume();
            }
        }
    }, [audioSource]);

    useEffect(() => () => {
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close();
        }
    }, []);

    return <></>
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioPlaybackComponent);