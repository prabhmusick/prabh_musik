import { User, Artist, Beat, Order, Ownership, Activity } from '../types/admin';
import { mockUsers } from '../mock/users';
import { mockArtists } from '../mock/artists';
import { mockBeats } from '../mock/beats';
import { mockOrders } from '../mock/orders';
import { mockOwnerships } from '../mock/ownerships';

// Sourced from central DB with correct casing types
export let localUsers: User[] = [...mockUsers];
export let localArtists: Artist[] = [...mockArtists];
export let localBeats: Beat[] = [...mockBeats];
export let localOrders: Order[] = [...mockOrders];

export let localOwnerships: Ownership[] = mockOwnerships.map(own => ({
  ...own,
  licenseType: 'exclusive' // Only Exclusive is supported
}));

// Prepopulate activity log with initial history matching the mock completed orders
export let localActivities: Activity[] = [
  {
    id: 'act_1',
    description: 'Order #ord_1 created by customer John Doe for $199.99',
    timestamp: '2025-06-15T10:30:00Z',
    type: 'order'
  },
  {
    id: 'act_2',
    description: 'Ownership license assigned for "Midnight Drive" to customer John Doe',
    timestamp: '2025-06-15T10:30:05Z',
    type: 'ownership'
  },
  {
    id: 'act_3',
    description: 'Beat "Midnight Drive" marked as SOLD',
    timestamp: '2025-06-15T10:30:10Z',
    type: 'beat'
  },
  {
    id: 'act_4',
    description: 'Order #ord_2 created by customer Beat Master for $149.99',
    timestamp: '2025-06-16T14:15:00Z',
    type: 'order'
  },
  {
    id: 'act_5',
    description: 'Ownership license assigned for "Summer Vibes" to customer Beat Master',
    timestamp: '2025-06-16T14:15:05Z',
    type: 'ownership'
  },
  {
    id: 'act_6',
    description: 'Beat "Summer Vibes" marked as SOLD',
    timestamp: '2025-06-16T14:15:10Z',
    type: 'beat'
  }
];

export function logActivity(description: string, type: 'order' | 'ownership' | 'beat' | 'system') {
  localActivities.unshift({
    id: `act_${Math.random().toString(36).substr(2, 9)}`,
    description,
    timestamp: new Date().toISOString(),
    type
  });
}

// Reset functions if needed for clean state testing (optional)
export function resetDb() {
  localUsers = [...mockUsers];
  localArtists = [...mockArtists];
  localBeats = [...mockBeats];
  localOrders = [...mockOrders];
  localOwnerships = mockOwnerships.map(own => ({ ...own, licenseType: 'exclusive' }));
}
