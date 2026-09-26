/** Tipos del contrato de logros (spec fase 9, D-9.4). */

export type AchievementMetric = 'streak' | 'readingsCount';

export interface Achievement {
  code: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
  currentValue: number;
  unlocked: boolean;
}

export interface AchievementsResponse {
  achievements: Achievement[];
}
