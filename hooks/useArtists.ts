import { useQuery } from "@tanstack/react-query";
import { getArtists, getArtistById } from "../services/artist.service";

export const useArtists = () => {
  return useQuery({
    queryKey: ["admin", "artists"],
    queryFn: getArtists,
  });
};

export const useArtist = (id: string) => {
  return useQuery({
    queryKey: ["admin", "artists", id],
    queryFn: () => getArtistById(id),
    enabled: !!id,
  });
};
