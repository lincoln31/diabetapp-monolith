import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { LoginUserInput, RegisterUserInput } from './auth.schemas';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from './auth.tokens';

/** Campos del usuario que la API devuelve (nunca la contraseña). */
const publicUserFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  typeOfDiabetes: true,
  onboardingCompleted: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Hash de descarte para que el login tarde lo mismo exista o no el correo
 * (spec fase 2, RF-2.10). Se calcula una vez al arrancar.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), env.BCRYPT_ROUNDS);

export class AuthService {
  /** Crea el par de tokens de una sesión. Sin `familyId` inicia una cadena nueva. */
  private async issueSession(userId: string, familyId?: string) {
    const refreshToken = generateRefreshToken();

    const stored = await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        familyId: familyId ?? crypto.randomUUID(),
        expiresAt: refreshTokenExpiry(),
      },
      select: { id: true },
    });

    return { accessToken: signAccessToken(userId), refreshToken, refreshTokenId: stored.id };
  }

  async createUser(userData: RegisterUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }, // Normalizar email
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError('EMAIL_IN_USE');
    }

    const hashedPassword = await bcrypt.hash(userData.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        typeOfDiabetes: userData.typeOfDiabetes,
        birthDate: userData.birthDate,
        onboardingCompleted: false, // Usuario nuevo necesita onboarding
        isActive: true,
        dataConsentAt: new Date(), // El registro implica consentimiento inicial
      },
      select: publicUserFields,
    });

    const { accessToken, refreshToken } = await this.issueSession(user.id);

    // El registro deja la sesión iniciada
    return { user, accessToken, refreshToken };
  }

  async loginUser(credentials: LoginUserInput) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
      select: { ...publicUserFields, password: true, isActive: true },
    });

    // Siempre se compara un hash, exista o no el usuario, para no revelar
    // por el tiempo de respuesta qué correos están registrados
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    // Usuario inexistente, contraseña incorrecta y cuenta desactivada: misma respuesta
    if (!user || !isPasswordValid || !user.isActive) {
      throw new AppError('INVALID_CREDENTIALS');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      // Aprovechamos para limpiar los tokens de renovación ya caducados
      prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      }),
    ]);

    const { password: _password, isActive: _isActive, ...publicUser } = user;
    const { accessToken, refreshToken } = await this.issueSession(user.id);

    return { user: publicUser, accessToken, refreshToken };
  }

  /**
   * Rota el token de renovación (spec fase 2, RF-2.3 a RF-2.5).
   *
   * Si llega un token ya usado o revocado, se asume robo: se revoca toda la cadena
   * de sesión (detección de reutilización).
   */
  async refreshSession(token: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!stored) {
      throw new AppError('UNAUTHENTICATED');
    }

    const revokeFamily = () =>
      prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

    if (stored.revokedAt) {
      await revokeFamily(); // Reutilización: se cierra toda la sesión
      throw new AppError('UNAUTHENTICATED');
    }

    if (stored.expiresAt < new Date()) {
      throw new AppError('UNAUTHENTICATED');
    }

    if (!stored.user.isActive) {
      await revokeFamily();
      throw new AppError('UNAUTHENTICATED');
    }

    const session = await this.issueSession(stored.userId, stored.familyId);

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: session.refreshTokenId },
    });

    return { accessToken: session.accessToken, refreshToken: session.refreshToken };
  }

  /** Revoca el token de renovación indicado. Idempotente (spec fase 2, RF-2.6). */
  async logout(token: string) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Devuelve el usuario del token, si sigue existiendo y activo. */
  async getActiveUser(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: publicUserFields,
    });

    if (!user) {
      throw new AppError('UNAUTHENTICATED');
    }

    return user;
  }
}
