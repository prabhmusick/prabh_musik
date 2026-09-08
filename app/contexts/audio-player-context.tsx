"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export interface Beat {
  id: string;
  title: string;
  producer: string;
  price: number | null;
  cover: string;
  genre: string;
  bpm: number;
  duration?: number;
  previewUrl: string;
  plays: number;
}

interface AudioPlayerContextValue {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  playBeat: (beat: Beat, beatsList?: Beat[]) => Promise<void>;
  playAdjacent: (direction: -1 | 1) => Promise<void>;
  togglePlayback: () => Promise<void>;
  closePlayer: () => void;
  seekByRatio: (ratio: number) => void;
  setIsLooping: React.Dispatch<React.SetStateAction<boolean>>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [beatsList, setBeatsList] = useState<Beat[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = isLooping;

    const onTimeUpdate = () => {
      const next = Number(audio.currentTime);
      setCurrentTime(Number.isFinite(next) ? next : 0);
    };
    const syncDuration = () => {
      const next = Number(audio.duration);
      if (Number.isFinite(next) && next > 0) {
        setDuration(next);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const playBeat = useCallback(
    async (beat: Beat, newBeatsList?: Beat[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (newBeatsList) {
        setBeatsList(newBeatsList);
      }

      if (currentBeat?.id === beat.id) {
        if (audio.paused) {
          await audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      if (!beat.previewUrl) {
        console.warn("No preview URL available for this beat");
        return;
      }

      audio.src = beat.previewUrl;
      audio.currentTime = 0;
      setCurrentBeat(beat);
      setCurrentTime(0);

      const initialDuration = Number(beat.duration);
      setDuration(Number.isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 0);

      await audio.play().catch(() => {});
    },
    [currentBeat?.id]
  );

  const playAdjacent = useCallback(
    async (direction: -1 | 1) => {
      if (beatsList.length === 0) return;
      if (!currentBeat) {
        await playBeat(beatsList[0], beatsList);
        return;
      }

      const currentIdx = beatsList.findIndex((b) => b.id === currentBeat.id);
      const baseIndex = currentIdx >= 0 ? currentIdx : 0;
      const nextIndex = (baseIndex + direction + beatsList.length) % beatsList.length;
      await playBeat(beatsList[nextIndex], beatsList);
    },
    [currentBeat, beatsList, playBeat]
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentBeat && beatsList.length > 0) {
      await playBeat(beatsList[0], beatsList);
      return;
    }

    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentBeat, beatsList, playBeat]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentBeat(null);
  }, []);

  const seekByRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(duration) || duration <= 0) return;
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const next = clampedRatio * duration;
      audio.currentTime = Number.isFinite(next) ? next : 0;
      setCurrentTime(Number.isFinite(next) ? next : 0);
    },
    [duration]
  );

  return (
    <AudioPlayerContext.Provider
      value={{
        currentBeat,
        isPlaying,
        currentTime,
        duration,
        isLooping,
        playBeat,
        playAdjacent,
        togglePlayback,
        closePlayer,
        seekByRatio,
        setIsLooping,
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
