import { Artist } from '../types/admin';

export const mockArtists: Artist[] = [
  {
    id: 'art_1',
    userId: 'usr_4',
    stageName: 'Beat Master',
    bio: 'Multi-platinum producer from LA.',
    totalBeats: 45,
    totalSales: 120,
    joinedAt: '2025-04-20T12:00:00Z',
    status: 'active'
  },
  {
    id: 'art_2',
    userId: 'usr_5',
    stageName: 'Alice On Track',
    bio: 'Rising star in the Lo-Fi hip hop scene.',
    totalBeats: 12,
    totalSales: 34,
    joinedAt: '2025-05-12T16:30:00Z',
    status: 'active'
  },
  {
    id: 'art_3',
    userId: 'usr_2',
    stageName: 'JD Beatz',
    totalBeats: 0,
    totalSales: 0,
    joinedAt: '2025-06-01T10:00:00Z',
    status: 'pending'
  }
];
