'use client'
import React, { useRef, useState, useEffect } from 'react'

export const PlayerVideo = ({ src, quality }: { src: string; quality: string }) => {
  const [qualities, setQualities] = useState(quality)
  const getUrl = (src: string, quality: string) => {
    const BACKENDURL = process.env.NEXT_PUBLIC_BACKEND_URL
    let url
    if (quality === 'defaultQuality') {
      url = `${BACKENDURL}/video/${quality ? `${quality}` : ''}/${src}`
    } else {
      url = `${BACKENDURL}/video/${quality ? `${quality}` : ''}/${
        src.split('-').slice(0, -1).join('-') + '-' + quality
      }`
    }
    console.log(url)
    // console.log(`${BACKENDURL}/video/${quality}` + src.split('-').slice(0, -1).join('-') + '-' + quality + '.mp4');
    return url
  }

  const checkIfVideoResoNotBigerThanCurr = (quality: string) => {
    const suportedQualities = ['144p', '240p', '480p', '720p', '1080p', '4k']
    return suportedQualities.splice(0, suportedQualities.indexOf(quality) + 1)
  }

  const supportedQualities = checkIfVideoResoNotBigerThanCurr(quality)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [urlToVideo, setUrlToVideo] = useState(getUrl(src, qualities))
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [currentWidthLength, setCurrentWidthLength] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isBuffered, setIsBuffered] = useState(false)
  const [currentStatusPlaying, setCurrentStatusPlaying] = useState('Pause')
  const [clickedShowInfo, setClickedShowInfo] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setUrlToVideo(getUrl(src, qualities) + '.mp4')
      // console.log(videoRef.current);
      // console.log("important", urlToVideo)
      videoRef.current.load()
    }
    if (videoRef.current) {
      const currentVideoRef = videoRef.current
      console.log(currentTime)
      const onWaiting = () => setIsBuffered(true)
      const onPlaying = () => setIsBuffered(false)

      const onCanPlay = () => {
        currentVideoRef.play()
      }

      const onLoadedMetadata = () => {
        console.log('onLoadedMetadata', currentTime)
        if (currentTime !== undefined) {
          currentVideoRef.currentTime = currentTime
        }
      }

      currentVideoRef.addEventListener('canplay', onCanPlay)
      currentVideoRef?.addEventListener('timeupdate', handleTimeUpdate)
      currentVideoRef?.addEventListener('durationchange', handleDurationChange)
      currentVideoRef.addEventListener('progress', handleProgress)
      currentVideoRef.addEventListener('waiting', onWaiting)
      currentVideoRef.addEventListener('playing', onPlaying)
      currentVideoRef.addEventListener('loadedmetadata', onLoadedMetadata)

      handleMetadataLoad()

      return () => {
        currentVideoRef.removeEventListener('canplay', onCanPlay)
        currentVideoRef?.removeEventListener('timeupdate', handleTimeUpdate)
        currentVideoRef?.removeEventListener('durationchange', handleDurationChange)
        currentVideoRef.removeEventListener('progress', handleProgress)
        currentVideoRef.removeEventListener('waiting', onWaiting)
        currentVideoRef.removeEventListener('playing', onPlaying)
        currentVideoRef.removeEventListener('loadedmetadata', onLoadedMetadata)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualities, src, urlToVideo])

  useEffect(() => {
    setCurrentWidthLength(Math.floor((currentTime / duration) * 100) + 0.5)
    setCurrentStatusPlaying(videoRef.current?.paused ? 'Pause' : 'Play')
  }, [currentTime, duration])

  if (!src || typeof src !== 'string') {
    return <div>Error: Invalid video source</div>
  }

  const handleQualityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    playPauseVideo()
    setQualities(event.target.value)
  }

  const handleClickShowInfo = () => {
    setClickedShowInfo(!clickedShowInfo)
    setTimeout(() => {
      setClickedShowInfo(false)
    }, 1000)
  }

  const playPauseVideo = () => {
    handleClickShowInfo()
    if (videoRef.current?.paused) {
      videoRef.current.play()
    } else {
      videoRef.current?.pause()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) || 0

    // Validate the volume value
    if (isNaN(newVolume) || newVolume < 0 || newVolume > 1) {
      console.error('Invalid volume value')
      return
    }

    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const handleProgress = () => {
    if (videoRef.current) {
      const bf = videoRef.current.buffered
      const time = videoRef.current.currentTime

      let loadEndPercentage = 0

      for (let i = 0; i < bf.length; i++) {
        if (bf.start(i) <= time && time <= bf.end(i)) {
          loadEndPercentage = bf.end(i) / videoRef.current.duration
          break
        }
      }

      // Now you can use loadEndPercentage to update your progress bar
      setBuffered(loadEndPercentage)
    }
  }

  const formatTime = (time: number): string => {
    if (typeof time !== 'number' || time < 0 || !isFinite(time)) {
      return '00:00'
    }

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const skipVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + seconds

      // Validate the currentTime value
      if (isNaN(newTime) || newTime < 0 || newTime > videoRef.current.duration) {
        console.error('Invalid currentTime value')
        return
      }

      videoRef.current.currentTime = newTime
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleMetadataLoad = () => {
    if (typeof videoRef.current?.duration === 'number') {
      setDuration(videoRef.current.duration)
    }
  }

  const handleDurationChange = () => {
    if (videoRef.current && typeof videoRef.current.duration === 'number') {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)

    // Validate the currentTime value
    if (isNaN(newTime) || newTime < 0 || newTime > duration) {
      console.error('Invalid currentTime value')
      return
    }

    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  return (
    <div className="group/playpause relative w-full text-white ">
      <div className="z-10 ">
        {isBuffered && (
          <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
            <svg className="mr-3 h-10 w-10 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {/* <p className='text-xs'>{Math.floor(buffered * 100)}%</p> */}
          </div>
        )}
        <button
          className="absolute bottom-0 left-0 right-0 top-0 z-10 bg-red-500 opacity-0"
          onClick={playPauseVideo}
        ></button>
        {isVideoReady && (
          <div
            className={`absolute bottom-0  left-0 right-0 top-0  flex items-center justify-center bg-gradient-to-t from-black from-0% to-transparent to-15% opacity-0 transition-all duration-500 ease-in-out group-hover/playpause:opacity-100`}
          >
            <p className="rounded-full bg-red-500 px-4 py-4">{currentStatusPlaying}</p>
          </div>
        )}
      </div>

      <div className="">
        {!isVideoReady && (
          <div className="alert alert-warning absolute left-1/2 top-1/2 w-fit -translate-x-1/2 -translate-y-1/2 transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Wait Fething Video...</span>
          </div>
        )}
        <video
          ref={videoRef}
          className="h-full w-full"
          onError={(e) => console.error('Video loading error', e)}
          autoPlay
          onCanPlay={() => setIsVideoReady(true)}
        >
          <source src={urlToVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 opacity-0 transition-all duration-300 ease-in-out group-hover/playpause:opacity-100">
        <div>
          <div className="relative flex h-4 w-full cursor-pointer items-center justify-center">
            <div className={`absolute left-0 right-0 top-1/3 h-[4px] bg-gray-600`}></div>
            <div
              className={`absolute left-0 right-0 top-1/3 h-[4px] bg-gray-400`}
              style={{ width: `${buffered * 100}%` }}
            ></div>
            <div
              className={`absolute left-0 right-0 top-1/3 h-[4px] bg-red-500`}
              style={{ width: `${currentWidthLength}%` }}
            ></div>
            <input
              className="absolute left-0 right-0 top-0 h-4 w-full cursor-pointer opacity-0"
              type="range"
              min="0"
              max={isNaN(duration) ? 0 : duration}
              value={currentTime}
              step={0.1}
              onChange={handleSliderChange}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2">
              <button onClick={() => skipVideo(-10)}>-10 sec</button>
              <button onClick={playPauseVideo}>{currentStatusPlaying}</button>
              <button onClick={() => skipVideo(10)}>+10 sec</button>
            </div>
            <div className="group/volume flex items-center justify-center gap-2">
              <label htmlFor="volume">Volume</label>
              <input
                className="w-0 opacity-0 transition-[width] duration-300 ease-in-out group-hover/volume:w-20 group-hover/volume:opacity-100"
                type="range"
                min="0"
                max="1"
                value={volume}
                step={0.01}
                onChange={handleVolumeChange}
              />
            </div>
            <p>
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
            <div>
              <select value={qualities} onChange={handleQualityChange}>
                {supportedQualities.map((supportQuality) => (
                  <option key={supportQuality} value={supportQuality}>
                    {supportQuality}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
