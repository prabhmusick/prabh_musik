import { localArtists, localBeats, localOrders } from './db';
import { Artist } from '../types/admin';
import api from '../lib/api';

export interface WorkedWithArtist {
  id: number;
  name: string;
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
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return localArtists.map(artist => {
    const artistBeats = localBeats.filter(b => b.artistId === artist.id);
    const totalBeats = artistBeats.length;
    
    // Count how many of this artist's beats are in completed orders
    const totalSales = localOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => {
        const artistBeatsInOrder = o.beatIds.filter(bid => artistBeats.some(ab => ab.id === bid));
        return sum + artistBeatsInOrder.length;
      }, 0);

    return {
      ...artist,
      totalBeats,
      totalSales
    };
  });
}

export async function getWorkedWithArtists(): Promise<WorkedWithArtist[]> {
  try {
    const response = await api.get('/artists/worked-with');
    return response.data.data || [];
  } catch {
    return [];
  }
}

export async function createWorkedWithArtist(data: {
  name: string;
  image: string;
  popular_song: string;
  music_type: string;
  worked_year: number;
  show_on_music_production: boolean;
  show_on_mix_master: boolean;
  show_on_lyrics: boolean;
  show_on_marketing_distribution: boolean;
}): Promise<WorkedWithArtist> {
  const response = await api.post('/artists/worked-with', data);
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

export async function deleteWorkedWithArtist(id: number): Promise<void> {
  await api.delete(`/artists/worked-with/${id}`);
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const artists = await getArtists();
  return artists.find(artist => artist.id === id);
}

export async function createArtist(data: {
  name: string;
  phone?: string;
  email?: string;
  image_key?: string;
}): Promise<Artist> {
  const response = await api.post('/artists', data);
  return response.data.data;
}
