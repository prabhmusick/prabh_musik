"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { BeatItem } from "./app-shell-context";

interface AudioPlayerContextValue {
  currentBeat: BeatItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  volume: number;
  playBeat: (beat: BeatItem) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (time: number) => void;
  seekByRatio: (ratio: number) => void;
  toggleLoop: () => void;
  setVolume: (vol: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentBeat, setCurrentBeat] = useState<BeatItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = isLooping;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  const playBeat = useCallback(async (beat: BeatItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentBeat?.id === beat.id) {
      if (audio.paused) {
        await audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    if (!beat.previewUrl) return;

    audio.src = beat.previewUrl;
    audio.currentTime = 0;
    setCurrentBeat(beat);
    setCurrentTime(0);
    setDuration(0);
    await audio.play().catch(() => {});
  }, [currentBeat?.id]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentBeat) return;
    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentBeat]);

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const seekByRatio = (ratio: number) => {
    if (duration <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    seek(clamped * duration);
  };

  const toggleLoop = () => {
    setIsLooping((v) => {
      const next = !v;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  };

  const closePlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    setIsPlaying(false);
    setCurrentBeat(null);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentBeat,
        isPlaying,
        currentTime,
        duration,
        isLooping,
        volume,
        playBeat,
        togglePlay,
        seek,
        seekByRatio,
        toggleLoop,
        setVolume,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}
