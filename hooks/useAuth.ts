import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { User, RegisterPayload } from '@/types';

interface AuthResponse {
  status: string;
  data: {
    access_token: string;
    user: User;
  };
}

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<AuthResponse>('/auth/login', payload);
      return res.data;
    },
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await api.post<AuthResponse>('/auth/register', payload);
      return res.data;
    },
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
    },
  });
};

export const useMe = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<{ status: string; data: User }>('/auth/me');
      return res.data.data;
    },
    enabled: !!token,
  });
};

// ── Update profil user (customer) ────────────────────────────────────────
/**
 * Endpoint yang dibutuhkan BE: PATCH /auth/me
 *   body: { name?, phone?, avatarUrl?, lat?, lng? }
 *   response: { status, data: User }
 *
 * Selama BE belum siap (return 404/405/501), hook ini akan tetap update
 * authStore lokal supaya UI optimistic; nanti BE jadi → otomatis sync.
 */
export interface UpdateMePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  /** KYC menyusul (akun belum terverifikasi) */
  nik?: string;
  ktpName?: string;
  kycAttestation?: string;
}

const isMissingRoute = (err: unknown): boolean => {
  const s = (err as AxiosError | undefined)?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

export const useUpdateMe = () => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: UpdateMePayload): Promise<User> => {
      try {
        const res = await api.patch<{ status: string; data: User }>('/auth/me', payload);
        // Status verifikasi SELALU dari server — jangan ditandai verified di sisi client.
        return res.data.data;
      } catch (err) {
        if (isMissingRoute(err)) {
          // BE belum punya endpoint → simpan ke localStorage user saja
          if (!user) throw err;
          // Field KYC sengaja tidak ikut — verifikasi hanya sah dari server.
          const merged: User = {
            ...user,
            name: payload.name ?? user.name,
            phone: payload.phone ?? user.phone,
            avatarUrl: payload.avatarUrl ?? user.avatarUrl,
          } as User;
          if (token) setAuth(merged, token);
          return merged;
        }
        throw err; // termasuk 409 "Identitas sudah terdaftar." → ditangani pemanggil
      }
    },
    onSuccess: (updated) => {
      // Sync ke authStore + cache
      if (token) setAuth(updated, token);
      qc.setQueryData(['me'], updated);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<{ status: string; message: string }>('/auth/forgot-password', { email });
      return res.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<{ status: string; message: string }>('/auth/reset-password', payload);
      return res.data;
    },
  });
};
