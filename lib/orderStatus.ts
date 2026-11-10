import type { Order, OrderMethod, OrderStatus } from '@/types';

/** Label singkat status pesanan (badge riwayat/dashboard). Satu sumber kebenaran. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Mencari Pengepul',
  CONFIRMED: 'Diterima',
  ON_THE_WAY: 'Dalam Perjalanan',
  IN_PROGRESS: 'Sedang Ditimbang',
  AWAITING_CONFIRMATION: 'Perlu Konfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

/** Kalimat status untuk toast/notifikasi: "Pesanan #ABCDE kini <...>". */
export const ORDER_STATUS_SENTENCE: Record<OrderStatus, string> = {
  PENDING: 'menunggu pengepul',
  CONFIRMED: 'diterima pengepul',
  ON_THE_WAY: 'dalam perjalanan',
  IN_PROGRESS: 'sudah sampai — sedang ditimbang',
  AWAITING_CONFIRMATION: 'menunggu konfirmasi hasil timbang',
  COMPLETED: 'selesai',
  CANCELLED: 'dibatalkan',
};

/** Status yang masih berjalan (belum selesai/batal). */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
];

export const isOrderStatus = (s: unknown): s is OrderStatus =>
  typeof s === 'string' && s in ORDER_STATUS_LABEL;

/** Label badge yang memperhitungkan order forward (langsung ke satu lapak). */
export const getOrderStatusLabel = (order: Pick<Order, 'status' | 'collectorId'>): string => {
  if (order.status === 'PENDING' && order.collectorId) return 'Menunggu Persetujuan';
  return ORDER_STATUS_LABEL[order.status] ?? order.status;
};

/** Nomor pesanan pendek yang konsisten di seluruh UI. */
export const shortOrderId = (id: string) => `#${id.slice(-5).toUpperCase()}`;

/** Label metode serah-terima (dulu tampil mentah "PICKUP"/"DROPOFF"). */
export const ORDER_METHOD_LABEL: Record<OrderMethod, string> = {
  PICKUP: 'Dijemput',
  DROPOFF: 'Antar Sendiri',
};

export const methodLabel = (m?: string) =>
  (m && ORDER_METHOD_LABEL[m as OrderMethod]) || m || '—';
