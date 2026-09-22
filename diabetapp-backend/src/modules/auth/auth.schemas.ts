import { DiabetesType } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email debe tener formato válido').min(1, 'Email es obligatorio'),

  password: z
    .string()
    .min(8, 'Contraseña debe tener mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Contraseña debe tener al menos: 1 minúscula, 1 mayúscula, 1 número',
    ),

  firstName: z.string().min(2, 'Nombre debe tener mínimo 2 caracteres').optional(),

  lastName: z.string().min(2, 'Apellido debe tener mínimo 2 caracteres').optional(),

  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{10,20}$/, 'Teléfono debe tener un formato válido')
    .optional(),

  // El enum vive en la base de datos: una sola lista de valores (spec fase 1, RF-1.18)
  typeOfDiabetes: z.enum(DiabetesType).optional(),

  birthDate: z.iso
    .datetime('Fecha debe ser formato ISO válido')
    .transform((value) => new Date(value))
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email debe tener formato válido').min(1, 'Email es obligatorio'),
  password: z.string().min(1, 'Contraseña es obligatoria'),
});

export const checkEmailSchema = z.object({
  email: z.string().email('Email debe tener formato válido'),
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
export type CheckEmailQuery = z.infer<typeof checkEmailSchema>;
