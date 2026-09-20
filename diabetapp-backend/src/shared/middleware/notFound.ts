import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

/** Ruta inexistente: 404 sin revelar las rutas disponibles (spec fase 1, RF-1.5). */
export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('NOT_FOUND', 'La ruta solicitada no existe'));
};
