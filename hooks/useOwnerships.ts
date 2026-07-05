import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOwnerships, getOwnershipById, revokeOwnership } from "../services/ownership.service";

export const useOwnerships = () => {
  return useQuery({
    queryKey: ["admin", "ownerships"],
    queryFn: getOwnerships,
  });
};

export const useOwnership = (id: string) => {
  return useQuery({
    queryKey: ["admin", "ownerships", id],
    queryFn: () => getOwnershipById(id),
    enabled: !!id,
  });
};

export const useRevokeOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeOwnership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ownerships"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    }
  });
};
