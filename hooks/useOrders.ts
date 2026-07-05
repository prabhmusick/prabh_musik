import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, deleteOrder } from "../services/order.service";
import { Order } from "../types/admin";

export const useOrders = () => {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getOrders,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData: Omit<Order, 'id' | 'createdAt'>) => createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "ownerships"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Order> }) => updateOrder(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "ownerships"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) => updateOrderStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "ownerships"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "ownerships"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};
