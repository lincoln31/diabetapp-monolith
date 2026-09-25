import { AchievementMetric } from './achievements.catalog';

// Sin entrada que validar: el endpoint no tiene parámetros (spec fase 9, D-9.4).
export interface AchievementProgress {
  code: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
  currentValue: number;
  unlocked: boolean;
}

export interface AchievementsResponse {
  achievements: AchievementProgress[];
}
