import { z } from 'zod';

export const bookingFormSchema = z.object({
  scheduledDate: z.string().min(1, 'Pick a date and time'),
  address: z.string().trim().min(5, 'Address is required').max(300),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const reviewFormSchema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
