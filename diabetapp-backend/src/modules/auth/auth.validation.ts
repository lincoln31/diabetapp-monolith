import { z } from 'zod';

export const registerSchema = z.object({
    email: z
      .string()
      .email('Email debe tener formato válido')
      .min(1, 'Email es obligatorio'),
    
    password: z
      .string()
      .min(8, 'Contraseña debe tener mínimo 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
        'Contraseña debe tener al menos: 1 minúscula, 1 mayúscula, 1 número'),
    
    firstName: z
      .string()
      .min(2, 'Nombre debe tener mínimo 2 caracteres')
      .optional(),
    
    lastName: z
      .string()
      .min(2, 'Apellido debe tener mínimo 2 caracteres')
      .optional(),
    
    typeOfDiabetes: z
      .enum(['TYPE_1', 'TYPE_2', 'GESTACIONAL', 'PREDIABETES'])
      .optional(),
    
    birthDate: z
      .string()
      .datetime('Fecha debe ser formato ISO válido')
      .optional()
  });