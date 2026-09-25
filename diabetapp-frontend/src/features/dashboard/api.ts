import { get } from '@/src/shared/api/client';
import { GlucoseStats } from './types';

/** Llamada de estadísticas del dashboard (spec fase 5, RF-5.1). */
export const dashboardApi = {
  getStats: () => get<GlucoseStats>('/glucose/stats'),
};
