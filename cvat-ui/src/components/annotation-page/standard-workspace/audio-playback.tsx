import { fetchAudioAsync, fetchAudioPreviewAsync } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import React, { useEffect, useState, useRef } from 'react';
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
    const {audioData, audioFetching, playing, frameNumber, frameSpeed, startFrame, stopFrame, fetchAudio, fetchPreview, setFrameSpeed} = props;
    const [audioSlowDownFactor, setAudioSlowDownFactor] = useState(1);
    useEffect(() => {
        if (!audioData && !audioFetching) {
            fetchAudio();
            fetchPreview();
        }
    }, []);

    useEffect(() => {
        if (!audioFetching && audioData) {
            if (audioRef.current) {
                audioRef.current.src = URL.createObjectURL(new Blob([audioData], {type: 'audio/mp3'}));

            }
        }
    }, [audioData, audioFetching]);

    useEffect(() => () => {
        if (audioRef.current?.src) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
        }
    }, []);

    useEffect(() => {
        if (!audioRef.current || !audioRef.current.duration) {
            return;
        }
        const frameRate = (stopFrame - startFrame) / audioRef.current.duration;
        if (frameSpeed != frameRate) {
            setFrameSpeed(frameRate);
        }
        if (frameNumber % 200 === 0) {
            if (playing) {


                const videoCurTime = (frameNumber - startFrame) / frameRate;
                const audioCurrentTime = audioRef.current.currentTime;

                if (audioCurrentTime - videoCurTime > 0.1) {

                    console.log('video lag', audioCurrentTime - videoCurTime)
                    setAudioSlowDownFactor(audioSlowDownFactor * 0.98);
                    audioRef.current.playbackRate = audioSlowDownFactor * 0.98;

                    audioRef.current.currentTime = videoCurTime;
                } else if (audioCurrentTime - videoCurTime < -0.1) {

                    console.log('audio lag', audioCurrentTime - videoCurTime)
                    setAudioSlowDownFactor(audioSlowDownFactor * 1.02);
                    audioRef.current.playbackRate = audioSlowDownFactor * 1.02;

                    audioRef.current.currentTime = videoCurTime;
                }
            }
        }

        if (playing && audioRef.current.paused) {
            audioRef.current.play();
        } else if (!playing) {
            const videoDuration = (stopFrame - startFrame) / frameRate;
            const audioDuration = audioRef.current.duration;

            audioRef.current.playbackRate = audioDuration / videoDuration * audioSlowDownFactor;

            const videoCurTime = (frameNumber - startFrame) / frameRate;
            audioRef.current.currentTime = videoCurTime;
        }

    }, [frameNumber]);

    useEffect(() => {
        if (audioRef.current) {
            if (!playing) {
                audioRef.current.pause();
            }
        }
    }, [playing])


    const audioRef = useRef<HTMLAudioElement>(null);
    return <>
        <audio ref={audioRef} style={{display: 'none'}}></audio>
    </>
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioPlaybackComponent);
