import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema } from './auth.validation';


const authService = new AuthService();

export const registerController = async (req: Request, res: Response) => {
  try {
    // 1. Validación con Zod
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const userData = validationResult.data;

    // 2. Crear usuario
    const newUser = await authService.createUser(userData);

    // 3. Respuesta exitosa
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser,
        requiresOnboarding: true // Indicar que necesita completar perfil
      }
    });

  } catch (error: any) {
    // 4. Manejo específico de errores
    switch (error.message) {
      case 'USER_ALREADY_EXISTS':
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado',
          code: 'EMAIL_IN_USE'
        });
      
      case 'DATABASE_ERROR':
        return res.status(500).json({
          success: false,
          message: 'Error en la base de datos. Intenta nuevamente.',
          code: 'DB_ERROR'
        });
      
      default:
        console.error('Unexpected error in registerController:', error);
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          code: 'INTERNAL_ERROR'
        });
    }
  }
};

// Endpoint adicional para verificar disponibilidad de email
export const checkEmailController = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    const isAvailable = await authService.checkEmailAvailability(email);
    
    return res.status(200).json({
      success: true,
      data: {
        email,
        available: isAvailable
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verificando disponibilidad'
    });
  }
};
