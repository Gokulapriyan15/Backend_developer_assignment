import { z } from 'zod';
import { objectIdSchema } from './common.validator';

/** Accepts an ISO date string or a Unix timestamp in milliseconds. */
const dateInput = z
  .union([z.string(), z.number()], { required_error: 'Date is required' })
  .pipe(z.coerce.date({ invalid_type_error: 'Invalid date' }));

export const createSessionSchema = z
  .object({
    teacherId: objectIdSchema,
    startTime: dateInput,
    endTime: dateInput,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

export const availableSessionsQuerySchema = z.object({
  dateTimestamp: z
    .string({ required_error: 'dateTimestamp query param is required' })
    .regex(/^\d+$/, 'dateTimestamp must be a Unix timestamp')
    .transform(Number),
});

export const bookSessionSchema = z.object({
  userId: objectIdSchema,
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
