import prisma from '../src/config/db';
import { api } from './helpers/api';
import { registerUser, VALID_PASSWORD } from './helpers/factories';

describe('POST /api/auth/register', () => {
  it('crea el usuario y devuelve el par de tokens', async () => {
    const response = await api().post('/api/auth/register').send({
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@test.com',
      phone: '3001234567',
      birthDate: '1990-03-15T00:00:00.000Z',
      password: VALID_PASSWORD,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: { email: 'ana@test.com', firstName: 'Ana', onboardingCompleted: false },
        requiresOnboarding: true,
      },
    });
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(typeof response.body.data.refreshToken).toBe('string');
    // La contraseña nunca viaja de vuelta
    expect(response.body.data.user.password).toBeUndefined();
  });

  it('guarda el correo en minúsculas', async () => {
    await api()
      .post('/api/auth/register')
      .send({ email: 'MAYUSCULAS@Test.COM', password: VALID_PASSWORD });

    const user = await prisma.user.findUnique({ where: { email: 'mayusculas@test.com' } });
    expect(user).not.toBeNull();
  });

  it('rechaza un correo ya registrado con EMAIL_IN_USE', async () => {
    const { email } = await registerUser();

    const response = await api().post('/api/auth/register').send({ email, password: VALID_PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('rechaza una contraseña débil indicando el campo', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ email: 'debil@test.com', password: 'corta' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields.map((f: { field: string }) => f.field)).toContain('password');
  });

  it('rechaza un teléfono y una fecha con formato inválido', async () => {
    const response = await api().post('/api/auth/register').send({
      email: 'formato@test.com',
      password: VALID_PASSWORD,
      phone: '12ab',
      birthDate: '15/03/1990',
    });

    expect(response.status).toBe(400);
    const fields = response.body.error.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(expect.arrayContaining(['phone', 'birthDate']));
  });
});
