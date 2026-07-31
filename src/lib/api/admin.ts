import { apiFetch, toQuery, type ListMeta } from './client';
import type { Role } from '../auth/decode-role';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  role?: Role;
  status?: 'ACTIVE' | 'BANNED';
  search?: string;
  page?: number;
  limit?: number;
}

export const listUsers = async (params: ListUsersParams = {}): Promise<{ items: AdminUser[]; meta: ListMeta }> => {
  const { data, meta } = await apiFetch<AdminUser[], ListMeta>(`/admin/users${toQuery(params)}`);
  return { items: data, meta: meta! };
};

export const updateUserStatus = async (id: string, status: 'ACTIVE' | 'BANNED'): Promise<AdminUser> => {
  const { data } = await apiFetch<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: { status } });
  return data;
};

export interface PlatformStats {
  users: { total: number; customers: number; technicians: number; banned: number };
  bookings: { total: number; byStatus: Record<string, number> };
  categories: number;
  revenue: number;
}

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const { data } = await apiFetch<PlatformStats>('/admin/stats');
  return data;
};
