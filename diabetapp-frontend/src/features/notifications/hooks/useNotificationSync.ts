import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { syncNotifications } from '../sync';

/**
 * Reprograma los recordatorios cada vez que la pantalla recupera el foco y cada vez que la
 * app vuelve del segundo plano (spec fase 13, D-13.5): así archivar o editar un medicamento
 * se refleja al volver al dashboard, y un logro nuevo se avisa al reabrir la app.
 */
export const useNotificationSync = (): void => {
  useFocusEffect(
    useCallback(() => {
      void syncNotifications();
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNotifications();
    });

    return () => subscription.remove();
  }, []);
};
