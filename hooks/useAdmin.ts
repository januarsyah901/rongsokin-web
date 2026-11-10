import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { AdminStats, AdminOrdersResponse, WasteCategory } from '@/types';
import { useAuthStore } from '@/store/authStore';

/**
 * Endpoint admin (semua butuh authorize('ADMIN') di BE):
 *   GET    /admin/stats
 *   GET    /admin/orders?status=&page=&limit=
 *   POST   /admin/categories      body: { name, iconUrl? }
 *   PATCH  /admin/categories/:id  body: { name?, iconUrl? }
 *   DELETE /admin/categories/:id
 *
 * Dulu hook ini mengembalikan data dummy / sukses palsu saat 404, sehingga admin
 * bisa "menambah" kategori yang tak pernah tersimpan. Endpoint sudah ada di BE,
 * jadi semua error kini diteruskan ke UI.
 */

// ── Stats ───────────────────────────────────────────────────────────────
export const useAdminStats = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const res = await api.get<{ status: string; data: AdminStats }>('/admin/stats');
      return res.data.data;
    },
    enabled: !!token,
    staleTime: 60_000,
  });
};

// ── Orders monitoring ───────────────────────────────────────────────────
export interface AdminOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const useAdminOrders = (params: AdminOrdersParams = {}) => {
  const token = useAuthStore((s) => s.token);
  const { status, page = 1, limit = 20 } = params;
  return useQuery({
    queryKey: ['admin', 'orders', { status, page, limit }],
    queryFn: async (): Promise<AdminOrdersResponse> => {
      const res = await api.get<{ status: string; data: AdminOrdersResponse }>('/admin/orders', {
        params: { status, page, limit },
      });
      return res.data.data;
    },
    enabled: !!token,
  });
};

// ── Category CRUD ───────────────────────────────────────────────────────
export interface CategoryPayload {
  name: string;
  iconUrl?: string;
  description?: string;
  parentId?: string | null;
  unit?: 'kg' | 'liter' | 'pcs';
  sortOrder?: number;
}

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload): Promise<WasteCategory> => {
      const res = await api.post<{ status: string; data: WasteCategory }>('/admin/categories', payload);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CategoryPayload>;
    }): Promise<WasteCategory> => {
      const res = await api.patch<{ status: string; data: WasteCategory }>(
        `/admin/categories/${id}`,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string }> => {
      await api.delete(`/admin/categories/${id}`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
