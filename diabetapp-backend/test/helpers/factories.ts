import { MomentOfDay } from '@prisma/client';
import prisma from '../../src/config/db';
import { api } from './api';

export const VALID_PASSWORD = 'Abcdef12';

interface RegisterOverrides {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
}

let counter = 0;
const uniqueEmail = () => `usuario${++counter}-${Date.now()}@test.com`;

/** Registra un usuario por la API y devuelve sus tokens. */
export const registerUser = async (overrides: RegisterOverrides = {}) => {
  const payload = {
    firstName: 'Ana',
    lastName: 'Pérez',
    email: uniqueEmail(),
    password: VALID_PASSWORD,
    ...overrides,
  };

  const response = await api().post('/api/auth/register').send(payload);

  return {
    email: payload.email,
    password: payload.password,
    user: response.body.data.user as { id: string; email: string },
    accessToken: response.body.data.accessToken as string,
    refreshToken: response.body.data.refreshToken as string,
  };
};

/** Crea una lectura de glucosa directamente en la base de datos. */
export const createReading = (
  userId: string,
  data: { value?: number; timestamp?: Date; momentOfDay?: MomentOfDay; notes?: string } = {},
) =>
  prisma.glucoseReading.create({
    data: {
      userId,
      value: data.value ?? 110,
      timestamp: data.timestamp ?? new Date('2026-09-10T10:00:00.000Z'),
      momentOfDay: data.momentOfDay ?? 'BEFORE_BREAKFAST',
      notes: data.notes,
    },
    select: { id: true, value: true, timestamp: true },
  });

export const authHeader = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });
