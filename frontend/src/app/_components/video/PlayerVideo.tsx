'use client'
import React, { useRef, useState, useEffect, useContext } from 'react'
import { AppContext } from '../context/AppContext'

export const PlayerVideo = ({ src, quality }: { src: string; quality: string }) => {
  const [qualities, setQualities] = useState(quality)
  const getUrl = (src: string, quality: string) => {
    const BACKENDURL = process.env.NEXT_PUBLIC_BACKEND_URL
    let url
    if (quality === 'defaultQuality') {
      url = `${BACKENDURL}/video/${quality ? `${quality}` : ''}/${src}.mp4`
    } else {
      url = `${BACKENDURL}/video/${quality ? `${quality}` : ''}/${src}`
    }
    // console.log(url)
    // console.log("quality", quality)
    // console.log("src", src)
    // console.log(`${BACKENDURL}/video/${quality}` + src.split('-').slice(0, -1).join('-') + '-' + quality + '.mp4');
    return url
  }

  const checkIfVideoResoNotBigerThanCurr = (quality: string) => {
    const suportedQualities = ['144p', '240p', '480p', '720p', '1080p', '4k']
    return suportedQualities.splice(0, suportedQualities.indexOf(quality) + 1)
  }

  const supportedQualities = checkIfVideoResoNotBigerThanCurr(quality)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
  const { isFullScreen, setIsFullScreen } = useContext(AppContext)
  // console.log(isFullScreen)

  useEffect(() => {
    initVideoGlowBg()

    if (videoRef.current) {
      videoRef.current.pause()
      setUrlToVideo(getUrl(src, qualities) + '.mp4')
      // console.log(videoRef.current);
      // console.log("important", urlToVideo)
      videoRef.current.load()
    }
    if (videoRef.current) {
      const currentVideoRef = videoRef.current
      // console.log(currentTime)
      const onWaiting = () => setIsBuffered(true)
      const onPlaying = () => setIsBuffered(false)

      const onCanPlay = () => {
        currentVideoRef.play()
      }

      const onLoadedMetadata = () => {
        // console.log('onLoadedMetadata', currentTime)
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

  useEffect(() => {
    handleScrollIfFullScreen()
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen && !document.fullscreenElement) {
        setIsFullScreen(false)
      }
    }

    // Add the event listener when the component mounts
    document.addEventListener('keydown', handleEscKey)

    // Remove the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isFullScreen])

  if (!src || typeof src !== 'string') {
    return <div>Error: Invalid video source</div>
  }

  const initVideoGlowBg = () => {
    if (videoRef.current && canvasRef.current) {
      // Instantiate the VideoWithBackground class
      const videoGlow = new VideoWithBackground(videoRef.current, canvasRef.current)

      // Clean up when the component unmounts
      return () => {
        videoGlow.cleanup()
      }
    }
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

  const handleScreenMode = () => {
    if (isFullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullScreen(false)
    } else {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
      setIsFullScreen(true)
    }
  }

  // if (document.fullscreenElement) {
  //   console.log('The browser is in fullscreen mode.');
  // } else {
  //   console.log('The browser is not in fullscreen mode.');
  // }

  const handleScrollIfFullScreen = () => {
    if (isFullScreen) {
      document.body.style.cssText = 'overflow: hidden; position:fixed;'
      // console.log('hidden')
    } else {
      document.body.style.cssText = 'overflow: auto; position:static;'
      // console.log('auto')
    }
  }

  return (
    <div
      className={`relative shadow-[inset_10px_0px_2rem_2rem_oklch(var(--pc))] ${
        isFullScreen ? '' : 'px-10 py-4'
      }`}
    >
      <div className={`absolute left-0 top-0 -z-10 h-full w-full ${isFullScreen ? 'hidden' : ''}`}>
        <canvas ref={canvasRef} className="canvasClass h-full w-full opacity-60" id="canvasId" />
      </div>
      <div
        className={`group/playpause relative w-full text-white ${
          isFullScreen ? 'flex h-screen w-screen items-center justify-center' : ''
        }`}
      >
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
              <p className="flex items-center justify-center rounded-full bg-red-500 px-4 py-4">
                {currentStatusPlaying === 'Play' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="bi bi-pause-fill h-10 w-10"
                    viewBox="0 0 16 16"
                  >
                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="bi bi-play-fill h-10 w-10"
                    viewBox="0 0 16 16"
                  >
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                  </svg>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="w-full">
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
            className="aspect-video h-full w-full rounded-md"
            onError={(e) => console.error('Video loading error', e)}
            autoPlay
            onCanPlay={() => setIsVideoReady(true)}
            id="videoId"
          >
            <source src={urlToVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 opacity-0 transition-all duration-300 ease-in-out group-hover/playpause:opacity-100">
          <div className="w-full">
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
          </div>
          <div className="flex w-full justify-between">
            <div className="w-full">
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <button onClick={() => skipVideo(-10)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      className="bi bi-rewind-fill h-6 w-6"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                      <path d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z" />
                    </svg>
                  </button>
                  <button onClick={playPauseVideo}>
                    {currentStatusPlaying === 'Play' ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="bi bi-pause-fill h-8 w-8"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="bi bi-play-fill h-8 w-8"
                        viewBox="0 0 16 16"
                      >
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => skipVideo(10)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      className="bi bi-fast-forward-fill h-6 w-6"
                      viewBox="0 0 16 16"
                    >
                      <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                      <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696z" />
                    </svg>
                  </button>
                </div>
                <div className="group/volume flex items-center justify-center gap-2">
                  {/* <label htmlFor="volume">Volume</label> */}
                  <div className="flex h-6 w-6 items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      className="bi bi-volume-up-fill h-full w-full"
                      viewBox="0 0 16 16"
                    >
                      {volume >= 0.5 && (
                        <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" />
                      )}
                      {volume >= 0.2 && (
                        <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" />
                      )}
                      {volume > 0.1 && (
                        <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06" />
                      )}
                      {volume <= 0.1 && (
                        <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0" />
                      )}
                    </svg>
                  </div>
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
                <p className="flex items-center justify-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
                <div>
                  <select
                    className="select select-accent select-sm w-full max-w-xs"
                    value={qualities}
                    onChange={handleQualityChange}
                  >
                    {supportedQualities.map((supportQuality) => (
                      <option key={supportQuality} value={supportQuality}>
                        {supportQuality}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleScreenMode}>
              {isFullScreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="bi bi-fullscreen-exit h-6 w-6"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="bi bi-fullscreen h-6 w-6"
                  viewBox="0 0 16 16"
                >
                  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

class VideoWithBackground {
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
  step: number = 0 // Initialize with a default value
  ctx?: CanvasRenderingContext2D // Keep the type as undefined

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.video = videoElement
    this.canvas = canvasElement

    this.init()
  }

  draw = () => {
    if (this.ctx) {
      // if (this.ctx) {
      //   this.ctx.drawImage(this.video,  0,  0, this.canvas.width, this.canvas.height);
      // }
      // Save the current state of the context
      this.ctx.save()

      // Translate the context to the center of the canvas
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)

      // Scale the context by  1.0 (100%)
      this.ctx.scale(1.0, 1.0)

      // Create a radial gradient
      const gradient = this.ctx.createRadialGradient(
        this.canvas.width / 2,
        this.canvas.height / 2,
        0,
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.canvas.width / 2,
      )
      // Start with solid black at the center
      gradient.addColorStop(0, 'rgba(0,  0,  0,  1)')
      // Gradually fade to transparent towards the edges
      gradient.addColorStop(0.5, 'rgba(0,  0,  0,  0.5)')
      gradient.addColorStop(1, 'rgba(0,  0,  0,  0)')

      // Apply the gradient as a mask
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(
        -this.canvas.width / 2,
        -this.canvas.height / 2,
        this.canvas.width,
        this.canvas.height,
      )

      // Draw the video frame at the center of the canvas
      this.ctx.drawImage(
        this.video,
        -this.canvas.width / 2,
        -this.canvas.height / 2,
        this.canvas.width,
        this.canvas.height,
      )

      // Restore the context to its original state
      this.ctx.restore()
    }
  }
  drawLoop = () => {
    this.draw()
    this.step = window.requestAnimationFrame(this.drawLoop)
  }

  drawPause = () => {
    window.cancelAnimationFrame(this.step)
    this.step = 0 // Reset to the default value
  }

  init = () => {
    if (this.canvas && this.video) {
      const ctx = this.canvas.getContext('2d')
      if (ctx) {
        this.ctx = ctx
        this.ctx.filter = 'blur(25px)'

        // Check for prefers-reduced-motion setting
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!prefersReducedMotion) {
          // Add event listeners for the video element
          this.video.addEventListener('loadeddata', this.draw, false)
          this.video.addEventListener('seeked', this.draw, false)
          this.video.addEventListener('play', this.drawLoop, false)
          this.video.addEventListener('pause', this.drawPause, false)
          this.video.addEventListener('ended', this.drawPause, false)
        }
      } else {
        console.error('Failed to get canvas context')
      }
    } else {
      console.error('Video or canvas element is not available')
    }
  }

  cleanup = () => {
    if (this.video && this.canvas) {
      this.video.removeEventListener('loadeddata', this.draw)
      this.video.removeEventListener('seeked', this.draw)
      this.video.removeEventListener('play', this.drawLoop)
      this.video.removeEventListener('pause', this.drawPause)
      this.video.removeEventListener('ended', this.drawPause)
    }
  }
}
