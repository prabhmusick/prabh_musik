import { localArtists, localBeats, localOrders } from './db';
import { Artist } from '../types/admin';

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

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const artists = await getArtists();
  return artists.find(artist => artist.id === id);
}
