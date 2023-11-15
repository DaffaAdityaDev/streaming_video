"use client"
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export const PlayerVideo = ({ src, quality }: { src: string, quality: string }) => {
  if (!src || typeof src !== 'string') {
    return <div>Error: Invalid video source</div>;
  }
  const getUrl = ( src: string, quality: string ) => {
    const url = `http://localhost:8000/video/${quality ? `${quality}` : ''}/${src}`;
    return url;
  }

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const urlToVideo = getUrl(src, quality);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  

  const playPauseVideo = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
    } else {
      videoRef.current?.pause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const newVolume = parseFloat(e.target.value);

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

  useEffect(() => {
    videoRef.current?.addEventListener('timeupdate', handleTimeUpdate);
    videoRef.current?.addEventListener('durationchange', handleDurationChange);
    handleMetadataLoad();
    return () => {
      videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      videoRef.current?.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  return (
    <div>
      <div className='pt-56.25%'>
      <video ref={videoRef} className='h-full h-fit' onError={() => console.error('Video loading error')} autoPlay>
        <source src={urlToVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      </div>
      <button onClick={playPauseVideo}>Play/Pause</button>
      <button onClick={() => skipVideo(-10)}>-10 sec</button>
      <button onClick={() => skipVideo(10)}>+10 sec</button>
      <input type="range" min="0" max={isNaN(duration) ? 0 : duration} value={currentTime} step={0.1} onChange={handleSliderChange} />
      <input type="range" min="0" max="1" value={volume} step={0.01} onChange={handleVolumeChange} />
    </div>
  );
};
