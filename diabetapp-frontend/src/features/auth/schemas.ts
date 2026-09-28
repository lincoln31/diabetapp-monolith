import { z } from 'zod';

/**
 * Reglas de los formularios de sesión (spec fase 3, RF-3.11; simplificado en la fase 15, RF-15.11).
 * Son las mismas que valida el backend en `auth.schemas.ts`; si cambia una, cambia en ambos.
 *
 * El registro pide solo lo imprescindible: nombre, correo, contraseña y una declaración de
 * edad y aceptación. Teléfono, fecha de nacimiento y datos médicos se completan en el perfil.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener mínimo 2 caracteres'),
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener mínimo 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  // Sustituye a la comprobación de edad por fecha de nacimiento: es una declaración explícita
  acceptTerms: z.literal(true, 'Debes confirmar tu edad y aceptar los términos'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
