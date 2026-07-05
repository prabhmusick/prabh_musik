import api from '../lib/api';
import { Order } from '../types/admin';

export interface BackendOrder {
  id: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  items: {
    beatId: number;
    title: string;
    price: number;
    licenseType: string;
  }[];
}

export function mapBackendToFrontend(order: BackendOrder): Order {
  let status: Order['status'] = 'PENDING';
  if (order.status === 'paid') {
    status = 'COMPLETED';
  } else if (order.status === 'failed') {
    status = 'FAILED';
  } else if (order.status === 'refunded') {
    status = 'REFUNDED';
  }

  return {
    id: String(order.id),
    customerId: String(order.customer.id),
    beatIds: order.items.map(item => String(item.beatId)),
    totalAmount: order.totalAmount,
    status,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod
  };
}

export async function getOrders(): Promise<Order[]> {
  const response = await api.get<{ success: boolean; data: BackendOrder[] }>('/orders');
  return response.data.data.map(mapBackendToFrontend);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  if (!id) return undefined;
  const response = await api.get<{ success: boolean; data: BackendOrder }>(`/orders/${id}`);
  return mapBackendToFrontend(response.data.data);
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const status = orderData.status === 'COMPLETED' ? 'paid' : orderData.status.toLowerCase();
  
  const response = await api.post<{ success: boolean; data: BackendOrder }>('/orders', {
    customerId: parseInt(orderData.customerId, 10),
    beatIds: orderData.beatIds.map(id => parseInt(id, 10)),
    paymentMethod: orderData.paymentMethod,
    status
  });
  return mapBackendToFrontend(response.data.data);
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const payload: any = {};
  if (updates.paymentMethod !== undefined) {
    payload.paymentMethod = updates.paymentMethod;
  }
  if (updates.status !== undefined) {
    payload.status = updates.status === 'COMPLETED' ? 'paid' : updates.status.toLowerCase();
  }
  
  const response = await api.put<{ success: boolean; data: BackendOrder }>(`/orders/${id}`, payload);
  return mapBackendToFrontend(response.data.data);
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  const backendStatus = status === 'COMPLETED' ? 'paid' : status.toLowerCase();
  
  const response = await api.patch<{ success: boolean; data: BackendOrder }>(`/orders/${id}/status`, {
    status: backendStatus
  });
  return mapBackendToFrontend(response.data.data);
}

export async function deleteOrder(id: string): Promise<boolean> {
  await api.delete<{ success: boolean }>(`/orders/${id}`);
  return true;
}
