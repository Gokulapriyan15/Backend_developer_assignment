import { z } from 'zod';

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  specialization: z.string().trim().min(1, 'specialization is required'),
  experience: z.number().int().min(0, 'experience must be >= 0'),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
