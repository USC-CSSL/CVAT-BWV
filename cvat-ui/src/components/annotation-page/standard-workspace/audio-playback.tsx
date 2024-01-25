import { fetchAudioAsync, fetchAudioPreviewAsync } from 'actions/annotation-actions';
import { changeFrameSpeed } from 'actions/settings-actions';
import { number } from 'prop-types';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    const {audioData, audioFetching, playing, frameNumber, frameSpeed, startFrame, stopFrame, canvasIsReady, fetchAudio, fetchPreview, setFrameSpeed} = props;

    const trueFrameRate = useRef<number | null>(null);
    const audioSlowdownFactor = useRef(1);
    useEffect(() => {
        trueFrameRate.current = null;
        audioSlowdownFactor.current = 1;
        if (!audioData && !audioFetching) {
            fetchAudio();
            fetchPreview();
        }
    }, []);

    const audioRateLimTimeout = useRef<null | NodeJS.Timeout>(null)
    const audioPlaybackRateLimiter = useCallback((play) => {
        audioRateLimTimeout.current && clearTimeout(audioRateLimTimeout.current);
        if (!play) {
            audioRateLimTimeout.current = setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
            }, 200);
        } else {
            if (audioRef.current) {
                audioRef.current.play();
            }
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
            trueFrameRate.current = null;
            audioSlowdownFactor.current = 1;
        }
    }, []);

    useEffect(() => {
        if (!audioRef.current || !audioRef.current.duration) {
            return;
        }
        const frameRateExpected = (stopFrame - startFrame) / audioRef.current.duration;

        const frameRateTrue = trueFrameRate.current ? trueFrameRate.current : frameSpeed;

        if (frameRateTrue != frameRateExpected) {
            trueFrameRate.current = frameRateExpected;
            setFrameSpeed(frameRateExpected);
        }
        if (frameNumber % 200 === 0) {
            if (playing) {


                const videoCurTime = (frameNumber - startFrame) / frameRateExpected;
                const audioCurrentTime = audioRef.current.currentTime;

                if (audioCurrentTime - videoCurTime > 0.1) {

                    console.log('video lag', audioCurrentTime - videoCurTime)
                    audioSlowdownFactor.current = audioSlowdownFactor.current * 0.97;
                    audioRef.current.playbackRate = audioSlowdownFactor.current;

                    audioRef.current.currentTime = videoCurTime;
                } else if (audioCurrentTime - videoCurTime < -0.1) {

                    console.log('audio lag', audioCurrentTime - videoCurTime)
                    audioSlowdownFactor.current = audioSlowdownFactor.current * 1.03;
                    audioRef.current.playbackRate = audioSlowdownFactor.current;

                    audioRef.current.currentTime = videoCurTime;
                }
            }
        }

        if (playing && audioRef.current.paused) {
            audioPlaybackRateLimiter(true);
        } else if (!playing) {

            const videoCurTime = (frameNumber - startFrame) / frameRateExpected;
            audioRef.current.currentTime = videoCurTime;
        }

    }, [frameNumber]);

    useEffect(() => {

        if (!playing || !canvasIsReady) {
            audioPlaybackRateLimiter(false);
        }

    }, [playing, canvasIsReady])


    const audioRef = useRef<HTMLAudioElement>(null);
    return <>
        <audio ref={audioRef} style={{display: 'none'}}></audio>
    </>
}

export default connect(mapStateToProps, mapDispatchToProps)(AudioPlaybackComponent);
