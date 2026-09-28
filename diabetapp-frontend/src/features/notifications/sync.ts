import { achievementsApi } from '@/src/features/achievements';
import { medicationsApi } from '@/src/features/medications';
import { profileApi } from '@/src/features/profile';
import { findNewAchievements } from './newAchievements';
import { getPermission, notifyNow, syncSchedule } from './notifier';
import { buildSchedule } from './schedule';
import { getSeenAchievements, saveSeenAchievements } from './seenAchievements';

/**
 * Reprograma los recordatorios desde el estado actual (spec fase 13, D-13.5, RF-13.10):
 * perfil + medicamentos → `buildSchedule` → `syncSchedule`, y avisa de logros nuevos.
 *
 * Si alguna petición falla NO se toca lo ya programado: los recordatorios existentes siguen
 * vigentes con el backend caído (RF-13.11). Nunca lanza.
 */
export const syncNotifications = async (): Promise<void> => {
  try {
    const [profile, medications] = await Promise.all([profileApi.get(), medicationsApi.list()]);
    const { notificationPreferences: preferences } = profile;

    // Todo apagado: se cancela lo programado y no se pide nada más (RF-13.12)
    if (!Object.values(preferences).some(Boolean)) {
      await syncSchedule([]);
      return;
    }

    // Sin permiso no hay nada que programar; se conserva lo que hubiera
    if ((await getPermission()) !== 'granted') return;

    await syncSchedule(
      buildSchedule({
        preferences,
        medications,
        glucoseReminderTimes: profile.glucoseReminderTimes,
        today: new Date(),
      }),
    );

    if (preferences.achievements) {
      const { achievements } = await achievementsApi.list();
      const unlocked = achievements.filter((item) => item.unlocked);
      const seen = await getSeenAchievements();

      for (const code of findNewAchievements(
        unlocked.map((item) => item.code),
        seen,
      )) {
        const achievement = unlocked.find((item) => item.code === code);
        if (achievement) await notifyNow('¡Nuevo logro!', achievement.name);
      }

      // Primera vez: se registran sin avisar; después, se suman los nuevos (RF-13.9)
      await saveSeenAchievements([...(seen ?? []), ...unlocked.map((item) => item.code)]);
    }
  } catch {
    // Sin conexión o sin sesión: se deja todo como estaba
  }
};
