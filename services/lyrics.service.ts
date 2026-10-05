import api from "../lib/api";

export interface Lyric {
  id: number;
  title: string;
  genre: string;
  quote: string;
  createdAt?: string;
}

export async function getLyrics(): Promise<Lyric[]> {
  const response = await api.get("/lyrics");
  return response.data.data || [];
}

export async function createLyric(data: {
  title: string;
  genre: string;
  quote: string;
}): Promise<Lyric> {
  const response = await api.post("/lyrics", data);
  return response.data.data;
}

export async function deleteLyric(id: number): Promise<void> {
  await api.delete(`/lyrics/${id}`);
}
