"use client"
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export const PlayerVideoMolecules = ({ src, quality }: { src: string, quality: string }) => {
  const getUrl = ( src: string, quality: string ) => {
    const url = `http://localhost:8000/video/${quality ? `${quality}` : ''}/${src}`;
    return url;
  }
 
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const urlToVideo = getUrl(src, quality);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const currentVideoRef = videoRef.current;
  
      currentVideoRef?.addEventListener('timeupdate', handleTimeUpdate);
      currentVideoRef?.addEventListener('durationchange', handleDurationChange);
      handleMetadataLoad();
  
      return () => {
        currentVideoRef?.removeEventListener('timeupdate', handleTimeUpdate);
        currentVideoRef?.removeEventListener('durationchange', handleDurationChange);
      };
    }
  }, []);

  if (!src || typeof src !== 'string') {
    return <div>Error: Invalid video source</div>;
  }

  const playPauseVideo = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
    } else {
      videoRef.current?.pause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const newVolume = parseFloat(e.target.value) || 0;

    // Validate the volume value
    if (isNaN(newVolume) || newVolume < 0 || newVolume > 1) {
      console.error('Invalid volume value');
      return;
    }

    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number): string => {
    if (typeof time !== 'number' || time < 0 || !isFinite(time)) {
      return "00:00";
    }
  
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const skipVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + seconds;

      // Validate the currentTime value
      if (isNaN(newTime) || newTime < 0 || newTime > videoRef.current.duration) {
        console.error('Invalid currentTime value');
        return;
      }

      videoRef.current.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleMetadataLoad = () => {
    if (typeof videoRef.current?.duration === 'number') {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleDurationChange = () => {
    if (videoRef.current && typeof videoRef.current.duration === 'number') {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);

    // Validate the currentTime value
    if (isNaN(newTime) || newTime < 0 || newTime > duration) {
      console.error('Invalid currentTime value');
      return;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  

  return (
    <div>
      <div className='pt-56.25%'>
      {!isVideoReady && <div>Wait, fetching video...</div>}
        <video 
          ref={videoRef} 
          className='' 
          onError={() => console.error('Video loading error')} 
          autoPlay
          onCanPlay={() => setIsVideoReady(true)}
        >
          <source src={urlToVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <button onClick={playPauseVideo}>Play/Pause</button>
      <button onClick={() => skipVideo(-10)}>-10 sec</button>
      <button onClick={() => skipVideo(10)}>+10 sec</button>
      <p>{formatTime(currentTime)} / {formatTime(duration)}</p>
      <input type="range" min="0" max={isNaN(duration) ? 0 : duration} value={currentTime} step={0.1} onChange={handleSliderChange} />
      <input type="range" min="0" max="1" value={volume} step={0.01} onChange={handleVolumeChange} />
    </div>
  );
};
