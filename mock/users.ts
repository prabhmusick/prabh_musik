import { User } from '../types/admin';

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Admin User',
    email: 'admin@prabhmusik.com',
    role: 'admin',
    createdAt: '2025-01-10T10:00:00Z',
    status: 'ACTIVE',
    mobile: '+1 (555) 019-2834',
    address: '100 Studio Way, Los Angeles, CA 90028',
    lastLogin: '2026-06-23T12:00:00Z'
  },
  {
    id: 'usr_2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'customer',
    createdAt: '2025-02-15T14:30:00Z',
    status: 'ACTIVE',
    mobile: '+1 (555) 012-3456',
    address: '123 Music Ln, Nashville, TN 37203',
    lastLogin: '2026-06-22T15:45:00Z'
  },
  {
    id: 'usr_3',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'customer',
    createdAt: '2025-03-01T09:15:00Z',
    status: 'ACTIVE',
    mobile: '+1 (555) 098-7654',
    address: '456 Studio Rd, Atlanta, GA 30309',
    lastLogin: '2026-06-18T10:20:00Z'
  },
  {
    id: 'usr_4',
    name: 'Beat Master',
    email: 'producer1@example.com',
    role: 'customer',
    createdAt: '2025-04-20T11:45:00Z',
    status: 'ACTIVE',
    mobile: '+1 (555) 045-6789',
    address: '789 Synth Blvd, New York, NY 10001',
    lastLogin: '2026-06-23T11:15:00Z'
  },
  {
    id: 'usr_5',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    role: 'customer',
    createdAt: '2025-05-12T16:20:00Z',
    status: 'BLOCKED',
    mobile: '+1 (555) 078-9012',
    address: '321 Retro Dr, Miami, FL 33101',
    lastLogin: '2026-06-15T09:30:00Z'
  }
];
