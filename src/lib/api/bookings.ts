import { apiFetch, toQuery, type ListMeta } from './client';
import type { Category } from './categories';

export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const CANCELLABLE_STATUSES: BookingStatus[] = ['REQUESTED', 'ACCEPTED', 'PAID'];

export interface BookingService {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryId: string;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface BookingTechnician {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; phone: string | null };
}

export interface BookingCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  transactionId: string;
  amount: string;
  provider: 'STRIPE' | 'SSLCOMMERZ';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  technicianId: string;
  serviceId: string;
  scheduledDate: string;
  address: string;
  notes: string | null;
  status: BookingStatus;
  price: string;
  createdAt: string;
  updatedAt: string;
  service: BookingService;
  technician: BookingTechnician;
  customer: BookingCustomer;
  payment: BookingPayment | null;
}

export interface CreateBookingInput {
  serviceId: string;
  availabilitySlotId: string;
  address: string;
  notes?: string;
}

export interface ListBookingsParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  const { data } = await apiFetch<Booking>('/bookings', { method: 'POST', body: input });
  return data;
};

export const listMyBookings = async (
  params: ListBookingsParams = {}
): Promise<{ items: Booking[]; meta: ListMeta }> => {
  const { data, meta } = await apiFetch<Booking[], ListMeta>(`/bookings${toQuery(params)}`);
  return { items: data, meta: meta! };
};

export const getBookingById = async (id: string): Promise<Booking> => {
  const { data } = await apiFetch<Booking>(`/bookings/${id}`);
  return data;
};

export const cancelBooking = async (id: string): Promise<Booking> => {
  const { data } = await apiFetch<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' });
  return data;
};

export const listTechnicianBookings = async (
  params: ListBookingsParams = {}
): Promise<{ items: Booking[]; meta: ListMeta }> => {
  const { data, meta } = await apiFetch<Booking[], ListMeta>(`/technician/bookings${toQuery(params)}`);
  return { items: data, meta: meta! };
};

export type TechnicianBookingAction = 'ACCEPT' | 'DECLINE' | 'START' | 'COMPLETE';

export const updateTechnicianBookingStatus = async (
  id: string,
  action: TechnicianBookingAction
): Promise<Booking> => {
  const { data } = await apiFetch<Booking>(`/technician/bookings/${id}`, { method: 'PATCH', body: { action } });
  return data;
};
