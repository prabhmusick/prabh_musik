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
    const response = await fetch(`${API_BASE_URL}/api/beats/`, {
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
 * Fetch a single beat by ID
 * @param id - The beat ID
 * @returns Promise<Beat> - Beat object
 */
export async function fetchBeatById(id: number): Promise<Beat> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/beats/${id}/`, {
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

    const url = `${API_BASE_URL}/api/beats/?${queryParams.toString()}`;
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
