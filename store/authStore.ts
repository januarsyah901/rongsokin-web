import { create } from 'zustand';
import { User } from '@/types';
import { disconnectSocket } from '@/lib/socket';
import { useOrderStore } from '@/store/orderStore';

interface AuthStore {
  user: User | null;
  token: string | null;
  /** true setelah localStorage dibaca (sebelum itu status login belum diketahui). */
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, hydrated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    // Putus socket (masih terautentikasi sbg user lama) & kosongkan antrean
    // in-memory supaya akun berikutnya di device yang sama tidak melihatnya.
    disconnectSocket();
    useOrderStore.getState().setIncomingOrders([]);
    useOrderStore.getState().setActiveOrders([]);
    set({ user: null, token: null, hydrated: true });
  },
  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    // Sudah sinkron → jangan bikin objek user baru (memicu re-render/effect ulang).
    if (get().hydrated && get().token === token && (!!token || !get().user)) return;
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, hydrated: true });
        return;
      } catch {
        // Data rusak → bersihkan
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    set({ user: null, token: null, hydrated: true });
  },
}));
