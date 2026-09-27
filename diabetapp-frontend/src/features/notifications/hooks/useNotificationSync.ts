import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { syncNotifications } from '../sync';

/**
 * Reprograma los recordatorios cada vez que la pantalla recupera el foco (spec fase 13,
 * D-13.5): así archivar o editar un medicamento se refleja al volver al dashboard.
 */
export const useNotificationSync = (): void => {
  useFocusEffect(
    useCallback(() => {
      void syncNotifications();
    }, []),
  );
};
