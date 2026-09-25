import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

/** El token de acceso solo lleva el id del usuario en `sub` (spec fase 2, D-2.2). */
interface JWTPayload {
  sub: string;
}

/**
 * Exige un token de acceso válido y deja `req.user` disponible
 * (spec fase 1, RF-1.3: solo UNAUTHENTICATED o TOKEN_EXPIRED).
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHENTICATED'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError;
    next(new AppError(isExpired ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED'));
  }
};
