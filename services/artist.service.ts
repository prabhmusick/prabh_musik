import { Artist } from "../types/admin";
import api from "../lib/api";

interface ArtistResponse {
  id: string;
  public_id?: string;
  name?: string;
  stageName?: string;
  phone?: string;
  email?: string;
  image?: string;
  totalBeats?: number;
  totalSales?: number;
  createdAt?: string;
  joinedAt?: string;
  status?: Artist["status"];
}

export interface WorkedWithArtist {
  id: number;
  name: string;
  url: string;
  image: string;
  popularSong: string;
  musicType: string;
  workedYear: string;
  showOnMusicProduction: boolean;
  showOnMixMaster: boolean;
  showOnLyrics: boolean;
  showOnMarketingDistribution: boolean;
}

export interface WorkedWithArtistVisibility {
  show_on_music_production: boolean;
  show_on_mix_master: boolean;
  show_on_lyrics: boolean;
  show_on_marketing_distribution: boolean;
}

export async function getArtists(): Promise<Artist[]> {
  const response = await api.get("/artists");
  const artists: ArtistResponse[] = response.data.data || [];

  return artists.map((artist) => ({
    id: artist.public_id || artist.id,
    userId: "",
    stageName: artist.stageName || artist.name || "",
    phone: artist.phone || "",
    email: artist.email || "",
    image: artist.image || "",
    totalBeats: Number(artist.totalBeats || 0),
    totalSales: Number(artist.totalSales || 0),
    joinedAt: artist.joinedAt || artist.createdAt || "",
    status: artist.status || "active",
  }));
}

export async function getWorkedWithArtists(): Promise<WorkedWithArtist[]> {
  try {
    const response = await api.get("/artists/worked-with");
    return response.data.data || [];
  } catch {
    return [];
  }
}

export async function createWorkedWithArtist(data: {
  name: string;
  url: string;
  image: string;
  popular_song: string;
  music_type: string;
  worked_year: number;
  show_on_music_production: boolean;
  show_on_mix_master: boolean;
  show_on_lyrics: boolean;
  show_on_marketing_distribution: boolean;
}): Promise<WorkedWithArtist> {
  const response = await api.post("/artists/worked-with", data);
  return response.data.data;
}

export async function updateWorkedWithArtistVisibility(
  id: number,
  visibility: WorkedWithArtistVisibility,
): Promise<WorkedWithArtist> {
  const response = await api.patch(
    `/artists/worked-with/${id}/visibility`,
    visibility,
  );
  return response.data.data;
}

export async function updateWorkedWithArtistUrl(
  id: number,
  url: string,
): Promise<WorkedWithArtist> {
  const response = await api.patch(`/artists/worked-with/${id}/url`, { url });
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
