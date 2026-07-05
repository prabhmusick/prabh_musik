"use client"

import * as React from "react"
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { Button } from "../../ui/button"

interface BeatAudioPlayerProps {
  audioUrl: string;
  title: string;
  initialDuration?: number;
}

export function BeatAudioPlayer({ audioUrl, title, initialDuration }: BeatAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(initialDuration || 0)
  const [volume, setVolume] = React.useState(0.8)
  const [isMuted, setIsMuted] = React.useState(false)
  
  const audioRef = React.useRef<HTMLAudioElement>(null)

  React.useEffect(() => {
    // Reset player states if url changes
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(initialDuration || 0)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }, [audioUrl, initialDuration])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e))
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
    if (audioRef.current) {
      audioRef.current.volume = vol
      audioRef.current.muted = vol === 0
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    const muteState = !isMuted
    setIsMuted(muteState)
    audioRef.current.muted = muteState
    if (muteState) {
      audioRef.current.volume = 0
    } else {
      audioRef.current.volume = volume
    }
  }

  const restartAudio = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    if (!isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e))
      setIsPlaying(true)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-4 shadow-md w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Preview Player</span>
            <span className="text-sm font-bold text-white truncate max-w-[200px] mt-0.5">{title}</span>
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration || 180)} {/* Fallback to 3 min if metadata loading */}
          </div>
        </div>

        {/* Custom Progress Scrubber */}
        <div className="flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 180}
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="size-9 rounded-full bg-primary hover:bg-primary-hover border-none text-black hover:scale-105 active:scale-95 transition-all shadow-[0_2px_8px_rgba(212,130,10,0.25)]"
            >
              {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={restartAudio}
              className="size-8 rounded-full text-neutral-400 hover:text-white"
            >
              <RotateCcw size={15} />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
