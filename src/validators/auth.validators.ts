import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string({ invalid_type_error: 'El nombre debe ser un texto' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre no puede superar 120 caracteres'),
  email: z
    .string({ invalid_type_error: 'El correo debe ser un texto' })
    .trim()
    .toLowerCase()
    .email('El correo no es valido'),
  password: z
    .string({ invalid_type_error: 'La contrasena debe ser un texto' })
    .min(6, 'La contrasena debe tener al menos 6 caracteres')
    .max(72, 'La contrasena no puede superar 72 caracteres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string({ invalid_type_error: 'El correo debe ser un texto' }).trim().toLowerCase().email('El correo no es valido'),
  password: z.string({ invalid_type_error: 'La contrasena debe ser un texto' }).min(1, 'La contrasena es obligatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;
