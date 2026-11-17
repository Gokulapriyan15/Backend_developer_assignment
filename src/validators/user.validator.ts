import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  phone: z.string().trim().min(7, 'Invalid phone').max(20, 'Invalid phone'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
