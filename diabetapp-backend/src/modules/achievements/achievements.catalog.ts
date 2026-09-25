export type AchievementMetric = 'streak' | 'readingsCount';

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
}

/**
 * Catálogo fijo de logros (spec fase 9, D-9.1, D-9.2): sin tabla en la base de
 * datos. Ninguna de las dos métricas baja con el tiempo (mejor racha histórica,
 * total de lecturas), así que un logro nunca se «pierde» aunque no se guarde
 * cuándo se desbloqueó (RF-9.3).
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    code: 'STREAK_3',
    name: 'Constancia inicial',
    description: 'Registra glucosa 3 días seguidos',
    metric: 'streak',
    threshold: 3,
  },
  {
    code: 'STREAK_7',
    name: 'Una semana completa',
    description: 'Registra glucosa 7 días seguidos',
    metric: 'streak',
    threshold: 7,
  },
  {
    code: 'STREAK_30',
    name: 'Hábito consolidado',
    description: 'Registra glucosa 30 días seguidos',
    metric: 'streak',
    threshold: 30,
  },
  {
    code: 'READINGS_10',
    name: 'Primeros pasos',
    description: 'Registra 10 lecturas en total',
    metric: 'readingsCount',
    threshold: 10,
  },
  {
    code: 'READINGS_50',
    name: 'En marcha',
    description: 'Registra 50 lecturas en total',
    metric: 'readingsCount',
    threshold: 50,
  },
  {
    code: 'READINGS_100',
    name: 'Constancia probada',
    description: 'Registra 100 lecturas en total',
    metric: 'readingsCount',
    threshold: 100,
  },
];
