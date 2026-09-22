import { NextFunction, Request, Response } from 'express';

/**
 * Registra una línea por petición, solo en desarrollo y sin datos del usuario
 * (spec fase 1, RF-1.21): nunca body, query ni cabeceras.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${Date.now() - startedAt}ms)`);
  });

  next();
};
