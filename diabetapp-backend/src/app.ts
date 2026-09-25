import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

  // Detrás de un proxy (Render, Railway, Nginx) hace falta para que los límites
  // por IP usen la del cliente y no la del proxy (spec fase 2, RNF-2.5)
  app.set('trust proxy', env.TRUST_PROXY);

  // Cabeceras de seguridad; también quita X-Powered-By (spec fase 2, RF-2.13)
  app.use(helmet());

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

  // Límite de tamaño del body (spec fase 2, RF-2.14)
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', registerModules());

  // El orden importa: primero la ruta inexistente, después el manejador de errores
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
