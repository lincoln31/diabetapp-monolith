import prisma from '../src/config/db';
import { api } from './helpers/api';
import { authHeader, createReading, registerUser } from './helpers/factories';

describe('/api/profile', () => {
  it('exige sesión', async () => {
    const get = await api().get('/api/profile');
    const put = await api().put('/api/profile').send({ targetHba1c: 6.5 });

    expect(get.status).toBe(401);
    expect(put.status).toBe(401);
    expect(get.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('devuelve el perfil propio sin contraseña', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/profile').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      typeOfDiabetes: null,
      targetGlucoseMin: 80,
      targetGlucoseMax: 180,
      targetHba1c: null,
      dailyGlucoseChecks: 4,
      exerciseGoalMinutes: 30,
      weight: null,
      height: null,
      activityLevel: null,
      phone: null,
      birthDate: null,
      insulinCarbRatio: null,
      insulinSensitivityFactor: null,
      onboardingCompleted: false,
      notificationPreferences: {
        medicationReminders: false,
        glucoseReminders: false,
        motivational: false,
        achievements: false,
      },
      glucoseReminderTimes: [],
    });
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('actualiza solo los campos enviados y marca el onboarding', async () => {
    const { accessToken } = await registerUser();

    const response = await api()
      .put('/api/profile')
      .set(authHeader(accessToken))
      .send({ targetHba1c: 6.5 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      targetHba1c: 6.5,
      targetGlucoseMin: 80,
      targetGlucoseMax: 180,
      onboardingCompleted: true,
    });
  });

  it('borra un campo cuando se envía null', async () => {
    const { accessToken } = await registerUser();
    await api().put('/api/profile').set(authHeader(accessToken)).send({ targetHba1c: 6.5 });

    const response = await api()
      .put('/api/profile')
      .set(authHeader(accessToken))
      .send({ targetHba1c: null });

    expect(response.body.data.targetHba1c).toBeNull();
  });

  it('rechaza un cuerpo vacío', async () => {
    const { accessToken } = await registerUser();

    const response = await api().put('/api/profile').set(authHeader(accessToken)).send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza valores fuera de límites y enums inexistentes señalando el campo', async () => {
    const { accessToken } = await registerUser();

    const response = await api()
      .put('/api/profile')
      .set(authHeader(accessToken))
      .send({ weight: 5, height: 300, targetHba1c: 20, typeOfDiabetes: 'TIPO_9' });

    expect(response.status).toBe(400);
    const fields = response.body.error.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(
      expect.arrayContaining(['weight', 'height', 'targetHba1c', 'typeOfDiabetes']),
    );
  });

  it('guarda y borra teléfono y fecha de nacimiento, y rechaza valores inválidos', async () => {
    const { accessToken } = await registerUser();
    const put = (body: object) => api().put('/api/profile').set(authHeader(accessToken)).send(body);

    const saved = await put({ phone: '300 123-4567', birthDate: '1990-05-20T00:00:00.000Z' });
    expect(saved.status).toBe(200);
    expect(saved.body.data.phone).toBe('300 123-4567');
    expect(saved.body.data.birthDate).toBe('1990-05-20T00:00:00.000Z');

    const badPhone = await put({ phone: 'abc' });
    expect(badPhone.status).toBe(400);
    expect(badPhone.body.error.fields[0].field).toBe('phone');

    const future = await put({ birthDate: '2999-01-01T00:00:00.000Z' });
    expect(future.status).toBe(400);
    expect(future.body.error.fields[0].field).toBe('birthDate');

    const cleared = await put({ phone: null, birthDate: null });
    expect(cleared.body.data.phone).toBeNull();
    expect(cleared.body.data.birthDate).toBeNull();
  });

  it('guarda, borra y valida el ratio y el factor de sensibilidad de insulina (fase 17)', async () => {
    const { accessToken } = await registerUser();
    const put = (body: object) => api().put('/api/profile').set(authHeader(accessToken)).send(body);

    const saved = await put({ insulinCarbRatio: 10, insulinSensitivityFactor: 40 });
    expect(saved.status).toBe(200);
    expect(saved.body.data.insulinCarbRatio).toBe(10);
    expect(saved.body.data.insulinSensitivityFactor).toBe(40);

    const cleared = await put({ insulinCarbRatio: null, insulinSensitivityFactor: null });
    expect(cleared.body.data.insulinCarbRatio).toBeNull();
    expect(cleared.body.data.insulinSensitivityFactor).toBeNull();

    const outOfRange = await put({ insulinCarbRatio: 0, insulinSensitivityFactor: 500 });
    expect(outOfRange.status).toBe(400);
    const fields = outOfRange.body.error.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(
      expect.arrayContaining(['insulinCarbRatio', 'insulinSensitivityFactor']),
    );
  });

  it('rechaza un rango incoherente contra el valor ya guardado', async () => {
    const { accessToken } = await registerUser(); // rango por defecto 80-180

    const response = await api()
      .put('/api/profile')
      .set(authHeader(accessToken))
      .send({ targetGlucoseMin: 200 });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual([
      expect.objectContaining({ field: 'targetGlucoseMin' }),
    ]);
  });

  it('acepta un rango coherente y /glucose/stats lo refleja', async () => {
    const { accessToken, user } = await registerUser();
    await createReading(user.id, { timestamp: new Date() });

    const update = await api()
      .put('/api/profile')
      .set(authHeader(accessToken))
      .send({ targetGlucoseMin: 90, targetGlucoseMax: 140, typeOfDiabetes: 'TYPE_2' });
    const stats = await api().get('/api/glucose/stats').set(authHeader(accessToken));

    expect(update.status).toBe(200);
    expect(update.body.data.typeOfDiabetes).toBe('TYPE_2');
    expect(stats.body.data.target).toEqual({ min: 90, max: 140 });
  });

  it('permite cambiar la meta diaria y rechaza valores fuera de 1 a 20', async () => {
    const { accessToken } = await registerUser();
    const put = (body: object) => api().put('/api/profile').set(authHeader(accessToken)).send(body);

    const cinco = await put({ dailyGlucoseChecks: 5 });
    const cero = await put({ dailyGlucoseChecks: 0 });
    const veintiuno = await put({ dailyGlucoseChecks: 21 });
    const nula = await put({ dailyGlucoseChecks: null });

    expect(cinco.body.data.dailyGlucoseChecks).toBe(5);
    expect([cero.status, veintiuno.status, nula.status]).toEqual([400, 400, 400]);
    expect(cero.body.error.fields[0].field).toBe('dailyGlucoseChecks');
  });

  it('permite cambiar la meta de ejercicio y rechaza valores fuera de 5 a 300', async () => {
    const { accessToken } = await registerUser();
    const put = (body: object) => api().put('/api/profile').set(authHeader(accessToken)).send(body);

    const cuarenta = await put({ exerciseGoalMinutes: 45 });
    const cuatro = await put({ exerciseGoalMinutes: 4 });
    const grande = await put({ exerciseGoalMinutes: 301 });
    const nula = await put({ exerciseGoalMinutes: null });

    expect(cuarenta.body.data.exerciseGoalMinutes).toBe(45);
    expect([cuatro.status, grande.status, nula.status]).toEqual([400, 400, 400]);
    expect(cuatro.body.error.fields[0].field).toBe('exerciseGoalMinutes');
  });

  describe('preferencias de notificaciones (fase 13)', () => {
    it('guarda las preferencias y los horarios de glucosa ordenados', async () => {
      const { accessToken } = await registerUser();
      const put = (body: object) =>
        api().put('/api/profile').set(authHeader(accessToken)).send(body);

      const response = await put({
        notificationPreferences: { medicationReminders: true, glucoseReminders: true },
        glucoseReminderTimes: ['20:00', '07:30'],
      });

      expect(response.status).toBe(200);
      expect(response.body.data.notificationPreferences).toEqual({
        medicationReminders: true,
        glucoseReminders: true,
        motivational: false,
        achievements: false,
      });
      expect(response.body.data.glucoseReminderTimes).toEqual(['07:30', '20:00']);

      const again = await api().get('/api/profile').set(authHeader(accessToken));
      expect(again.body.data.notificationPreferences.glucoseReminders).toBe(true);
      expect(again.body.data.glucoseReminderTimes).toEqual(['07:30', '20:00']);
    });

    it('combina con lo guardado: enviar una clave no borra las demás', async () => {
      const { accessToken } = await registerUser();
      const put = (body: object) =>
        api().put('/api/profile').set(authHeader(accessToken)).send(body);

      await put({ notificationPreferences: { medicationReminders: true } });
      const response = await put({ notificationPreferences: { motivational: true } });

      expect(response.body.data.notificationPreferences).toEqual({
        medicationReminders: true,
        glucoseReminders: false,
        motivational: true,
        achievements: false,
      });
    });

    it('actualizar otros campos no toca las preferencias', async () => {
      const { accessToken } = await registerUser();
      const put = (body: object) =>
        api().put('/api/profile').set(authHeader(accessToken)).send(body);

      await put({
        notificationPreferences: { achievements: true },
        glucoseReminderTimes: ['08:00'],
      });
      const response = await put({ weight: 70 });

      expect(response.body.data.notificationPreferences.achievements).toBe(true);
      expect(response.body.data.glucoseReminderTimes).toEqual(['08:00']);
    });

    it('permite vaciar los horarios de glucosa', async () => {
      const { accessToken } = await registerUser();
      const put = (body: object) =>
        api().put('/api/profile').set(authHeader(accessToken)).send(body);

      await put({ glucoseReminderTimes: ['08:00'] });
      const response = await put({ glucoseReminderTimes: [] });

      expect(response.body.data.glucoseReminderTimes).toEqual([]);
    });

    it.each([
      ['horario mal escrito', { glucoseReminderTimes: ['8:00'] }, 'glucoseReminderTimes.0'],
      ['hora inexistente', { glucoseReminderTimes: ['25:00'] }, 'glucoseReminderTimes.0'],
      ['horarios repetidos', { glucoseReminderTimes: ['08:00', '08:00'] }, 'glucoseReminderTimes'],
      [
        'más de 6 horarios',
        { glucoseReminderTimes: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'] },
        'glucoseReminderTimes',
      ],
      ['clave desconocida', { notificationPreferences: { sms: true } }, 'notificationPreferences'],
      [
        'valor no booleano',
        { notificationPreferences: { motivational: 'si' } },
        'notificationPreferences.motivational',
      ],
      ['preferencias nulas', { notificationPreferences: null }, 'notificationPreferences'],
    ])('rechaza %s con VALIDATION_ERROR', async (_name, body, field) => {
      const { accessToken } = await registerUser();

      const response = await api().put('/api/profile').set(authHeader(accessToken)).send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.map((f: { field: string }) => f.field)).toContain(field);
    });

    it('devuelve valores por defecto si el JSON guardado está malformado', async () => {
      const { accessToken, user } = await registerUser();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          notificationPreferences: { medicationReminders: 'si', otra: 1 },
          reminderTimes: ['8:00', '07:30', 5],
        },
      });

      const response = await api().get('/api/profile').set(authHeader(accessToken));

      expect(response.body.data.notificationPreferences.medicationReminders).toBe(false);
      expect(response.body.data.notificationPreferences).not.toHaveProperty('otra');
      expect(response.body.data.glucoseReminderTimes).toEqual(['07:30']);
    });

    it('no mezcla las preferencias de dos usuarios', async () => {
      const owner = await registerUser();
      const other = await registerUser();

      await api()
        .put('/api/profile')
        .set(authHeader(owner.accessToken))
        .send({ notificationPreferences: { medicationReminders: true } });
      const response = await api().get('/api/profile').set(authHeader(other.accessToken));

      expect(response.body.data.notificationPreferences.medicationReminders).toBe(false);
    });
  });

  it('no permite tocar el perfil de otro usuario', async () => {
    const dueño = await registerUser();
    const otro = await registerUser();

    await api().put('/api/profile').set(authHeader(otro.accessToken)).send({ weight: 90 });
    const propio = await api().get('/api/profile').set(authHeader(dueño.accessToken));

    expect(propio.body.data.weight).toBeNull();
  });
});
