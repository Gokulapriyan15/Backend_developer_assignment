import { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

interface FieldError {
  field: string;
  message: string;
}

interface NormalizedError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

const isDuplicateKeyError = (
  err: unknown,
): err is { code: 11000; keyValue?: Record<string, unknown> } =>
  typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;

const isMalformedJsonError = (err: unknown): boolean =>
  err instanceof SyntaxError && 'body' in err;

const normalizeError = (err: unknown): NormalizedError => {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for ${err.path}` };
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return { statusCode: 409, message: `${field} already exists` };
  }

  if (isMalformedJsonError(err)) {
    return { statusCode: 400, message: 'Malformed JSON body' };
  }

  return { statusCode: 500, message: 'Internal server error' };
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { statusCode, message, errors } = normalizeError(err);

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};
