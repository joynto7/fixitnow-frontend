import { apiFetch, toQuery, type ListMeta } from './client';
import type { Category } from './categories';
import type { ServiceMedia } from './services';

export interface TechnicianServiceSummary {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryId: string;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  media: ServiceMedia[];
}

export interface TechnicianUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface TechnicianReview {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { id: string; name: string };
}

export interface Technician {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  photoUrl: string | null;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  user: TechnicianUser;
  services: TechnicianServiceSummary[];
}

export interface TechnicianDetail extends Technician {
  reviews: TechnicianReview[];
}

export interface ListTechniciansParams {
  categoryId?: string;
  location?: string;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const listTechnicians = async (
  params: ListTechniciansParams = {}
): Promise<{ items: Technician[]; meta: ListMeta }> => {
  const { data, meta } = await apiFetch<Technician[], ListMeta>(`/technicians${toQuery(params)}`);
  return { items: data, meta: meta! };
};

export const getTechnicianById = async (id: string): Promise<TechnicianDetail> => {
  const { data } = await apiFetch<TechnicianDetail>(`/technicians/${id}`);
  return data;
};

export interface UpdateTechnicianProfileInput {
  bio?: string;
  experienceYears?: number;
  location?: string;
}

export interface OwnTechnicianProfile {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  photoUrl: string | null;
  avgRating: number;
  totalReviews: number;
}

export const updateOwnProfile = async (input: UpdateTechnicianProfileInput): Promise<OwnTechnicianProfile> => {
  const { data } = await apiFetch<OwnTechnicianProfile>('/technician/profile', { method: 'PUT', body: input });
  return data;
};

export const uploadOwnPhoto = async (file: File): Promise<OwnTechnicianProfile> => {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await apiFetch<OwnTechnicianProfile>('/technician/profile/photo', {
    method: 'POST',
    body: formData,
  });
  return data;
};

export interface AvailabilitySlot {
  id: string;
  technicianId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetAvailabilitySlotInput {
  date: string;
  startTime: string;
  endTime: string;
}

export const getOwnAvailability = async (): Promise<AvailabilitySlot[]> => {
  const { data } = await apiFetch<AvailabilitySlot[]>('/technician/availability');
  return data;
};

export const getTechnicianAvailability = async (technicianId: string): Promise<AvailabilitySlot[]> => {
  const { data } = await apiFetch<AvailabilitySlot[]>(`/technicians/${technicianId}/availability`);
  return data;
};

export const setOwnAvailability = async (slots: SetAvailabilitySlotInput[]): Promise<AvailabilitySlot[]> => {
  const { data } = await apiFetch<AvailabilitySlot[]>('/technician/availability', {
    method: 'PUT',
    body: { slots },
  });
  return data;
};
