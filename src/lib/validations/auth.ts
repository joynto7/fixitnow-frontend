import { z } from 'zod';

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(6, 'Phone must be at least 6 characters').max(20).optional(),
  role: z.enum(['CUSTOMER', 'TECHNICIAN']),
});
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
