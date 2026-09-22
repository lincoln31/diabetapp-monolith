import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import glucoseRoutes from './glucose/glucose.routes';
import healthRoutes from './health/health.routes';

/**
 * Único punto de registro de módulos (spec fase 1, RF-1.11).
 * Añadir un módulo nuevo = una línea aquí.
 */
export const registerModules = (): Router => {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/auth', authRoutes);
  router.use('/glucose', glucoseRoutes);

  return router;
};
