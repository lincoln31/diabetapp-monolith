import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { LoginUserInput, RegisterUserInput } from './auth.schemas';

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

// Genera el JWT de sesión (usado en login y en registro)
const signToken = (userId: string, email: string): string =>
  jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '1h' });

export class AuthService {
  async createUser(userData: RegisterUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }, // Normalizar email
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError('EMAIL_IN_USE');
    }

    // 12 rondas de bcrypt por tratarse de datos médicos
    const hashedPassword = await bcrypt.hash(userData.password, 12);

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

    // El registro deja la sesión iniciada
    return { user, token: signToken(user.id, user.email) };
  }

  async checkEmailAvailability(email: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return !existingUser; // true si está disponible
  }

  async loginUser(credentials: LoginUserInput) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
      select: { ...publicUserFields, password: true, isActive: true },
    });

    // Un usuario inexistente, una contraseña incorrecta y una cuenta desactivada
    // devuelven siempre la misma respuesta, para no revelar qué correos existen
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid || !user.isActive) {
      throw new AppError('INVALID_CREDENTIALS');
    }

    const { password: _password, isActive: _isActive, ...publicUser } = user;

    return { user: publicUser, token: signToken(user.id, user.email) };
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
