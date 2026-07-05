import { Ownership } from '../types/admin';

export const mockOwnerships: Ownership[] = [
  {
    id: 'own_1',
    beatId: 'bt_1',
    customerId: 'usr_2',
    licenseType: 'exclusive',
    purchasedAt: '2025-06-15T10:30:00Z',
    pricePaid: 199.99,
    transactionId: 'txn_987654321'
  },
  {
    id: 'own_2',
    beatId: 'bt_2',
    customerId: 'usr_4',
    licenseType: 'exclusive',
    purchasedAt: '2025-06-16T14:15:00Z',
    pricePaid: 149.99,
    transactionId: 'txn_123456789'
  }
];
