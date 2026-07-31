import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
