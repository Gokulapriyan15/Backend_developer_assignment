import { z } from 'zod';

export const objectIdSchema = z
  .string({ required_error: 'Id is required' })
  .regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const idParamSchema = z.object({ id: objectIdSchema });
