import { get, post } from '@/src/shared/api/client';
import { AuthResult, RegisterPayload, User } from './types';

/** Todas las llamadas de autenticación (spec fase 3, RF-3.6). */
export const authApi = {
  login: (email: string, password: string) =>
    post<AuthResult>('/auth/login', { email, password }),

  register: (payload: RegisterPayload) => post<AuthResult>('/auth/register', payload),

  logout: (refreshToken: string) => post<null>('/auth/logout', { refreshToken }),

  me: () => get<{ user: User }>('/auth/me'),
};
