import prisma from '../src/config/db';
import { api } from './helpers/api';
import { authHeader, registerUser } from './helpers/factories';

const VALID = { name: 'Metformina', dosage: '850 mg', scheduledTimes: ['20:00', '08:00'] };
const DAY = 24 * 60 * 60 * 1000;

const createMedication = async (accessToken: string, body: object = VALID) => {
  const response = await api().post('/api/medications').set(authHeader(accessToken)).send(body);
  return response;
};

describe('/api/medications', () => {
  it('exige sesión en todas las rutas', async () => {
    expect((await api().get('/api/medications')).status).toBe(401);
    expect((await api().post('/api/medications').send(VALID)).status).toBe(401);
    expect((await api().get('/api/medications/adherence')).status).toBe(401);
  });

  describe('CRUD', () => {
    it('crea un medicamento y lo lista con los horarios ordenados', async () => {
      const { accessToken } = await registerUser();

      const created = await createMedication(accessToken);
      expect(created.status).toBe(201);
      expect(created.body.data).toMatchObject({
        name: 'Metformina',
        scheduledTimes: ['08:00', '20:00'],
        takenToday: 0,
      });

      const list = await api().get('/api/medications').set(authHeader(accessToken));
      expect(list.status).toBe(200);
      expect(list.body.data.medications).toHaveLength(1);
    });

    it.each([
      ['nombre vacío', { ...VALID, name: '  ' }],
      ['dosis vacía', { ...VALID, dosage: '' }],
      ['sin horarios', { ...VALID, scheduledTimes: [] }],
      ['horario mal escrito', { ...VALID, scheduledTimes: ['8:00'] }],
      ['hora inexistente', { ...VALID, scheduledTimes: ['25:00'] }],
      ['horarios repetidos', { ...VALID, scheduledTimes: ['08:00', '08:00'] }],
    ])('rechaza %s con VALIDATION_ERROR', async (_name, body) => {
      const { accessToken } = await registerUser();

      const response = await createMedication(accessToken, body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.length).toBeGreaterThan(0);
    });

    it('edita un medicamento propio', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;

      const response = await api()
        .put(`/api/medications/${id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Metformina XR', dosage: '1000 mg', scheduledTimes: ['21:00'] });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        name: 'Metformina XR',
        dosage: '1000 mg',
        scheduledTimes: ['21:00'],
      });
    });

    it('archiva: desaparece del listado pero conserva sus tomas', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;
      await api().post(`/api/medications/${id}/intakes`).set(authHeader(accessToken)).send({});

      const response = await api().delete(`/api/medications/${id}`).set(authHeader(accessToken));

      expect(response.status).toBe(200);
      const list = await api().get('/api/medications').set(authHeader(accessToken));
      expect(list.body.data.medications).toHaveLength(0);
      expect(await prisma.medicationIntake.count({ where: { medicationId: id } })).toBe(1);
    });

    it('un medicamento de otro usuario responde NOT_FOUND al editar, archivar y registrar toma', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { id } = (await createMedication(owner.accessToken)).body.data;

      const put = await api()
        .put(`/api/medications/${id}`)
        .set(authHeader(other.accessToken))
        .send(VALID);
      const del = await api().delete(`/api/medications/${id}`).set(authHeader(other.accessToken));
      const intake = await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(other.accessToken))
        .send({});

      for (const response of [put, del, intake]) {
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      }
    });

    it('no lista los medicamentos de otro usuario', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      await createMedication(owner.accessToken);

      const list = await api().get('/api/medications').set(authHeader(other.accessToken));

      expect(list.body.data.medications).toHaveLength(0);
    });
  });

  describe('tomas', () => {
    it('registrar una toma sube takenToday', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;

      const intake = await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(accessToken))
        .send({});
      expect(intake.status).toBe(201);

      const list = await api().get('/api/medications').set(authHeader(accessToken));
      expect(list.body.data.medications[0].takenToday).toBe(1);
    });

    it('una toma de ayer no cuenta como de hoy', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;
      await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(accessToken))
        .send({ takenAt: new Date(Date.now() - 2 * DAY).toISOString() });

      const list = await api().get('/api/medications').set(authHeader(accessToken));

      expect(list.body.data.medications[0].takenToday).toBe(0);
    });

    it('rechaza una toma futura', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;

      const response = await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(accessToken))
        .send({ takenAt: new Date(Date.now() + DAY).toISOString() });

      expect(response.status).toBe(400);
    });

    it('no permite registrar una toma sobre un medicamento archivado', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;
      await api().delete(`/api/medications/${id}`).set(authHeader(accessToken));

      const response = await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(accessToken))
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /adherence', () => {
    it('devuelve porcentaje null sin medicamentos', async () => {
      const { accessToken } = await registerUser();

      const response = await api().get('/api/medications/adherence').set(authHeader(accessToken));

      expect(response.status).toBe(200);
      expect(response.body.data.days7).toEqual({ expected: 0, taken: 0, percent: null });
      expect(response.body.data.days30.percent).toBeNull();
    });

    it('un medicamento creado hoy solo cuenta desde hoy', async () => {
      const { accessToken } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;
      await api().post(`/api/medications/${id}/intakes`).set(authHeader(accessToken)).send({});

      const response = await api().get('/api/medications/adherence').set(authHeader(accessToken));

      expect(response.body.data.days7).toEqual({ expected: 2, taken: 1, percent: 50 });
      expect(response.body.data.days30).toEqual({ expected: 2, taken: 1, percent: 50 });
    });

    it('cuenta las tomas de días pasados de un medicamento antiguo', async () => {
      const { accessToken, user } = await registerUser();
      const { id } = (await createMedication(accessToken)).body.data;
      await prisma.medication.update({
        where: { id },
        data: { createdAt: new Date(Date.now() - 20 * DAY) },
      });
      for (const days of [1, 2, 3]) {
        await prisma.medicationIntake.create({
          data: { medicationId: id, userId: user.id, takenAt: new Date(Date.now() - days * DAY) },
        });
      }

      const response = await api().get('/api/medications/adherence').set(authHeader(accessToken));

      // 7 días × 2 horarios = 14 esperadas; 3 días con 1 toma cada uno
      expect(response.body.data.days7).toEqual({ expected: 14, taken: 3, percent: 21 });
      expect(response.body.data.days30.expected).toBe(42);
    });

    it('no mezcla las tomas de otro usuario', async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { id } = (await createMedication(owner.accessToken)).body.data;
      await api()
        .post(`/api/medications/${id}/intakes`)
        .set(authHeader(owner.accessToken))
        .send({});

      const response = await api()
        .get('/api/medications/adherence')
        .set(authHeader(other.accessToken));

      expect(response.body.data.days7.percent).toBeNull();
    });
  });
});
