import { ZodSchema } from 'zod';
import { ApiError, FieldError } from '../errors/ApiError';

export function parseWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors: FieldError[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(body)',
      message: issue.message,
    }));
    throw ApiError.badRequest('Datos invalidos', errors);
  }
  return result.data;
}
