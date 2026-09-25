import { get } from '@/src/shared/api/client';
import { AchievementsResponse } from './types';

/** Llamada de logros (spec fase 9, RF-9.1). */
export const achievementsApi = {
  list: () => get<AchievementsResponse>('/achievements'),
};
