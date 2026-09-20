/**
 * El límite real de login (5 intentos) está en `.env.test`: cuenta solo intentos
 * fallidos por IP + correo, y cada test usa un correo distinto, así que no
 * interfiere con el resto de la suite.
 */
import { env } from '../src/config/env';
import { api } from './helpers/api';
import { registerUser, VALID_PASSWORD } from './helpers/factories';

const LIMIT = env.RATE_LIMIT_LOGIN_MAX;

describe('Límite de intentos de login', () => {
  it(`bloquea con 429 tras ${LIMIT} intentos fallidos, incluso con la contraseña correcta`, async () => {
    const { email } = await registerUser();

    for (let intento = 1; intento <= LIMIT; intento++) {
      const fallido = await api().post('/api/auth/login').send({ email, password: 'MalaPass99' });
      expect(fallido.status).toBe(401);
    }

    const bloqueado = await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD });

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error.code).toBe('RATE_LIMITED');
    expect(bloqueado.headers['retry-after']).toBeDefined();
  });
});
