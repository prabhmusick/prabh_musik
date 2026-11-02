import { BeatItem } from "@/app/contexts/app-shell-context";

/**
 * Maps any backend Beat DTO or API beat response into the canonical frontend BeatItem format.
 * Ensures consistent title, producer, price, artwork, preview, and metadata across all surfaces.
 */
export function mapBeatDto(dto: any): BeatItem {
  if (!dto || typeof dto !== "object") {
    throw new Error("Cannot map empty beat DTO");
  }

  // Resolve price in standard currency units (rupees, not paise)
  let price: number | null = null;
  if (dto.price_amount !== undefined && dto.price_amount !== null && !isNaN(Number(dto.price_amount))) {
    price = Number(dto.price_amount) / 100;
  } else if (dto.price !== undefined && dto.price !== null && !isNaN(Number(dto.price))) {
    price = Number(dto.price);
  }

  // Authoritative producer resolution
  const producer =
    dto.related_artist_name ||
    dto.artist_name ||
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

  return {
    id: dto.public_id || dto.id,
    title,
    producer,
    price,
    cover,
    genre: dto.genre || "Music",
    bpm: dto.bpm ? Number(dto.bpm) : undefined,
    previewUrl,
    plays: Number(dto.play_count || dto.plays || 0),
  };
}
