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
}

function mapBackendToFrontend(ownership: BackendOwnership): Ownership {
  return {
    id: ownership.public_id || String(ownership.id),
    beatId: String(ownership.beat_id),
    beatTitle: ownership.beat_title,
    customerId: String(ownership.user_id),
    customerName: ownership.customer_name,
    customerEmail: ownership.customer_email,
    licenseType: ownership.license_type,
    purchasedAt: ownership.purchase_date,
    pricePaid: ownership.purchase_price / 100,
    transactionId: String(ownership.order_id),
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
