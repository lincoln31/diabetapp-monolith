import prisma from '../src/config/db';
import { api } from './helpers/api';
import { registerUser, VALID_PASSWORD } from './helpers/factories';

describe('POST /api/auth/login', () => {
  it('devuelve tokens y actualiza lastLoginAt', async () => {
    const { email, user } = await registerUser();

    const response = await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
    expect(typeof response.body.data.refreshToken).toBe('string');

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastLoginAt: true },
    });
    expect(stored?.lastLoginAt).not.toBeNull();
  });

  it('rechaza una contraseña incorrecta', async () => {
    const { email } = await registerUser();

    const response = await api().post('/api/auth/login').send({ email, password: 'OtraPass99' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('responde igual con un correo que no existe', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ email: 'nadie@test.com', password: VALID_PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rechaza a un usuario inactivo con la misma respuesta', async () => {
    const { email, user } = await registerUser();
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    const response = await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
