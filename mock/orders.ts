import { Order } from '../types/admin';

export const mockOrders: Order[] = [
  {
    id: 'ord_1',
    customerId: 'usr_2',
    beatIds: ['bt_1'],
    totalAmount: 199.99,
    status: 'COMPLETED',
    createdAt: '2025-06-15T10:30:00Z',
    paymentMethod: 'credit_card'
  },
  {
    id: 'ord_2',
    customerId: 'usr_4',
    beatIds: ['bt_2'],
    totalAmount: 149.99,
    status: 'COMPLETED',
    createdAt: '2025-06-16T14:15:00Z',
    paymentMethod: 'paypal'
  },
  {
    id: 'ord_3',
    customerId: 'usr_2',
    beatIds: ['bt_3'],
    totalAmount: 99.99,
    status: 'PENDING',
    createdAt: '2025-06-20T09:00:00Z',
    paymentMethod: 'crypto'
  }
];
