import { Artist } from "../types/admin";
import api from "../lib/api";

export interface WorkedWithArtist {
  id: number;
  name: string;
  image: string;
  popularSong: string;
  musicType: string;
  workedYear: string;
}

export async function getArtists(): Promise<Artist[]> {
  const response = await api.get("/artists");
  return response.data.data || [];
}

export async function getWorkedWithArtists(): Promise<WorkedWithArtist[]> {
  const response = await api.get("/artists/worked-with");
  return response.data.data || [];
}

export async function createWorkedWithArtist(data: {
  name: string;
  image: string;
  popular_song: string;
  music_type: string;
  worked_year: number;
}): Promise<WorkedWithArtist> {
  const response = await api.post("/artists/worked-with", data);
  return response.data.data;
}

export async function deleteWorkedWithArtist(id: number): Promise<void> {
  await api.delete(`/artists/worked-with/${id}`);
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const artists = await getArtists();
  return artists.find((artist) => artist.id === id);
}

export async function createArtist(data: {
  name: string;
  phone?: string;
  email?: string;
  image_key?: string;
}): Promise<Artist> {
  const response = await api.post("/artists", data);
  return response.data.data;
}
