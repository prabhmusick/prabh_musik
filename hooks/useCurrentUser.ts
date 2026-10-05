import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { mapUserDto } from "../lib/mappers/user.mapper";

/**
 * React Query Hook to retrieve and cache the authenticated user's profile.
 * React Query owns the server state, while Axios interceptors handle automatic refresh.
 */
export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data && response.data.success && response.data.data?.user) {
          return mapUserDto(response.data.data.user);
        }
        return null;
      } catch (error: any) {
        // Return null on 401 Unauthorized (indicates guest user / unauthenticated session)
        if (error.response?.status === 401) {
          return null;
        }
        // Propagate Server Errors (500), timeouts, or network disconnection to trigger TanStack Query error state
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}
