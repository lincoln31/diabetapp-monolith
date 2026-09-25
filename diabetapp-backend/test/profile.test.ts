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
      weight: null,
      height: null,
      activityLevel: null,
      onboardingCompleted: false,
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

  it('no permite tocar el perfil de otro usuario', async () => {
    const dueño = await registerUser();
    const otro = await registerUser();

    await api().put('/api/profile').set(authHeader(otro.accessToken)).send({ weight: 90 });
    const propio = await api().get('/api/profile').set(authHeader(dueño.accessToken));

    expect(propio.body.data.weight).toBeNull();
  });
});
