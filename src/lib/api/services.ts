import { apiFetch, toQuery, type ListMeta } from './client';
import type { Category } from './categories';

export interface ServiceTechnician {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  avgRating: number;
  totalReviews: number;
  user: { id: string; name: string };
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryId: string;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  technician: ServiceTechnician;
}

export interface ListServicesParams {
  categoryId?: string;
  technicianId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const listServices = async (
  params: ListServicesParams = {}
): Promise<{ items: Service[]; meta: ListMeta }> => {
  const { data, meta } = await apiFetch<Service[], ListMeta>(`/services${toQuery(params)}`);
  return { items: data, meta: meta! };
};

export const getServiceById = async (id: string): Promise<Service> => {
  const { data } = await apiFetch<Service>(`/services/${id}`);
  return data;
};
