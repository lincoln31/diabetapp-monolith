import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

/**
 * Límites de peticiones (spec fase 2, RF-2.12). El almacén es en memoria:
 * suficiente con una sola instancia del backend. Con varias instancias habría
 * que pasar a rate-limit-redis.
 */
const baseOptions = {
  standardHeaders: 'draft-7' as const, // Añade RateLimit y Retry-After
  legacyHeaders: false,
  handler: () => {
    throw new AppError('RATE_LIMITED');
  },
};

/** Login: por IP + correo, contando solo los intentos fallidos. */
export const loginRateLimit = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_LOGIN_MAX,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const body = req.body as { email?: unknown } | undefined;
    const email = typeof body?.email === 'string' ? body.email.toLowerCase() : '';
    return `${ipKeyGenerator(req.ip ?? '')}:${email}`;
  },
});

/** Registro: por IP, una hora. */
export const registerRateLimit = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_REGISTER_MAX,
});

/** Renovación de sesión: por IP. */
export const refreshRateLimit = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_REFRESH_MAX,
});
