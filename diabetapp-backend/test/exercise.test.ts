import prisma from '../src/config/db';
import { api } from './helpers/api';
import { authHeader, createReading, registerUser } from './helpers/factories';

const DAY = 24 * 60 * 60 * 1000;
const VALID = { type: 'WALKING', durationMinutes: 30 };

const createActivity = (accessToken: string, body: object = VALID) =>
  api().post('/api/exercise').set(authHeader(accessToken)).send(body);

const insertActivity = (userId: string, minutes: number, startedAt: Date) =>
  prisma.exerciseActivity.create({
    data: { userId, type: 'WALKING', durationMinutes: minutes, startedAt },
  });

describe('/api/exercise', () => {
  it('exige sesión en todas las rutas', async () => {
    expect((await api().get('/api/exercise')).status).toBe(401);
    expect((await api().post('/api/exercise').send(VALID)).status).toBe(401);
    expect((await api().get('/api/exercise/summary')).status).toBe(401);
    expect((await api().delete('/api/exercise/abc')).status).toBe(401);
  });

  describe('POST y GET', () => {
    it('registra una actividad y la lista', async () => {
      const { accessToken } = await registerUser();

      const created = await createActivity(accessToken, { ...VALID, notes: 'Parque' });
      expect(created.status).toBe(201);
      expect(created.body.data).toMatchObject({
        type: 'WALKING',
        durationMinutes: 30,
        notes: 'Parque',
      });

      const list = await api().get('/api/exercise').set(authHeader(accessToken));
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
    });

    it.each([
      ['tipo desconocido', { ...VALID, type: 'PARKOUR' }],
      ['duración 0', { ...VALID, durationMinutes: 0 }],
      ['duración mayor a 600', { ...VALID, durationMinutes: 601 }],
      ['duración decimal', { ...VALID, durationMinutes: 12.5 }],
      ['inicio futuro', { ...VALID, startedAt: new Date(Date.now() + DAY).toISOString() }],
      ['fecha mal escrita', { ...VALID, startedAt: 'ayer' }],
    ])('rechaza %s con VALIDATION_ERROR', async (_name, body) => {
      const { accessToken } = await registerUser();

      const response = await createActivity(accessToken, body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.length).toBeGreaterThan(0);
    });

    it('filtra por rango, pagina y ordena de la más reciente a la más antigua', async () => {
      const { accessToken, user } = await registerUser();
      for (const days of [1, 2, 3, 10]) {
        await insertActivity(user.id, days * 10, new Date(Date.now() - days * DAY));
      }

      const from = new Date(Date.now() - 4 * DAY).toISOString();
      const filtered = await api()
        .get('/api/exercise')
        .query({ from, limit: 2, page: 1 })
        .set(authHeader(accessToken));

      expect(filtered.body.meta).toMatchObject({ total: 3, totalPages: 2, limit: 2 });
      expect(filtered.body.data.map((a: { durationMinutes: number }) => a.durationMinutes)).toEqual(
        [10, 20],
      );
    });

    it('no lista actividades de otro usuario', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      await createActivity(owner.accessToken);

      const list = await api().get('/api/exercise').set(authHeader(other.accessToken));

      expect(list.body.data).toHaveLength(0);
    });
  });

  describe('DELETE', () => {
    it('borra una actividad propia', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createActivity(accessToken)).body.data;

      const response = await api().delete(`/api/exercise/${id}`).set(authHeader(accessToken));

      expect(response.status).toBe(200);
      const list = await api().get('/api/exercise').set(authHeader(accessToken));
      expect(list.body.data).toHaveLength(0);
    });

    it('la actividad de otro usuario responde NOT_FOUND y no se borra', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { id } = (await createActivity(owner.accessToken)).body.data;

      const response = await api().delete(`/api/exercise/${id}`).set(authHeader(other.accessToken));

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(await prisma.exerciseActivity.count({ where: { id } })).toBe(1);
    });
  });

  describe('GET /summary', () => {
    it('sin actividades devuelve ceros, la meta y correlación insuficiente', async () => {
      const { accessToken } = await registerUser();

      const response = await api().get('/api/exercise/summary').set(authHeader(accessToken));

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        todayMinutes: 0,
        goalMinutes: 30,
        last7DaysMinutes: 0,
        correlation: { sufficientData: false, difference: null },
      });
    });

    it('cuenta hoy y los últimos 7 días', async () => {
      const { accessToken, user } = await registerUser();
      await insertActivity(user.id, 20, new Date());
      await insertActivity(user.id, 15, new Date(Date.now() - 1 * DAY));
      await insertActivity(user.id, 60, new Date(Date.now() - 20 * DAY));

      const response = await api().get('/api/exercise/summary').set(authHeader(accessToken));

      expect(response.body.data.todayMinutes).toBe(20);
      expect(response.body.data.last7DaysMinutes).toBe(35);
    });

    it('calcula la correlación con lecturas suficientes en ambos grupos', async () => {
      const { accessToken, user } = await registerUser();
      // Días 2 y 4 con ejercicio (lecturas de 100); días 3 y 5 sin ejercicio (lecturas de 160)
      for (const days of [2, 4]) {
        const at = new Date(Date.now() - days * DAY);
        await insertActivity(user.id, 30, at);
        for (let i = 0; i < 3; i++) await createReading(user.id, { value: 100, timestamp: at });
      }
      for (const days of [3, 5]) {
        const at = new Date(Date.now() - days * DAY);
        for (let i = 0; i < 3; i++) await createReading(user.id, { value: 160, timestamp: at });
      }

      const response = await api().get('/api/exercise/summary').set(authHeader(accessToken));

      expect(response.body.data.correlation).toEqual({
        sufficientData: true,
        withExercise: { days: 2, average: 100 },
        withoutExercise: { days: 2, average: 160 },
        difference: -60,
      });
    });

    it('con pocas lecturas en un grupo devuelve datos insuficientes', async () => {
      const { accessToken, user } = await registerUser();
      const at = new Date(Date.now() - 2 * DAY);
      await insertActivity(user.id, 30, at);
      await createReading(user.id, { value: 100, timestamp: at });
      for (let i = 0; i < 6; i++) {
        await createReading(user.id, { value: 150, timestamp: new Date(Date.now() - 3 * DAY) });
      }

      const response = await api().get('/api/exercise/summary').set(authHeader(accessToken));

      expect(response.body.data.correlation).toMatchObject({
        sufficientData: false,
        withExercise: { average: null },
        difference: null,
      });
    });

    it('no cuenta actividades ni lecturas de otro usuario', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      await insertActivity(owner.user.id, 45, new Date());

      const response = await api().get('/api/exercise/summary').set(authHeader(other.accessToken));

      expect(response.body.data.todayMinutes).toBe(0);
      expect(response.body.data.last7DaysMinutes).toBe(0);
    });
  });
});
