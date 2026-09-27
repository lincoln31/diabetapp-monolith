/**
 * Preferencias de notificaciones del perfil (spec fase 13, D-13.1). Se guardan en las
 * columnas JSON `notificationPreferences` y `reminderTimes`; al leerlas se normalizan para
 * que un valor viejo o malformado nunca llegue tal cual a la app.
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const NOTIFICATION_KEYS = [
  'medicationReminders',
  'glucoseReminders',
  'motivational',
  'achievements',
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];
export type NotificationPreferences = Record<NotificationKey, boolean>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Las cuatro claves siempre presentes; solo `true` cuenta como activo (apagado por defecto). */
export const readPreferences = (raw: unknown): NotificationPreferences => {
  const source = isRecord(raw) ? raw : {};

  return {
    medicationReminders: source.medicationReminders === true,
    glucoseReminders: source.glucoseReminders === true,
    motivational: source.motivational === true,
    achievements: source.achievements === true,
  };
};

/** Solo horarios `HH:mm` válidos, sin repetir y ordenados. */
export const readTimes = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];

  const valid = raw.filter(
    (item): item is string => typeof item === 'string' && TIME_REGEX.test(item),
  );

  return [...new Set(valid)].sort();
};

/** Guardado parcial: lo enviado pisa lo guardado y el resto se conserva (RF-13.3). */
export const mergePreferences = (
  stored: unknown,
  changes: Partial<NotificationPreferences>,
): NotificationPreferences => ({ ...readPreferences(stored), ...changes });
