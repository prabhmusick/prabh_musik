import api from "../lib/api";
import { Beat } from "../types/admin";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
const API_HOST = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
const API_OBJECT_BASE = `${API_HOST}/api`;

// ============================================================================
// DTO Mappers: Bridges Backend Column names and Frontend TypeScript typings
// ============================================================================

/**
 * Maps a backend beat record to the frontend typings shape
 */
export function mapBackendToFrontend(beat: any): Beat {
  const statusMap: Record<string, "DRAFT" | "AVAILABLE" | "SOLD"> = {
    draft: "DRAFT",
    published: "AVAILABLE",
    archived: "SOLD",
  };
  const mappedStatus = statusMap[beat.status || "draft"] || "DRAFT";

  return {
    id: String(beat.public_id || beat.id),
    artistId: "", // Artist is single/global and managed on backend
    title: beat.title || "",
    description: beat.description || "",
    genre: beat.genre || "",
    bpm: beat.bpm || 0,
    key: beat.musical_key || "",
    mood: "",
    type: "beat",
    trackType: "non-exclusive",
    tags: [],
    price: beat.price_amount ? beat.price_amount / 100 : 0,
    status: mappedStatus,
    createdAt: beat.created_at || new Date().toISOString(),
    duration: beat.duration || 0,
    assets: {
      coverImage: beat.cover_url || "",
      bannerImage: beat.banner_url || "",
      previewAudio: beat.audio_url || "",
      wavFile: beat.audio_url || "", // Wav fallback map
      stemsFile: "",
    },
    analytics: {
      plays: 0,
      downloads: 0,
      salesCount: 0,
      revenue: 0,
    },
    ownershipsCount: 0,
  };
}

/**
 * Maps frontend UI changes back to the backend database columns shape
 */
export function mapFrontendToBackend(beat: any): any {
  const data: any = {};

  if (beat.title !== undefined) data.title = beat.title;
  if (beat.description !== undefined) data.description = beat.description;
  if (beat.genre !== undefined) data.genre = beat.genre;
  if (beat.bpm !== undefined) data.bpm = Number(beat.bpm);
  if (beat.duration !== undefined) data.duration = Number(beat.duration);
  if (beat.key !== undefined) data.musical_key = beat.key;
  if (beat.price !== undefined) data.price_amount = Math.round(Number(beat.price) * 100);

  if (beat.status !== undefined) {
    const statusMapInverse: Record<string, string> = {
      DRAFT: "draft",
      AVAILABLE: "published",
      SOLD: "archived",
    };
    data.status = statusMapInverse[beat.status] || "draft";
  }

  // Parse asset URLs back to raw storage keys
  if (beat.assets !== undefined) {
    const getRawKey = (url: string | undefined): string | null => {
      if (!url) return null;
      if (url.includes("/beats/object/")) {
        return url.split("/beats/object/").pop() || null;
      }
      try {
        const parsed = new URL(url);
        return parsed.pathname.substring(1);
      } catch {
        return url;
      }
    };

    if (beat.assets.coverImage !== undefined) {
      data.cover_key = getRawKey(beat.assets.coverImage);
    }
    if (beat.assets.bannerImage !== undefined) {
      data.banner_key = getRawKey(beat.assets.bannerImage);
    }
    if (beat.assets.previewAudio !== undefined) {
      data.audio_key = getRawKey(beat.assets.previewAudio);
    }
  }

  return data;
}

// ============================================================================
// Service Core Methods
// ============================================================================

/**
 * Retrieves all active non-archived beat records
 */
export async function getBeats(): Promise<Beat[]> {
  try {
    const response = await api.get("/beats");
    const rawList = response?.data?.data || [];
    if (!Array.isArray(rawList)) {
      console.warn("Backend returned non-array data structure:", rawList);
      return [];
    }
    return rawList.map(mapBackendToFrontend);
  } catch (error) {
    console.error("Error fetching beats:", error);
    return [];
  }
}

/**
 * Retrieves a single beat record by ID
 */
export async function getBeat(id: string): Promise<Beat> {
  try {
    const response = await api.get(`/beats/${id}`);
    if (!response?.data?.data) {
      throw new Error("Invalid response structure from backend");
    }
    return mapBackendToFrontend(response.data.data);
  } catch (error) {
    console.error(`Error fetching beat ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new beat record in the database
 */
export async function createBeat(data: any): Promise<Beat> {
  const backendPayload = mapFrontendToBackend(data);
  const response = await api.post("/beats", backendPayload);
  return mapBackendToFrontend(response.data.data);
}

/**
 * Modifies properties of a beat record dynamically
 */
export async function updateBeat(id: string, data: any): Promise<Beat> {
  const backendPayload = mapFrontendToBackend(data);
  const response = await api.patch(`/beats/${id}`, backendPayload);
  return mapBackendToFrontend(response.data.data);
}

/**
 * Soft deletes/archives a beat
 */
export async function archiveBeat(id: string): Promise<string> {
  const response = await api.delete(`/beats/${id}`);
  return response.data.message;
}

// ============================================================================
// Compatibility Wrappers: Prevents react hooks compilation errors
// ============================================================================

export async function getBeatById(id: string): Promise<Beat | undefined> {
  try {
    return await getBeat(id);
  } catch {
    return undefined;
  }
}

export async function deleteBeat(id: string): Promise<boolean> {
  try {
    await archiveBeat(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-creates a beat record on the client side using the standard API calls
 */
export async function duplicateBeat(id: string): Promise<Beat> {
  const baseBeat = await getBeat(id);
  const duplicated: Omit<
    Beat,
    "id" | "createdAt" | "analytics" | "ownershipsCount"
  > = {
    artistId: baseBeat.artistId || "",
    title: `${baseBeat.title} (Copy)`,
    description: baseBeat.description,
    genre: baseBeat.genre,
    bpm: baseBeat.bpm,
    key: baseBeat.key,
    mood: baseBeat.mood,
    type: baseBeat.type,
    trackType: baseBeat.trackType,
    tags: baseBeat.tags || [],
    price: baseBeat.price,
    status: "DRAFT" as any, // Duplicates default to DRAFT status
    assets: {
      coverImage: baseBeat.assets.coverImage,
      bannerImage: baseBeat.assets.bannerImage,
      previewAudio: baseBeat.assets.previewAudio,
      wavFile: baseBeat.assets.wavFile,
      stemsFile: baseBeat.assets.stemsFile,
    },
  };

  return createBeat(duplicated);
}
