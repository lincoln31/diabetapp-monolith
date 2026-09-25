import prisma from '../../config/db';
import { GlucoseService } from '../glucose/glucose.service';
import { ACHIEVEMENTS, AchievementMetric } from './achievements.catalog';
import { AchievementsResponse } from './achievements.schemas';

const glucoseService = new GlucoseService();

export class AchievementsService {
  /**
   * Aplica el catálogo fijo a los datos reales del usuario (spec fase 9, D-9.3).
   * No guarda nada: se recalcula en cada petición a partir de dos métricas que
   * nunca bajan (mejor racha histórica, total de lecturas).
   */
  async get(userId: string): Promise<AchievementsResponse> {
    const [readingsCount, streak] = await Promise.all([
      prisma.glucoseReading.count({ where: { userId } }),
      glucoseService.getLongestStreak(userId),
    ]);

    const values: Record<AchievementMetric, number> = { streak, readingsCount };

    return {
      achievements: ACHIEVEMENTS.map((achievement) => ({
        ...achievement,
        currentValue: values[achievement.metric],
        unlocked: values[achievement.metric] >= achievement.threshold,
      })),
    };
  }
}
