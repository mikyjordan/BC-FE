import { create } from 'zustand';
import type { Me } from '../api/types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  user: Me | null;
  setUser: (user: Me | null) => void;
}

/** Stato di sessione minimale. Nessun dato economico viene persistito nel browser. */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'anonymous' }),
}));

export const isStaff = (u: Me | null) => u?.role === 'ADMIN' || u?.role === 'SUPERADMIN';
/** Il Superadmin non ha saldo né portafoglio. */
export const hasWallet = (u: Me | null) => !!u && u.role !== 'SUPERADMIN';
export const hasPermission = (u: Me | null, p: string) => !!u && (u.role === 'SUPERADMIN' || u.permissions.includes(p));
