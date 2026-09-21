import { z } from 'zod';
import { CreditRequestStatus } from '../entities/CreditRequest';

export const AMOUNT_MIN = 500;
export const AMOUNT_MAX = 50000;
export const TERM_MONTHS_MIN = 6;
export const TERM_MONTHS_MAX = 60;

export const createCreditRequestSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'El monto debe ser un numero' })
    .min(AMOUNT_MIN, `El monto minimo es ${AMOUNT_MIN}`)
    .max(AMOUNT_MAX, `El monto maximo es ${AMOUNT_MAX}`),
  termMonths: z
    .number({ invalid_type_error: 'El plazo debe ser un numero' })
    .int('El plazo debe ser un numero entero de meses')
    .min(TERM_MONTHS_MIN, `El plazo minimo es ${TERM_MONTHS_MIN} meses`)
    .max(TERM_MONTHS_MAX, `El plazo maximo es ${TERM_MONTHS_MAX} meses`),
  applicantId: z
    .string({ invalid_type_error: 'La cedula debe ser un texto' })
    .trim()
    .min(5, 'La cedula debe tener al menos 5 caracteres')
    .max(30, 'La cedula no puede superar 30 caracteres'),
});

export type CreateCreditRequestInput = z.infer<typeof createCreditRequestSchema>;

const DECIDABLE_STATUSES = [CreditRequestStatus.APPROVED, CreditRequestStatus.REJECTED] as const;

export const updateStatusSchema = z.object({
  status: z.enum(DECIDABLE_STATUSES, {
    errorMap: () => ({ message: `El estado debe ser "${CreditRequestStatus.APPROVED}" o "${CreditRequestStatus.REJECTED}"` }),
  }),
  comment: z
    .string({ invalid_type_error: 'El comentario debe ser un texto' })
    .trim()
    .min(1, 'El comentario es obligatorio al cambiar el estado')
    .max(500, 'El comentario no puede superar 500 caracteres'),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const listQuerySchema = z.object({
  status: z.nativeEnum(CreditRequestStatus).optional(),
});
