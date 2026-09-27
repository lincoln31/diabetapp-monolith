import type { NotificationPreferences } from '@/src/features/profile';

/** Tipos de la funcionalidad de notificaciones (spec fase 13, D-13.2, D-13.3). */
export type { NotificationPreferences };

export type NotificationKey = keyof NotificationPreferences;

/** Una notificación diaria a programar; `id` estable para cancelar y reprogramar sin duplicados. */
export interface ScheduledItem {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

export interface ScheduleMedication {
  id: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
}
