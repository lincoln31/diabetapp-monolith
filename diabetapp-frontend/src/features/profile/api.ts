import { get, put } from '@/src/shared/api/client';
import { Profile, UpdateProfileInput } from './types';

/** Todas las llamadas de perfil (spec fase 7, RF-7.1, RF-7.2). */
export const profileApi = {
  get: () => get<Profile>('/profile'),

  update: (input: UpdateProfileInput) => put<Profile>('/profile', input),
};
