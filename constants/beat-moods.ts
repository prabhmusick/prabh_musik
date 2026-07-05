export const BEAT_MOODS = [
  "Chill",
  "Dark",
  "Energetic",
  "Sad",
  "Happy",
  "Aggressive",
  "Epic",
  "Smooth",
  "Melancholic",
  "Bouncy",
] as const;

export type BeatMood = typeof BEAT_MOODS[number];
