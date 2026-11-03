"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { BeatItem } from "./app-shell-context";

interface AudioPlayerContextValue {
  currentBeat: BeatItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  volume: number;
  queue: BeatItem[];
  playBeat: (beat: BeatItem, queue?: BeatItem[]) => Promise<void>;
  playQueueIndex: (index: number) => Promise<void>;
  addToQueue: (beat: BeatItem) => void;
  removeFromQueue: (index: number) => Promise<void>;
  clearQueue: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (time: number) => void;
  seekByRatio: (ratio: number) => void;
  toggleLoop: () => void;
  setVolume: (vol: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined,
);

const sanitizeBeat = (beat: any): BeatItem | null => {
  if (!beat || typeof beat !== "object") return null;
  const previewUrl = beat.previewUrl;
  if (!previewUrl || typeof previewUrl !== "string" || !previewUrl.trim()) {
    return null;
  }
  const artistName = beat.producer || beat.artist || "Prabh Musik";
  return {
    id: beat.id ?? `track_${Date.now()}`,
    title: beat.title || "Untitled Beat",
    producer: artistName,
    artist: artistName,
    price: typeof beat.price === "number" ? beat.price : null,
    cover: beat.cover || "",
    genre: beat.genre || "Music",
    bpm: beat.bpm ? Number(beat.bpm) : undefined,
    previewUrl: previewUrl.trim(),
    plays: Number(beat.plays || 0),
  };
};

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentBeat, setCurrentBeat] = useState<BeatItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<BeatItem[]>([]);

  // Synchronized refs to prevent stale closures in event listeners
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBeatRef = useRef<BeatItem | null>(null);
  const queueRef = useRef<BeatItem[]>([]);
  const isLoopingRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentBeat(null);
    currentBeatRef.current = null;
    setQueue([]);
    queueRef.current = [];
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const playQueueIndex = useCallback(async (index: number) => {
    const audio = audioRef.current;
    const currentQueue = queueRef.current;
    if (!audio || index < 0 || index >= currentQueue.length) return;

    const targetBeat = currentQueue[index];
    if (!targetBeat || !targetBeat.previewUrl) return;

    const current = currentBeatRef.current;
    if (current && String(current.id) === String(targetBeat.id)) {
      if (audio.paused) {
        try {
          await audio.play();
        } catch (err: any) {
          if (err?.name !== "AbortError") console.warn("Playback error:", err);
        }
      } else {
        audio.pause();
      }
      return;
    }

    setCurrentBeat(targetBeat);
    currentBeatRef.current = targetBeat;
    setCurrentTime(0);
    setDuration(0);

    audio.src = targetBeat.previewUrl || "";
    audio.currentTime = 0;

    try {
      const p = audio.play();
      if (p !== undefined) await p;
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Playback failed:", err);
        setIsPlaying(false);
      }
    }
  }, []);

  const playBeat = useCallback(
    async (rawBeat: BeatItem, rawNextQueue?: BeatItem[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      const beat = sanitizeBeat(rawBeat);
      if (!beat) {
        console.warn("Cannot play beat without valid previewUrl", rawBeat);
        return;
      }

      const current = currentBeatRef.current;
      if (current && String(current.id) === String(beat.id)) {
        if (audio.paused) {
          try {
            await audio.play();
          } catch (err: any) {
            if (err?.name !== "AbortError") {
              console.warn("Playback error:", err);
            }
          }
        } else {
          audio.pause();
        }
        return;
      }

      // Determine updated queue
      let updatedQueue: BeatItem[];
      if (
        rawNextQueue &&
        Array.isArray(rawNextQueue) &&
        rawNextQueue.length > 0
      ) {
        const validBeats = rawNextQueue
          .map(sanitizeBeat)
          .filter((b): b is BeatItem => b !== null);
        const exists = validBeats.some(
          (b) => String(b.id) === String(beat.id),
        );
        updatedQueue = exists ? validBeats : [beat, ...validBeats];
      } else {
        const currentQueue = queueRef.current;
        const exists = currentQueue.some(
          (b) => String(b.id) === String(beat.id),
        );
        if (exists) {
          updatedQueue = currentQueue;
        } else if (currentQueue.length > 0) {
          updatedQueue = [...currentQueue, beat];
        } else {
          updatedQueue = [beat];
        }
      }

      setQueue(updatedQueue);
      queueRef.current = updatedQueue;

      setCurrentBeat(beat);
      currentBeatRef.current = beat;
      setCurrentTime(0);
      setDuration(0);

      audio.src = beat.previewUrl || "";
      audio.currentTime = 0;

      try {
        const p = audio.play();
        if (p !== undefined) await p;
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Playback failed:", err);
          setIsPlaying(false);
        }
      }
    },
    [],
  );

  const addToQueue = useCallback(
    (rawBeat: BeatItem) => {
      const beat = sanitizeBeat(rawBeat);
      if (!beat) {
        console.warn("Cannot add beat to queue without valid previewUrl", rawBeat);
        return;
      }

      const current = currentBeatRef.current;
      const currentQueue = queueRef.current;

      if (!current) {
        playBeat(beat, [beat]);
        return;
      }

      const exists = currentQueue.some((b) => String(b.id) === String(beat.id));
      if (exists) {
        return;
      }

      const updated = [...currentQueue, beat];
      setQueue(updated);
      queueRef.current = updated;
    },
    [playBeat],
  );

  const removeFromQueue = useCallback(
    async (index: number) => {
      const currentQueue = queueRef.current;
      if (index < 0 || index >= currentQueue.length) return;

      const itemToRemove = currentQueue[index];
      const newQueue = currentQueue.filter((_, i) => i !== index);

      if (newQueue.length === 0) {
        closePlayer();
        return;
      }

      const current = currentBeatRef.current;
      const isRemovingCurrent =
        current && String(current.id) === String(itemToRemove.id);

      setQueue(newQueue);
      queueRef.current = newQueue;

      if (!isRemovingCurrent) {
        // Non-playing track removed: playback continues uninterrupted
        return;
      }

      // Currently playing track removed: transition safely to next appropriate track
      const nextTargetIndex =
        index < newQueue.length ? index : newQueue.length - 1;
      const nextBeat = newQueue[nextTargetIndex];

      if (nextBeat) {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          audio.src = nextBeat.previewUrl || "";
          setCurrentBeat(nextBeat);
          currentBeatRef.current = nextBeat;
          setCurrentTime(0);
          setDuration(0);
          try {
            await audio.play();
          } catch (err: any) {
            if (err?.name !== "AbortError") {
              console.warn("Playback transition failed:", err);
              setIsPlaying(false);
            }
          }
        }
      }
    },
    [closePlayer],
  );

  const clearQueue = useCallback(() => {
    const current = currentBeatRef.current;
    if (current) {
      const updated = [current];
      setQueue(updated);
      queueRef.current = updated;
    } else {
      closePlayer();
    }
  }, [closePlayer]);

  const playNext = useCallback(async () => {
    const current = currentBeatRef.current;
    const currentQueue = queueRef.current;
    if (!current || currentQueue.length < 2) return;

    const currentIndex = currentQueue.findIndex(
      (b) => String(b.id) === String(current.id),
    );
    if (currentIndex < 0 || currentIndex >= currentQueue.length - 1) return;

    await playQueueIndex(currentIndex + 1);
  }, [playQueueIndex]);

  const playPrevious = useCallback(async () => {
    const current = currentBeatRef.current;
    const currentQueue = queueRef.current;
    if (!current || currentQueue.length === 0) return;

    const currentIndex = currentQueue.findIndex(
      (b) => String(b.id) === String(current.id),
    );
    if (currentIndex <= 0) return;

    await playQueueIndex(currentIndex - 1);
  }, [playQueueIndex]);

  const handleTrackEnded = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      if (isLoopingRef.current) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        return;
      }

      const current = currentBeatRef.current;
      const currentQueue = queueRef.current;

      if (!current || currentQueue.length === 0) {
        setIsPlaying(false);
        return;
      }

      const currentIndex = currentQueue.findIndex(
        (b) => String(b.id) === String(current.id),
      );

      if (currentIndex >= 0 && currentIndex < currentQueue.length - 1) {
        const nextBeat = currentQueue[currentIndex + 1];
        if (nextBeat && nextBeat.previewUrl) {
          const audio = audioRef.current;
          if (audio) {
            audio.src = nextBeat.previewUrl || "";
            audio.currentTime = 0;
            setCurrentBeat(nextBeat);
            currentBeatRef.current = nextBeat;
            setCurrentTime(0);
            setDuration(0);
            audio.play().catch((err) => {
              if (err?.name !== "AbortError") {
                console.warn("Auto-play next track failed:", err);
                setIsPlaying(false);
              }
            });
          }
        }
      } else {
        // End of queue reached: stop cleanly without infinite loop
        setIsPlaying(false);
        setCurrentTime(0);
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
        }
      }
    } finally {
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 200);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = isLoopingRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => handleTrackEnded();
    const onError = () => {
      console.warn("Audio playback error on source:", audio.src);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [handleTrackEnded]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    const current = currentBeatRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err: any) {
        if (err?.name !== "AbortError") console.warn("Playback error:", err);
      }
    } else {
      audio.pause();
    }
  }, []);

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(duration || 0, time));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const seekByRatio = (ratio: number) => {
    if (duration <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    seek(clamped * duration);
  };

  const toggleLoop = () => {
    setIsLooping((v) => {
      const next = !v;
      isLoopingRef.current = next;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
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
        queue,
        playBeat,
        playQueueIndex,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playNext,
        playPrevious,
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
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider",
    );
  }
  return context;
}
