import { fetchAudioAsync, fetchAudioPreviewAsync } from 'actions/annotation-actions';
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
    }
}

const audioCtx = new AudioContext();

function AudioPlaybackComponent(props: StateToProps & DispatchToProps) {
    const { fetchAudio, audioData, audioFetching, frameNumber, startFrame, stopFrame, playing , frameSpeed, fetchPreview} = props;

    const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
    const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
    useEffect(() => {
        if (!audioData && !audioFetching) {
            fetchAudio();
            fetchPreview();
        }
    }, []);

    useEffect(() => {
        if (!audioFetching && audioData) {
            audioCtx.decodeAudioData(audioData.slice(0)).then((buffer) => {
               setBuffer(buffer);
            });
        }
    }, [audioData, audioFetching])

    useEffect(() => {
        if (!audioFetching && audioData) {
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
    }, [audioFetching, playing]);

    useEffect(() => {
        if (audioSource && playing && buffer) {
            const videoDuration = (stopFrame - startFrame) / frameSpeed;
            const audioDuration = buffer.duration;
            audioSource.buffer = buffer;
            audioSource.playbackRate.value = audioDuration / videoDuration;

            const porionVideo = (frameNumber - startFrame) / (stopFrame - startFrame);
            const offsetAudio = porionVideo * audioDuration;
            audioSource.start(0, offsetAudio);
            audioSource.connect(audioCtx.destination);

            if (audioCtx.state !== 'running') {
                audioCtx.resume();
            }
        }
    }, [audioSource]);

    return <></>
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioPlaybackComponent);