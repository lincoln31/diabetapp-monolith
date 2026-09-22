import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Tokens de sesión en el almacenamiento seguro del sistema
 * (Keychain en iOS, Keystore en Android) — spec fase 2, RF-2.15.
 *
 * Se mantiene una copia en memoria para no leer SecureStore en cada petición.
 */

const ACCESS_KEY = 'diabetapp.accessToken';
const REFRESH_KEY = 'diabetapp.refreshToken';
const LEGACY_ASYNC_KEY = 'userToken'; // Clave anterior a la fase 2

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

let cached: SessionTokens | null = null;

export const getTokens = async (): Promise<SessionTokens | null> => {
  if (cached) return cached;

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);

  cached = accessToken && refreshToken ? { accessToken, refreshToken } : null;
  return cached;
};

/** Token de acceso en memoria, sin esperar al almacenamiento. */
export const getCachedAccessToken = (): string | null => cached?.accessToken ?? null;

export const setTokens = async (tokens: SessionTokens): Promise<void> => {
  cached = tokens;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
};

export const clearTokens = async (): Promise<void> => {
  cached = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
};

/** Borra el token que la app guardaba antes en AsyncStorage (sin cifrar). */
export const removeLegacyToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
  } catch {
    // Si falla, no es crítico: ese token caducaba en 1 hora
  }
};
