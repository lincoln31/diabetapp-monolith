import { getTipOfTheDay } from '@/src/features/education';
import { MOTIVATIONAL_MESSAGES, MOTIVATIONAL_TIME } from './constants';
import { NotificationPreferences, ScheduledItem, ScheduleMedication } from './types';

const parseTime = (time: string): { hour: number; minute: number } => {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
};

export interface ScheduleInput {
  preferences: NotificationPreferences;
  medications: ScheduleMedication[];
  glucoseReminderTimes: string[];
  today: Date;
}

/**
 * Lista de notificaciones diarias a programar (spec fase 13, D-13.3). Pura: no toca
 * `expo-notifications`; con todo apagado devuelve una lista vacía (RF-13.12).
 */
export const buildSchedule = ({
  preferences,
  medications,
  glucoseReminderTimes,
  today,
}: ScheduleInput): ScheduledItem[] => {
  const items: ScheduledItem[] = [];

  if (preferences.medicationReminders) {
    for (const medication of medications) {
      for (const time of medication.scheduledTimes) {
        items.push({
          id: `med:${medication.id}:${time}`,
          title: 'Hora de tu medicación',
          body: `${medication.name} (${medication.dosage})`,
          ...parseTime(time),
        });
      }
    }
  }

  if (preferences.glucoseReminders) {
    for (const time of glucoseReminderTimes) {
      items.push({
        id: `glucose:${time}`,
        title: 'Hora de medir tu glucosa',
        body: 'Registra tu lectura en DiabetApp.',
        ...parseTime(time),
      });
    }
  }

  if (preferences.motivational) {
    items.push({
      id: 'motivation',
      title: 'DiabetApp',
      body: getTipOfTheDay(MOTIVATIONAL_MESSAGES, today),
      ...MOTIVATIONAL_TIME,
    });
  }

  return items;
};

/** Lo que se necesita saber de una notificación ya programada para compararla. */
export interface ExistingSchedule {
  title?: string | null;
  body?: string | null;
  hour?: number;
  minute?: number;
}

/**
 * ¿La notificación ya programada es idéntica a la deseada? (spec fase 13, D-13.4). Permite no
 * tocar lo que no cambió: cancelar y reprogramar una alarma diaria que aún está dentro de su
 * ventana de entrega (las alarmas son inexactas) la mueve a mañana y se pierde el aviso.
 */
export const isSameSchedule = (existing: ExistingSchedule, item: ScheduledItem): boolean =>
  existing.title === item.title &&
  existing.body === item.body &&
  existing.hour === item.hour &&
  existing.minute === item.minute;
