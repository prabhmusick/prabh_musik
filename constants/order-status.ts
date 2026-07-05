export const ORDER_STATUSES = [
  "completed",
  "pending",
  "failed",
  "refunded",
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
