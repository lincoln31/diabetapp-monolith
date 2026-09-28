import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mismas reglas que `glucoseReminderTimes` del backend (spec fase 13, RF-13.1); puede estar vacía. */
export const glucoseTimesSchema = z
  .array(z.string().trim())
  .max(6, 'No puedes indicar más de 6 horarios')
  .refine(
    (times) => times.every((time) => TIME_REGEX.test(time)),
    'Cada horario debe tener formato HH:mm (24 horas), p. ej. 07:30',
  )
  .refine((times) => new Set(times).size === times.length, 'Los horarios no pueden repetirse');
