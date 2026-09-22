/**
 * Configuración que viene del entorno (spec fase 3, RF-3.14).
 *
 * Expo inyecta las variables `EXPO_PUBLIC_*` al arrancar `expo start`;
 * después de editar `.env` hay que reiniciarlo.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'Falta EXPO_PUBLIC_API_URL. Copia .env.example a .env y pon la dirección de tu backend, ' +
      'por ejemplo EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api (usa la IP de tu PC, no localhost, ' +
      'para probar en el celular). Reinicia `npm start` después de cambiarlo.',
  );
}

export const env = {
  API_URL,
  API_TIMEOUT_MS: 10000,
} as const;
