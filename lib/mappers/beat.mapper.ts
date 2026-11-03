import { BeatItem } from "@/app/contexts/app-shell-context";

/**
 * Normalizes any price representation into a numeric rupee value or null if invalid.
 * Never treats missing or corrupted prices as 0.
 */
export function normalizeBeatPrice(
  rawPrice?: any,
  rawPriceAmount?: any,
  rawFormattedPrice?: any,
): number | null {
  // 1. Authoritative integer paise amount from database/API
  if (
    rawPriceAmount !== undefined &&
    rawPriceAmount !== null &&
    rawPriceAmount !== ""
  ) {
    const paise = Number(rawPriceAmount);
    if (!isNaN(paise) && paise > 0) {
      return Math.round(paise) / 100;
    }
  }

  // 2. Formatted price string (e.g. "249.99" or "₹249.99")
  if (typeof rawFormattedPrice === "string" && rawFormattedPrice.trim()) {
    const cleaned = rawFormattedPrice.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.round(parsed * 100) / 100;
    }
  }

  // 3. Direct price field (number in rupees or numeric string)
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
    if (typeof rawPrice === "number") {
      if (!isNaN(rawPrice) && rawPrice > 0) {
        return Math.round(rawPrice * 100) / 100;
      }
    } else if (typeof rawPrice === "string") {
      const cleaned = rawPrice.replace(/[^0-9.]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed * 100) / 100;
      }
    }
  }

  return null;
}

/**
 * Maps any backend Beat DTO or API beat response into the canonical frontend BeatItem format.
 * Ensures consistent title, producer, artist, price, artwork, preview, and metadata across all surfaces.
 */
export function mapBeatDto(dto: any): BeatItem {
  if (!dto || typeof dto !== "object") {
    throw new Error("Cannot map empty beat DTO");
  }

  const price = normalizeBeatPrice(
    dto.price,
    dto.price_amount,
    dto.formatted_price,
  );

  // Authoritative artist / producer resolution
  const artistName =
    dto.related_artist_name ||
    dto.artist_name ||
    dto.artist ||
    dto.producer ||
    "Prabh Musik";

  const title = dto.title || dto.beat_name || dto.name || "Untitled";

  const cover =
    dto.cover_url ||
    dto.cover_image_url ||
    dto.banner_url ||
    dto.banner_image_url ||
    dto.cover ||
    dto.img ||
    "/beats_bg.png";

  const previewUrl =
    dto.audio_url ||
    dto.previewUrl ||
    dto.audioUrl ||
    "";

  const id = dto.public_id || dto.id;

  const genre =
    typeof dto.genre === "string" && dto.genre.trim()
      ? dto.genre.trim()
      : "Music";

  const bpm =
    dto.bpm !== undefined && dto.bpm !== null && !isNaN(Number(dto.bpm))
      ? Number(dto.bpm)
      : undefined;

  return {
    id,
    title,
    producer: artistName,
    artist: artistName,
    price,
    cover,
    genre,
    bpm,
    previewUrl,
    plays: Number(dto.play_count || dto.plays || 0),
  };
}
