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

export interface CategoryInput {
  name: string;
  description?: string;
}

export const createCategory = async (input: CategoryInput): Promise<Category> => {
  const { data } = await apiFetch<Category>('/admin/categories', { method: 'POST', body: input });
  return data;
};

export const updateCategory = async (id: string, input: Partial<CategoryInput>): Promise<Category> => {
  const { data } = await apiFetch<Category>(`/admin/categories/${id}`, { method: 'PUT', body: input });
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiFetch<null>(`/admin/categories/${id}`, { method: 'DELETE' });
};
