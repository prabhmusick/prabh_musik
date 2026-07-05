import { localOwnerships, localBeats, logActivity } from './db';
import { Ownership } from '../types/admin';

export async function getOwnerships(): Promise<Ownership[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...localOwnerships];
}

export async function getOwnershipById(id: string): Promise<Ownership | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return localOwnerships.find(own => own.id === id);
}

export async function revokeOwnership(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const index = localOwnerships.findIndex(own => own.id === id);
  if (index === -1) return false;

  const ownership = localOwnerships[index];
  const beat = localBeats.find(b => b.id === ownership.beatId);
  const beatTitle = beat ? beat.title : 'Beat';

  localOwnerships.splice(index, 1);

  // Log activity
  logActivity(`Ownership license for "${beatTitle}" revoked by administrator`, 'ownership');
  logActivity(`Beat "${beatTitle}" marked as AVAILABLE`, 'beat');

  return true;
}
