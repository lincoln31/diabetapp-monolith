import { api } from './helpers/api';
import { authHeader, createReading, registerUser } from './helpers/factories';

describe('/api/glucose', () => {
  it('crea una lectura', async () => {
    const { accessToken } = await registerUser();

    const response = await api().post('/api/glucose').set(authHeader(accessToken)).send({
      value: 110,
      timestamp: '2026-09-19T10:00:00.000Z',
      momentOfDay: 'BEFORE_BREAKFAST',
      notes: 'Antes del desayuno',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ value: 110, momentOfDay: 'BEFORE_BREAKFAST' });
  });

  it('valida el valor, el momento del día y la fecha', async () => {
    const { accessToken } = await registerUser();

    const response = await api()
      .post('/api/glucose')
      .set(authHeader(accessToken))
      .send({ value: 700.5, momentOfDay: 'ayunas' });

    expect(response.status).toBe(400);
    const fields = response.body.error.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(expect.arrayContaining(['value', 'timestamp', 'momentOfDay']));
  });

  it('exige sesión', async () => {
    const response = await api().get('/api/glucose');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('lista paginado y ordenado por fecha descendente', async () => {
    const { accessToken, user } = await registerUser();

    for (let dia = 1; dia <= 7; dia++) {
      await createReading(user.id, {
        value: 100 + dia,
        timestamp: new Date(`2026-09-0${dia}T10:00:00.000Z`),
      });
    }

    const response = await api().get('/api/glucose?page=2&limit=3').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.map((r: { value: number }) => r.value)).toEqual([104, 103, 102]);
    expect(response.body.meta).toEqual({ page: 2, limit: 3, total: 7, totalPages: 3 });
  });

  it('filtra por rango de fechas, con ambos extremos incluidos', async () => {
    const { accessToken, user } = await registerUser();

    for (let dia = 1; dia <= 5; dia++) {
      await createReading(user.id, {
        value: 100 + dia,
        timestamp: new Date(`2026-09-0${dia}T10:00:00.000Z`),
      });
    }

    const response = await api()
      .get('/api/glucose?from=2026-09-02T00:00:00.000Z&to=2026-09-04T23:59:59.000Z')
      .set(authHeader(accessToken));

    expect(response.body.data.map((r: { value: number }) => r.value)).toEqual([104, 103, 102]);
  });

  it('rechaza un limit fuera de rango', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/glucose?limit=500').set(authHeader(accessToken));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('no deja ver, editar ni borrar lecturas de otro usuario', async () => {
    const dueño = await registerUser();
    const otro = await registerUser();
    const lectura = await createReading(dueño.user.id);

    const ver = await api().get(`/api/glucose/${lectura.id}`).set(authHeader(otro.accessToken));
    const editar = await api()
      .put(`/api/glucose/${lectura.id}`)
      .set(authHeader(otro.accessToken))
      .send({ value: 200 });
    const borrar = await api()
      .delete(`/api/glucose/${lectura.id}`)
      .set(authHeader(otro.accessToken));

    expect([ver.status, editar.status, borrar.status]).toEqual([404, 404, 404]);

    // La lectura sigue intacta para su dueño
    const propia = await api().get(`/api/glucose/${lectura.id}`).set(authHeader(dueño.accessToken));
    expect(propia.body.data.value).toBe(110);
  });

  it('rechaza una actualización sin campos', async () => {
    const { accessToken, user } = await registerUser();
    const lectura = await createReading(user.id);

    const response = await api()
      .put(`/api/glucose/${lectura.id}`)
      .set(authHeader(accessToken))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('actualiza y borra una lectura propia', async () => {
    const { accessToken, user } = await registerUser();
    const lectura = await createReading(user.id);

    const actualizada = await api()
      .put(`/api/glucose/${lectura.id}`)
      .set(authHeader(accessToken))
      .send({ value: 125, notes: 'Corregido' });
    expect(actualizada.body.data).toMatchObject({ value: 125, notes: 'Corregido' });

    const borrada = await api().delete(`/api/glucose/${lectura.id}`).set(authHeader(accessToken));
    expect(borrada.status).toBe(200);
    expect(borrada.body.data).toBeNull();

    const despues = await api().get(`/api/glucose/${lectura.id}`).set(authHeader(accessToken));
    expect(despues.status).toBe(404);
  });
});
