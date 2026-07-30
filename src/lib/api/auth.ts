import { apiFetch } from './client';
import type { AuthUser } from '../auth/store';

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const registerUser = async (input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
}): Promise<AuthResponse> => {
  const { data } = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input });
  return data;
};

export const loginUser = async (input: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input });
  return data;
};

export const getMe = async (token: string): Promise<AuthUser> => {
  const { data } = await apiFetch<AuthUser>('/auth/me', { token });
  return data;
};
