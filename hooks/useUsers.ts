import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getUserById, createUser, updateUser, blockUser, unblockUser } from "../services/user.service";

export const useUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: any) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateUser(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blockUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};
