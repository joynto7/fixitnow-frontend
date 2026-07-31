import { create } from 'zustand';
import type { Role } from './decode-role';

export interface TechnicianProfileSummary {
  id: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  avgRating: number;
  totalReviews: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'ACTIVE' | 'BANNED';
  // null for CUSTOMER/ADMIN. Populated by register/login/getMe - the only
  // way this frontend has to learn a technician's own profile id.
  technicianProfile: TechnicianProfileSummary | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  // True only when hydration couldn't reach a definitive answer (network/server
  // error) - distinct from "confirmed logged out", which is user === null with
  // this flag false. Lets consumers avoid treating an inconclusive check as a logout.
  authCheckFailed: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
  setAuthCheckFailed: (failed: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  authCheckFailed: false,
  setAuth: (user, token) => set({ user, token, authCheckFailed: false }),
  clearAuth: () => set({ user: null, token: null }),
  setHydrated: () => set({ isHydrated: true }),
  setAuthCheckFailed: (failed) => set({ authCheckFailed: failed }),
}));
