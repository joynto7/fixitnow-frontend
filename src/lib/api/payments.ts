import { apiFetch } from './client';

export type PaymentProvider = 'STRIPE' | 'SSLCOMMERZ';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentBookingService {
  id: string;
  title: string;
  description: string | null;
  price: string;
  categoryId: string;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentBookingTechnician {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number | null;
  location: string | null;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface PaymentBooking {
  id: string;
  customerId: string;
  technicianId: string;
  serviceId: string;
  scheduledDate: string;
  address: string;
  notes: string | null;
  status: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  service: PaymentBookingService;
  customer: { id: string; name: string; email: string };
  technician: PaymentBookingTechnician;
}

export interface Payment {
  id: string;
  bookingId: string;
  transactionId: string;
  amount: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  paidAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  booking: PaymentBooking;
}

export interface CreatePaymentInput {
  bookingId: string;
  provider: PaymentProvider;
}

export interface CreatePaymentResult {
  payment: {
    id: string;
    bookingId: string;
    transactionId: string;
    amount: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    createdAt: string;
    updatedAt: string;
  };
  redirectUrl: string;
}

export const createPaymentSession = async (input: CreatePaymentInput): Promise<CreatePaymentResult> => {
  const { data } = await apiFetch<CreatePaymentResult>('/payments/create', { method: 'POST', body: input });
  return data;
};

export const confirmPayment = async (bookingId: string): Promise<void> => {
  await apiFetch('/payments/confirm', { method: 'POST', body: { bookingId } });
};

export const listMyPayments = async (): Promise<Payment[]> => {
  const { data } = await apiFetch<Payment[]>('/payments');
  return data;
};
