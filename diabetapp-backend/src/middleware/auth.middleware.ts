import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';

interface JWTPayload {
  userId: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Obtener el Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'ACCESS_TOKEN_REQUIRED',
        message: 'Token de acceso requerido' 
      });
      return;
    }

    // 2. Verificar que empiece con "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Formato de token inválido. Debe ser: Bearer <token>' 
      });
      return;
    }

    // 3. Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer " (7 caracteres)

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado en las variables de entorno');
      res.status(500).json({ 
        error: 'SERVER_CONFIGURATION_ERROR',
        message: 'Error de configuración del servidor' 
      });
      return;
    }

    // 4. Usar jwt.verify() para validar el token
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // 5. Añadir el userId al objeto req
    req.user = { id: payload.userId };
    (req as AuthenticatedRequest).user = { 
      id: payload.userId,
      email: payload.email 
    };

    // 6. Llamar a next() para pasar al siguiente middleware/controlador
    next();

  } catch (error: any) {
    // 7. Manejar errores de JWT
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'Token inválido' 
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'TOKEN_EXPIRED',
        message: 'Token expirado' 
      });
      return;
    }

    // Otros errores inesperados
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ 
      error: 'AUTHENTICATION_ERROR',
      message: 'Error interno de autenticación' 
    });
  }
};
