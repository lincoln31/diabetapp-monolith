import { NextFunction, Request, Response } from 'express';

/**
 * Registra una línea por petición, solo en desarrollo y sin datos del usuario
 * (spec fase 1, RF-1.21): nunca body, query ni cabeceras.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    // originalUrl es la ruta completa (req.path solo trae la parte relativa al router);
    // se descarta el query string porque puede llevar datos del usuario
    const path = req.originalUrl.split('?')[0];
    console.log(`${req.method} ${path} → ${res.statusCode} (${Date.now() - startedAt}ms)`);
  });

  next();
};
