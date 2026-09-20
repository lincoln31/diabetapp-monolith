import { z } from 'zod';
import { ageFromDateOfBirth, isFutureDate, isRealDate } from '@/src/shared/utils/dates';

const MIN_AGE = 13;

/**
 * Reglas de los formularios de sesión (spec fase 3, RF-3.11).
 * Son las mismas que valida el backend en `auth.schemas.ts`; si cambia una, cambia en ambos.
 */

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'El nombre debe tener mínimo 2 caracteres'),
    lastName: z.string().trim().min(2, 'El apellido debe tener mínimo 2 caracteres'),
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Correo electrónico inválido'),
    phone: z
      .string()
      .transform((value) => value.replace(/\s/g, ''))
      .refine((value) => value === '' || /^[0-9+\-()]{10,20}$/.test(value), {
        message: 'Teléfono inválido (10 a 20 caracteres)',
      }),
    dateOfBirth: z
      .string()
      .refine(isRealDate, 'Usa el formato DD/MM/AAAA con una fecha válida')
      .refine((value) => !isFutureDate(value), 'La fecha de nacimiento no puede ser futura')
      .refine(
        (value) => ageFromDateOfBirth(value) >= MIN_AGE,
        `Debes tener al menos ${MIN_AGE} años para registrarte`,
      ),
    password: z
      .string()
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
      .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
      .regex(/\d/, 'La contraseña debe tener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    acceptTerms: z.literal(true, 'Debes aceptar los términos y condiciones'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
