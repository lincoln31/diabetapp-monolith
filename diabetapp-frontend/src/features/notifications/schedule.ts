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
