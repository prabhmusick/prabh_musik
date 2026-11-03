import api from "../lib/api";
import { Ownership } from "../types/admin";

interface BackendOwnership {
  id: number;
  public_id: string;
  user_id: number;
  beat_id: number;
  order_id: number;
  license_type: Ownership["licenseType"];
  purchase_price: number;
  purchase_date: string;
  status: string;
  customer_name: string;
  customer_email: string;
  beat_title: string;
  customer_mobile?: string | null;
  customer_address?: string | null;
  beat_public_id?: string | null;
  beat_genre?: string | null;
  beat_mood?: string | null;
  beat_bpm?: number | null;
  beat_key?: string | null;
  beat_description?: string | null;
  beat_duration?: number | null;
  currency_code?: string | null;
  artist_public_id?: string | null;
  artist_name?: string | null;
  artist_email?: string | null;
  artist_phone?: string | null;
  order_public_id?: string | null;
  order_total_amount?: number | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  order_transaction_id?: string | null;
  payment_gateway?: string | null;
  order_status?: string | null;
  fulfillment_status?: string | null;
  download_count?: number | null;
  max_downloads?: number | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

function mapBackendToFrontend(ownership: BackendOwnership): Ownership {
  return {
    id: ownership.public_id || String(ownership.id),
    beatId: String(ownership.beat_id),
    beatPublicId: ownership.beat_public_id || undefined,
    beatTitle: ownership.beat_title,
    beatGenre: ownership.beat_genre || undefined,
    beatMood: ownership.beat_mood || undefined,
    beatBpm: ownership.beat_bpm ?? undefined,
    beatKey: ownership.beat_key || undefined,
    beatDescription: ownership.beat_description || undefined,
    beatDuration: ownership.beat_duration ?? undefined,
    customerId: String(ownership.user_id),
    customerName: ownership.customer_name,
    customerEmail: ownership.customer_email,
    customerMobile: ownership.customer_mobile || undefined,
    customerAddress: ownership.customer_address || undefined,
    artistName: ownership.artist_name || undefined,
    artistPublicId: ownership.artist_public_id || undefined,
    artistEmail: ownership.artist_email || undefined,
    artistPhone: ownership.artist_phone || undefined,
    licenseType: ownership.license_type,
    purchasedAt: ownership.purchase_date,
    pricePaid: ownership.purchase_price / 100,
    currencyCode: ownership.currency_code || "INR",
    transactionId:
      ownership.order_transaction_id || String(ownership.order_id),
    paymentTransactionId: ownership.order_transaction_id || undefined,
    orderId: String(ownership.order_id),
    orderPublicId: ownership.order_public_id || undefined,
    orderTotalAmount:
      ownership.order_total_amount === null ||
      ownership.order_total_amount === undefined
        ? undefined
        : ownership.order_total_amount / 100,
    paymentMethod: ownership.payment_method || undefined,
    paymentReference: ownership.payment_reference || undefined,
    paymentGateway: ownership.payment_gateway || undefined,
    orderStatus: ownership.order_status || undefined,
    fulfillmentStatus: ownership.fulfillment_status || undefined,
    status: ownership.status,
    downloadCount: ownership.download_count ?? 0,
    maxDownloads: ownership.max_downloads ?? null,
    expiresAt: ownership.expires_at,
    revokedAt: ownership.revoked_at,
    createdAt: ownership.created_at,
    updatedAt: ownership.updated_at,
  };
}

export async function getOwnerships(): Promise<Ownership[]> {
  const response = await api.get<{
    success: boolean;
    data: BackendOwnership[];
  }>("/ownerships/admin");
  return response.data.data.map(mapBackendToFrontend);
}

export async function getOwnershipById(
  id: string,
): Promise<Ownership | undefined> {
  if (!id) return undefined;
  const response = await api.get<{ success: boolean; data: BackendOwnership }>(
    `/ownerships/${id}`,
  );
  return mapBackendToFrontend(response.data.data);
}

export async function revokeOwnership(id: string): Promise<boolean> {
  await api.delete(`/ownerships/${id}`);
  return true;
}
