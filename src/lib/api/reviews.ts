import { apiFetch } from './client';

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  const { data } = await apiFetch<Review>('/reviews', { method: 'POST', body: input });
  return data;
};
