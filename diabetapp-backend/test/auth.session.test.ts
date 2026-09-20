import jwt from 'jsonwebtoken';
import prisma from '../src/config/db';
import { env } from '../src/config/env';
import { api } from './helpers/api';
import { authHeader, registerUser } from './helpers/factories';

describe('Sesión: refresh, logout y /me', () => {
  it('rota el token de renovación y guarda solo su hash', async () => {
    const { refreshToken } = await registerUser();

    const response = await api().post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.refreshToken).not.toBe(refreshToken);

    // El valor del token nunca se guarda tal cual
    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash: refreshToken } });
    expect(stored).toBeNull();
  });

  it('revoca toda la cadena si se reutiliza un token ya rotado', async () => {
    const { refreshToken } = await registerUser();

    const rotated = await api().post('/api/auth/refresh').send({ refreshToken });
    const nuevo = rotated.body.data.refreshToken as string;

    const reuse = await api().post('/api/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);

    // El token nuevo también queda revocado: la sesión entera se cierra
    const afterReuse = await api().post('/api/auth/refresh').send({ refreshToken: nuevo });
    expect(afterReuse.status).toBe(401);
  });

  it('rechaza renovar si el usuario está inactivo', async () => {
    const { refreshToken, user } = await registerUser();
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    const response = await api().post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rechaza un token de renovación caducado', async () => {
    const { refreshToken, user } = await registerUser();
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await api().post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(401);
  });

  it('cierra sesión y es idempotente', async () => {
    const { refreshToken } = await registerUser();

    expect((await api().post('/api/auth/logout').send({ refreshToken })).status).toBe(200);
    expect((await api().post('/api/auth/logout').send({ refreshToken })).status).toBe(200);
    expect((await api().post('/api/auth/refresh').send({ refreshToken })).status).toBe(401);
  });

  it('devuelve el usuario en /me y exige token', async () => {
    const { accessToken, email } = await registerUser();

    const conToken = await api().get('/api/auth/me').set(authHeader(accessToken));
    expect(conToken.status).toBe(200);
    expect(conToken.body.data.user.email).toBe(email);

    const sinToken = await api().get('/api/auth/me');
    expect(sinToken.status).toBe(401);
    expect(sinToken.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('distingue un token de acceso expirado con TOKEN_EXPIRED', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '-1s' });

    const response = await api().get('/api/auth/me').set(authHeader(expired));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_EXPIRED');
  });
});
