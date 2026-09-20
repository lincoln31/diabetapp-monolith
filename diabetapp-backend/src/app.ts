import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { registerModules } from './modules';
import { errorHandler } from './shared/middleware/errorHandler';
import { notFound } from './shared/middleware/notFound';
import { requestLogger } from './shared/middleware/requestLogger';

/**
 * Crea la aplicación Express sin abrir ningún puerto (spec fase 1, RF-1.12),
 * para poder probarla con supertest.
 */
export const createApp = (): Application => {
  const app = express();

  if (env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());

  app.use('/api', registerModules());

  // El orden importa: primero la ruta inexistente, después el manejador de errores
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
