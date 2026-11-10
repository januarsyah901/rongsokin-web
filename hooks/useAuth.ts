import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
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

// ── Update profil user ───────────────────────────────────────────────────
/**
 * PATCH /auth/me — body: { name?, phone?, avatarUrl?, lat?, lng?, nik?, ktpName?, kycAttestation? }
 * Tidak ada lagi fallback "optimistic" saat endpoint hilang: dulu 404/405/501
 * dianggap sukses & hanya mengubah localStorage, sehingga user mengira profilnya
 * tersimpan padahal tidak. Error kini diteruskan ke pemanggil (409, 429, dst).
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

export const useUpdateMe = () => {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: UpdateMePayload): Promise<User> => {
      const res = await api.patch<{ status: string; data: User }>('/auth/me', payload);
      // Status verifikasi SELALU dari server — jangan ditandai verified di sisi client.
      return res.data.data;
    },
    onSuccess: (updated) => {
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
    mutationFn: async (payload: ResetPasswordPayload) => {
      const res = await api.post<{ status: string; message: string }>('/auth/reset-password', payload);
      return res.data;
    },
  });
};
