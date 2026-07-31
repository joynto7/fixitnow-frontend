import { apiFetch } from './client';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const listCategories = async (): Promise<Category[]> => {
  const { data } = await apiFetch<Category[]>('/categories');
  return data;
};
