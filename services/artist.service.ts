import { Artist } from "../types/admin";
import api from "../lib/api";

export async function getArtists(): Promise<Artist[]> {
  const response = await api.get("/artists");
  return response.data.data || [];
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
