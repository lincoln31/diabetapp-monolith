import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'diabetapp.cache.';

/**
 * Caché local de datos del servidor (spec fase 18, D-18.1): sobrevive a cerrar la app, a
 * diferencia del estado en memoria. Solo es una optimización — si falla (almacenamiento
 * lleno, etc.) la app sigue funcionando, simplemente sin datos guardados de antes.
 */
export const readCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
};

export const writeCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignorar: la caché es una optimización, no una fuente de verdad.
  }
};
