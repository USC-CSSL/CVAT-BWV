import React from 'react';
import VideoJS from './videojs';
interface Props{
    job: any | null | undefined;
}

const videoJSOptions = {
    controls: true,
    sources: [
      {
        src: '/static/video.mp4',
        type: 'video/mp4'
      }
    ]
  };

export default function Phase2AnnotationPage(props: Props) : JSX.Element {
    const playerRef = React.useRef(null);
    // set this from API call
    const pauseTimes = [5, 10, 15];
    return <>
    <h2>Phase 2</h2>
    <VideoJS options={videoJSOptions} pauseTimes={pauseTimes} playerRef={playerRef}/>
    </>
}