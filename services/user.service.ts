import api from '../lib/api';
import { User } from '../types/admin';

export interface BackendUser {
  id: number;
  name: string;
  mobile: string | null;
  email: string;
  role: 'admin' | 'customer';
  status: 'active' | 'blocked';
  address: string | null;
  beats_buy: number;
  user_created_date: string;
  last_purchase_date: string | null;
  last_login_time: string | null;
}

export function mapBackendToFrontend(user: BackendUser): User {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.user_created_date,
    status: user.status === 'blocked' ? 'BLOCKED' : 'ACTIVE',
    mobile: user.mobile || undefined,
    address: user.address || undefined,
    lastLogin: user.last_login_time || undefined,
    avatar: undefined
  };
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<{ success: boolean; data: BackendUser[] }>('/users');
  return response.data.data.map(mapBackendToFrontend);
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (!id) return undefined;
  const response = await api.get<{ success: boolean; data: BackendUser }>(`/users/${id}`);
  return mapBackendToFrontend(response.data.data);
}

export async function createUser(userData: any): Promise<User> {
  const response = await api.post<{ success: boolean; data: BackendUser }>('/users', userData);
  return mapBackendToFrontend(response.data.data);
}

export async function updateUser(id: string, updates: any): Promise<User> {
  const response = await api.put<{ success: boolean; data: BackendUser }>(`/users/${id}`, updates);
  return mapBackendToFrontend(response.data.data);
}

export async function blockUser(id: string): Promise<User> {
  const response = await api.patch<{ success: boolean; data: BackendUser }>(`/users/${id}/status`, {
    status: 'blocked'
  });
  return mapBackendToFrontend(response.data.data);
}

export async function unblockUser(id: string): Promise<User> {
  const response = await api.patch<{ success: boolean; data: BackendUser }>(`/users/${id}/status`, {
    status: 'active'
  });
  return mapBackendToFrontend(response.data.data);
}
