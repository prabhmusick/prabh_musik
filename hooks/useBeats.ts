import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBeats, getBeatById, createBeat, updateBeat, deleteBeat, duplicateBeat } from "../services/beat.service";
import { Beat } from "../types/admin";

export const useBeats = () => {
  return useQuery({
    queryKey: ["admin", "beats"],
    queryFn: getBeats,
  });
};

export const useBeat = (id: string) => {
  return useQuery({
    queryKey: ["admin", "beats", id],
    queryFn: () => getBeatById(id),
    enabled: !!id,
  });
};

export const useCreateBeat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    },
  });
};

export const useUpdateBeat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updatedFields }: { id: string; updatedFields: Partial<Beat> }) => 
      updateBeat(id, updatedFields),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "beats", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    },
  });
};

export const useDeleteBeat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    },
  });
};

export const useDuplicateBeat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateBeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboardMetrics"] });
    },
  });
};
