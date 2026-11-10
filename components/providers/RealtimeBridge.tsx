"use client";

import { useSocket } from "@/hooks/useSocket";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Memasang listener real-time SEKALI untuk seluruh area dashboard: socket
 * (pesanan baru, status, order diambil pengepul lain) + polling notifikasi
 * sebagai cadangan saat WebSocket mati. Dulu useSocket hanya dipanggil di
 * /dashboard & /collector (listener hilang begitu pindah halaman) dan
 * useNotifications tidak dipasang di mana pun.
 */
export default function RealtimeBridge() {
  useSocket();
  useNotifications();
  return null;
}
