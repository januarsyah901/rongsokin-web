import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { CollectorProfile, CollectorCatalog } from '@/types';
import { useAuthStore } from '@/store/authStore';

// Catatan: pengepul TIDAK lagi punya radius layanan (jangkauan unlimited) —
// semua tawaran masuk ke antreannya & bisa ditolak kalau kejauhan.
export interface SetupProfilePayload {
  shopName?: string;
  lapak_name?: string; // fallback
  description?: string;
  shopImageUrl?: string; // foto sampul / latar lapak
  isOpen?: boolean;
  is_open?: boolean; // fallback
  lat?: number;
  lng?: number;
}

export interface CatalogItemPayload {
  categoryId: string;
  category_id?: string; // fallback
  minPrice: number;
  price_min?: number; // fallback
  maxPrice: number;
  price_max?: number; // fallback
  isActive?: boolean;
  is_active?: boolean; // fallback
}

export const useCollectorProfile = () => {
  const token = useAuthStore((state) => state.token);
  // Hanya pengepul yang punya profil lapak — customer dulu ikut memanggil & kena 403.
  const isCollector = useAuthStore((state) => state.user?.role === 'COLLECTOR');

  return useQuery({
    queryKey: ['collectorProfile'],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: CollectorProfile }>('/collector/profile');
      return res.data.data;
    },
    enabled: !!token && isCollector,
  });
};

/** Data lapak tampil di pencarian & profil publik → ikut disegarkan. */
const invalidateCollectorViews = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['collectorProfile'] });
  qc.invalidateQueries({ queryKey: ['collectors'] });
  qc.invalidateQueries({ queryKey: ['collectorDetails'] });
};

export const useUpdateCollectorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SetupProfilePayload) => {
      const formatted: Record<string, unknown> = {
        shopName: payload.shopName || payload.lapak_name,
        description: payload.description,
        isOpen: payload.isOpen !== undefined ? payload.isOpen : payload.is_open,
      };
      if (payload.shopImageUrl !== undefined) formatted.shopImageUrl = payload.shopImageUrl;
      if (payload.lat !== undefined) formatted.lat = payload.lat;
      if (payload.lng !== undefined) formatted.lng = payload.lng;

      // POST = upsert di BE. Dulu error apa pun (422/429/403) memicu PATCH ulang
      // yang sama — request ganda & pesan error asli hilang.
      const res = await api.post<{ status: string; data: CollectorProfile }>('/collector/profile', formatted);
      return res.data.data;
    },
    onSuccess: () => invalidateCollectorViews(queryClient),
  });
};

export const useUpdateCatalogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogs: CatalogItemPayload[]) => {
      const formatted = catalogs.map((c) => ({
        categoryId: c.categoryId || c.category_id!,
        minPrice: c.minPrice || c.price_min!,
        maxPrice: c.maxPrice || c.price_max!,
        isActive: c.isActive !== undefined ? c.isActive : c.is_active,
      }));
      const res = await api.patch<{ status: string; data: CollectorCatalog[] }>('/collector/catalogs', formatted);
      return res.data;
    },
    onSuccess: () => invalidateCollectorViews(queryClient),
  });
};
