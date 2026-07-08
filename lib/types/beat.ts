export interface Beat {
  id: number;
  beat_name: string;
  beat_type: string;
  price: number;
  genre: string;
  bpm: number;
  description: string;
  audio_url: string;
  cover_image_url: string;
  banner_image_url: string;
  duration: number;
  track_type: string;
  mood: string;
  selling_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  artist_name: string;
}

export interface BeatsResponse {
  items: Beat[];
}
