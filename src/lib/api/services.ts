import { apiFetch, toQuery, type ListMeta } from './client';
import type { Category } from './categories';

export interface ServiceTechnician {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  photoUrl: string | null;
  avgRating: number;
  totalReviews: number;
  user: { id: string; name: string };
}

export interface ServiceMedia {
  id: string;
  serviceId: string;
  url: string;
  type: 'PHOTO' | 'VIDEO';
  createdAt: string;
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
  media: ServiceMedia[];
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

export interface CreateServiceInput {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  const { data } = await apiFetch<Service>('/services', { method: 'POST', body: input });
  return data;
};

export const updateService = async (id: string, input: UpdateServiceInput): Promise<Service> => {
  const { data } = await apiFetch<Service>(`/services/${id}`, { method: 'PUT', body: input });
  return data;
};

export const deleteService = async (id: string): Promise<void> => {
  await apiFetch<null>(`/services/${id}`, { method: 'DELETE' });
};

export const uploadServiceMedia = async (serviceId: string, file: File): Promise<ServiceMedia> => {
  const formData = new FormData();
  formData.append('media', file);
  const { data } = await apiFetch<ServiceMedia>(`/services/${serviceId}/media`, {
    method: 'POST',
    body: formData,
  });
  return data;
};

export const deleteServiceMedia = async (serviceId: string, mediaId: string): Promise<void> => {
  await apiFetch<null>(`/services/${serviceId}/media/${mediaId}`, { method: 'DELETE' });
};
