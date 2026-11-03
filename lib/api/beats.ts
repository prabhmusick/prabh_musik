import { Beat, BeatsResponse } from "../types/beat";

const resolveApiBase = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_PUBLIC_URL;

  if (configured && configured.trim()) {
    return configured
      .trim()
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");
  }

  if (
    typeof window !== "undefined" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return "";
  }

  return "http://localhost:5005";
};

const rawApiUrl = resolveApiBase();
const API_BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : "/api";

/**
 * Fetch all beats from the backend
 * @returns Promise<Beat[]> - Array of beat objects
 */
export async function fetchBeats(): Promise<Beat[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/beats/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch beats: ${response.status} ${response.statusText}`,
      );
    }

    const data: any = await response.json();

    // Backend may return { success, count, data: [...] } or { items: [...] } or an array directly
    const items: Beat[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

    return items;
  } catch (error) {
    console.error("Error fetching beats:", error);
    return [];
  }
}

/**
 * Fetch trending beats from the backend
 * @param limit - Optional maximum number of beats to fetch
 * @returns Promise<Beat[]> - Array of beat objects
 */
export async function fetchTrendingBeats(limit: number = 4): Promise<Beat[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/beats/trending?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch trending beats: ${response.status} ${response.statusText}`,
      );
    }

    const data: any = await response.json();
    const items: Beat[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

    return items;
  } catch (error) {
    console.warn("Falling back to fetchBeats for trending:", error);
    const fallback = await fetchBeats();
    return fallback.slice(0, limit);
  }
}

/**
 * Fetch a single beat by ID
 * @param id - The beat ID
 * @returns Promise<Beat> - Beat object
 */
export async function fetchBeatById(id: number): Promise<Beat> {
  try {
    const response = await fetch(`${API_BASE_URL}/beats/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch beat: ${response.status} ${response.statusText}`,
      );
    }

    const json: any = await response.json();
    // backend returns { success: true, data: beat }
    return json?.data ?? json;
  } catch (error) {
    console.error(`Error fetching beat with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Fetch a beat by public ID, slug, or numeric ID with multiple fallback strategies.
 * Resolves against backend /api/beats/:publicId, /api/beats/slug/:slug, or catalog lookup.
 */
export async function fetchBeatByIdOrSlug(
  idOrSlug: string | number,
): Promise<any | null> {
  const query = String(idOrSlug || "").trim();
  if (!query) return null;

  // 1. Try /api/beats/:publicId
  try {
    const res = await fetch(`${API_BASE_URL}/beats/${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json: any = await res.json();
      const beatData = json?.data ?? json?.item ?? json;
      if (
        beatData &&
        (beatData.title || beatData.public_id || beatData.id || beatData.beat_name)
      ) {
        return beatData;
      }
    }
  } catch (err) {
    // Continue to next resolution strategy
  }

  // 2. Try /api/beats/slug/:slug
  try {
    const res = await fetch(
      `${API_BASE_URL}/beats/slug/${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      },
    );
    if (res.ok) {
      const json: any = await res.json();
      const beatData = json?.data ?? json?.item ?? json;
      if (
        beatData &&
        (beatData.title || beatData.public_id || beatData.id || beatData.beat_name)
      ) {
        return beatData;
      }
    }
  } catch (err) {
    // Continue to next resolution strategy
  }

  // 3. Fallback: fetch all beats and match by public_id, slug, id, or title
  try {
    const beats = await fetchBeats();
    const normalizedQuery = query.toLowerCase();
    const match = beats.find((b: any) => {
      return (
        String(b.public_id || "").toLowerCase() === normalizedQuery ||
        String(b.slug || "").toLowerCase() === normalizedQuery ||
        String(b.id || "").toLowerCase() === normalizedQuery ||
        String(b.title || b.beat_name || "").toLowerCase() === normalizedQuery
      );
    });
    if (match) return match;
  } catch (err) {
    console.error("Error finding beat in catalog fallback:", err);
  }

  return null;
}

/**
 * Fetch beats with filters
 * @param filters - Filter parameters (genre, mood, etc.)
 * @returns Promise<Beat[]> - Filtered array of beats
 */
export async function fetchBeatsWithFilters(
  filters: Record<string, string | number>,
): Promise<Beat[]> {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });

    const url = `${API_BASE_URL}/beats/?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch beats: ${response.status} ${response.statusText}`,
      );
    }

    const data: any = await response.json();
    const items: Beat[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

    return items;
  } catch (error) {
    console.error("Error fetching beats with filters:", error);
    throw error;
  }
}
