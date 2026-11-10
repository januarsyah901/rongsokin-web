import { useEffect } from 'react';
import { getSocket, disconnectSocket, joinRoom } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { ORDER_STATUS_SENTENCE, isOrderStatus, shortOrderId } from '@/lib/orderStatus';
import { Order, OrderItem, OrderMethod, WasteCategory } from '@/types';
import { toast } from 'react-hot-toast';

/** Payload event `new_order` — BE baru (items[]) maupun legacy (category tunggal). */
interface NewOrderPayload {
  orderId: string;
  collectorId?: string | null;
  method?: OrderMethod;
  createdAt?: string;
  photo_url?: string;
  photoUrl?: string;
  category?: string;
  estWeight?: number | string;
  items?: Array<{
    id?: string;
    categoryId: string;
    estimatedWeight?: number | string;
    estWeight?: number | string;
    category?: WasteCategory;
  }>;
}

interface StatusPayload {
  orderId: string;
  status: unknown;
}

/** Sedang membuka halaman detail order ini? (toast spesifik sudah ditampilkan di sana) */
export const isViewingOrder = (orderId: string) =>
  typeof window !== 'undefined' && window.location.pathname === `/orders/${orderId}`;

/**
 * Listener socket global (notifikasi pesanan baru & perubahan status). Dipasang
 * SEKALI di layout dashboard lewat <RealtimeBridge /> supaya tetap aktif di
 * semua halaman, bukan hanya saat dasbor terbuka.
 */
export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const addIncomingOrder = useOrderStore((state) => state.addIncomingOrder);
  const removeIncomingOrder = useOrderStore((state) => state.removeIncomingOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const addNotification = useNotificationStore((state) => state.add);

  useEffect(() => {
    if (!token || !userId) {
      disconnectSocket();
      return;
    }

    const socket = getSocket(token);

    // Room pribadi untuk notifikasi — di-join ulang otomatis tiap reconnect.
    const leaveRoom = joinRoom(
      socket,
      role === 'COLLECTOR' ? `collector:${userId}` : `customer:${userId}`
    );

    // Pesanan baru (Collector) — dukung BE legacy (single category) & BE baru (items[]).
    const handleNewOrder = (payload: NewOrderPayload) => {
      if (!payload?.orderId) return;
      const items: OrderItem[] = Array.isArray(payload.items)
        ? payload.items.map((it) => ({
            id: it.id || it.categoryId,
            orderId: payload.orderId,
            categoryId: it.categoryId,
            estimatedWeight: Number(it.estimatedWeight || it.estWeight || 0),
            category: it.category,
          }))
        : payload.category
          ? [
              {
                id: payload.category,
                orderId: payload.orderId,
                categoryId: payload.category,
                estimatedWeight: Number(payload.estWeight || 0),
              },
            ]
          : [];

      const totalWeight = items.reduce((s, i) => s + i.estimatedWeight, 0);

      const incoming: Order = {
        id: payload.orderId,
        customerId: '',
        // War (broadcast) = null/undefined; Forward (private) = userId pengepul.
        collectorId: payload.collectorId || undefined,
        method: payload.method ?? 'DROPOFF',
        status: 'PENDING',
        // createdAt ASLI dari BE supaya countdown 15 menit akurat sejak awal.
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items,
        // Foto live tumpukan rongsok (anti pesanan fiktif)
        photoUrl: payload.photo_url || payload.photoUrl,
        categoryId: items[0]?.categoryId,
        estimatedWeight: totalWeight,
      };

      addIncomingOrder(incoming);
      const isNew = addNotification({
        id: `new_order:${payload.orderId}`,
        userId,
        type: 'new_order',
        title: 'Pesanan baru masuk',
        body: `Estimasi ${totalWeight.toFixed(1)} kg — cek antreanmu.`,
        href: '/collector',
        createdAt: new Date().toISOString(),
      });
      if (isNew) {
        toast.success(`Pesanan baru masuk! Estimasi ${totalWeight.toFixed(1)} kg`, {
          icon: '♻️',
          duration: 5000,
        });
      }
    };

    // Order diambil pengepul lain / dibatalkan → hilangkan dari antrean seketika.
    const handleOrderTaken = (payload: { orderId?: string }) => {
      if (payload?.orderId) removeIncomingOrder(payload.orderId);
    };

    const handleStatusUpdate = (payload: StatusPayload) => {
      if (!payload?.orderId || !isOrderStatus(payload.status)) return;
      const status = payload.status;
      updateOrderStatus(payload.orderId, status);
      const sentence = `Pesanan ${shortOrderId(payload.orderId)} kini ${ORDER_STATUS_SENTENCE[status]}.`;
      const isNew = addNotification({
        id: `status:${payload.orderId}:${status}`,
        userId,
        type: 'status',
        title: 'Status pesanan diperbarui',
        body: sentence,
        href: `/orders/${payload.orderId}`,
        createdAt: new Date().toISOString(),
      });
      // Halaman detail pesanan sudah punya toast spesifik per aksi → jangan dobel.
      if (isNew && !isViewingOrder(payload.orderId)) {
        toast(sentence, { icon: '♻️' });
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_taken', handleOrderTaken);
    socket.on('order_status_update', handleStatusUpdate);
    socket.on('order_status_updated', handleStatusUpdate); // nama event lama

    return () => {
      // Lepas HANYA handler milik hook ini — dulu socket.off('event') tanpa
      // handler ikut mencopot listener halaman lain (mis. detail pesanan).
      leaveRoom();
      socket.off('new_order', handleNewOrder);
      socket.off('order_taken', handleOrderTaken);
      socket.off('order_status_update', handleStatusUpdate);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [token, userId, role, addIncomingOrder, removeIncomingOrder, updateOrderStatus, addNotification]);
};
