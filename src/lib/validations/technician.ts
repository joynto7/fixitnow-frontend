import { z } from 'zod';

export const technicianProfileFormSchema = z.object({
  bio: z.string().trim().max(1000, 'Bio must be 1000 characters or fewer').optional().or(z.literal('')),
  experienceYears: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 60), 'Must be a whole number from 0 to 60'),
  location: z.string().trim().max(150, 'Location must be 150 characters or fewer').optional().or(z.literal('')),
});
export type TechnicianProfileFormValues = z.infer<typeof technicianProfileFormSchema>;

export const serviceFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Price must be a positive number'),
  categoryId: z.string().uuid('Choose a category'),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilitySlotFormSchema = z
  .object({
    date: z.string().min(1, 'Pick a date'),
    startTime: z.string().regex(timeRegex, 'HH:mm'),
    endTime: z.string().regex(timeRegex, 'HH:mm'),
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });
export type AvailabilitySlotFormValues = z.infer<typeof availabilitySlotFormSchema>;
