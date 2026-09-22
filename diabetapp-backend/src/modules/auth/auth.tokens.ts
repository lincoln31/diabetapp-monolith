import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * Tokens de sesión (spec fase 2, RF-2.1, RF-2.2).
 *
 * - Acceso: JWT corto, con el id del usuario en `sub` y **sin datos personales**
 *   (un JWT se lee sin la clave).
 * - Renovación: valor aleatorio opaco. El servidor solo guarda su hash SHA-256;
 *   como el token ya tiene 256 bits de entropía, no necesita un hash lento.
 */

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    // El tipo de jsonwebtoken es un literal ('15m', '2h'…); la duración llega por configuración
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  });

export const generateRefreshToken = (): string => crypto.randomBytes(32).toString('base64url');

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const refreshTokenExpiry = (): Date =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
