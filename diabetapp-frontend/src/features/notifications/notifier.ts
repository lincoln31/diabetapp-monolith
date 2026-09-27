import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CHANNEL_ID } from './constants';
import { ScheduledItem } from './types';

/**
 * Única capa que toca `expo-notifications` (spec fase 13, D-13.4). Todo va en `try/catch`:
 * un fallo del sistema de notificaciones nunca debe tumbar la app (RF-13.11).
 */
export type PermissionResult = 'granted' | 'denied';

let configured = false;

/** Manejador en primer plano y canal de Android (necesario antes de programar o pedir permiso). */
const configure = async (): Promise<void> => {
  if (configured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  configured = true;
};

/** Estado del permiso sin pedirlo. */
export const getPermission = async (): Promise<PermissionResult> => {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
};

/** Pide el permiso del sistema solo si hace falta (RF-13.5). */
export const ensurePermission = async (): Promise<PermissionResult> => {
  try {
    await configure();

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
};

/**
 * Cancela todo lo programado por la app y reprograma la lista recibida: idempotente,
 * sin duplicados ni huérfanos (RNF-13.2). Una lista vacía deja cero programadas (RF-13.12).
 */
export const syncSchedule = async (items: ScheduledItem[]): Promise<void> => {
  try {
    await configure();
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const item of items) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: { title: item.title, body: item.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: item.hour,
          minute: item.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch (error) {
    console.warn('No se pudieron programar los recordatorios', error);
  }
};

/** Notificación inmediata (aviso de logro nuevo). */
export const notifyNow = async (title: string, body: string): Promise<void> => {
  try {
    await configure();
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (error) {
    console.warn('No se pudo mostrar la notificación', error);
  }
};
