import { api } from './helpers/api';
import { authHeader, createReading, registerUser } from './helpers/factories';

const CATALOG_CODES = [
  'STREAK_3',
  'STREAK_7',
  'STREAK_30',
  'READINGS_10',
  'READINGS_50',
  'READINGS_100',
];

const byCode = (achievements: { code: string }[], code: string) =>
  achievements.find((a) => a.code === code);

describe('/api/achievements', () => {
  it('exige sesión', async () => {
    const response = await api().get('/api/achievements');

    expect(response.status).toBe(401);
  });

  it('devuelve el catálogo completo bloqueado sin lecturas', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/achievements').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    const { achievements } = response.body.data;
    expect(achievements.map((a: { code: string }) => a.code)).toEqual(CATALOG_CODES);
    expect(achievements.every((a: { unlocked: boolean }) => a.unlocked === false)).toBe(true);
    expect(byCode(achievements, 'READINGS_10')).toMatchObject({ currentValue: 0, threshold: 10 });
  });

  it('desbloquea los logros de racha y volumen que el usuario ya cruzó', async () => {
    const { accessToken, user } = await registerUser();
    const DAY = 24 * 60 * 60 * 1000;

    // 10 días seguidos con una lectura cada uno: racha 10, 10 lecturas en total
    for (let dias = 0; dias < 10; dias++) {
      await createReading(user.id, { timestamp: new Date(Date.now() - dias * DAY) });
    }

    const response = await api().get('/api/achievements').set(authHeader(accessToken));
    const { achievements } = response.body.data;

    expect(byCode(achievements, 'STREAK_3')).toMatchObject({ unlocked: true, currentValue: 10 });
    expect(byCode(achievements, 'STREAK_7')).toMatchObject({ unlocked: true, currentValue: 10 });
    expect(byCode(achievements, 'STREAK_30')).toMatchObject({ unlocked: false, currentValue: 10 });
    expect(byCode(achievements, 'READINGS_10')).toMatchObject({ unlocked: true, currentValue: 10 });
    expect(byCode(achievements, 'READINGS_50')).toMatchObject({
      unlocked: false,
      currentValue: 10,
    });
  });

  it('mantiene desbloqueado el logro de racha aunque la racha actual ya se haya roto', async () => {
    const { accessToken, user } = await registerUser();
    const DAY = 24 * 60 * 60 * 1000;

    // Racha de 5 días, pero terminada hace 20 días: la racha actual es 0
    for (let dias = 20; dias < 25; dias++) {
      await createReading(user.id, { timestamp: new Date(Date.now() - dias * DAY) });
    }

    const response = await api().get('/api/achievements').set(authHeader(accessToken));
    const { achievements } = response.body.data;

    expect(byCode(achievements, 'STREAK_3')).toMatchObject({ unlocked: true, currentValue: 5 });
  });

  it('no cuenta lecturas de otro usuario', async () => {
    const { accessToken } = await registerUser();
    const otro = await registerUser();
    for (let i = 0; i < 20; i++) {
      await createReading(otro.user.id, { timestamp: new Date() });
    }

    const response = await api().get('/api/achievements').set(authHeader(accessToken));
    const { achievements } = response.body.data;

    expect(byCode(achievements, 'READINGS_10')).toMatchObject({ unlocked: false, currentValue: 0 });
  });
});
