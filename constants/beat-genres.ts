export const BEAT_GENRES = [
  "Trap",
  "Drill",
  "Afrobeat",
  "Boom Bap",
  "Hip Hop",
  "Lo-Fi",
  "Synthwave",
  "Punjabi",
  "R&B",
  "Pop",
] as const;

export type BeatGenre = typeof BEAT_GENRES[number];
