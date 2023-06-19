import React from 'react';
import ReactDOM from 'react-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ModalContent from './modalcontent';
import './videojs.css';

const VideoJS = (props: any) => {
    const videoRef = React.useRef(null);
    const { options, onReady, pauseTimes, playerRef } = props;
    const [remainingPauseTimes, setRemainingPauseTimes] = React.useState(pauseTimes);
    const [lastCheckTime, setLastCheckTime] = React.useState(0);

    // Playing the video
    React.useEffect(() => {
        if (!playerRef.current) {
            const videoElement = document.createElement('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);
            const player = (playerRef.current = videojs(videoElement, options, () => {
                onReady && onReady(player);
            }));
        } else {
            const player = playerRef.current;
            player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options, videoRef]);

    // setting remainingPauseTimes
    React.useEffect(() => {
        setRemainingPauseTimes(pauseTimes);
    }, [pauseTimes]);

    //   To pause the videos at specified times
    React.useEffect(() => {
        const player = playerRef.current;
        if (player) {
            const checkTime = () => {
                const currTime = Math.floor(player.currentTime());
                if (Date.now() - lastCheckTime > 500) {
                    setLastCheckTime(Date.now());

                    if (remainingPauseTimes.includes(Math.floor(player.currentTime()))) {
                        setRemainingPauseTimes(remainingPauseTimes.filter((time) => time !== currTime));
                        player.pause();

                        // Popup
                        const modalContent = document.createElement('div');
                        //const root = createRoot(modalContent);
                        ReactDOM.render(<ModalContent currTime={currTime} />, modalContent)
                        // const modelContent = React.createElement(<ModalContent currTime={currTime} />);
                        const modal = player.createModal(modalContent);

                        modal.on('modalclose', () => {
                            player.play();
                        });
                    }
                }
            };
            player.on('timeupdate', checkTime);
            return () => {
                player.off('timeupdate', checkTime);
            };
        }
    }, [remainingPauseTimes]);

    //   update the remaining pause time if the video is seeked
    React.useEffect(() => {
        const player = playerRef.current;
        if (player) {
            const handleSeeked = () => {
                setRemainingPauseTimes(pauseTimes);
            };
            player.on('seeked', handleSeeked);
            return () => {
                player.off('seeked', handleSeeked);
            };
        }
    }, [pauseTimes]);

    // Disposal
    React.useEffect(() => {
        const player = playerRef.current;
        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player>
            <div ref={videoRef} />
        </div>
    );
};

export default VideoJS;
