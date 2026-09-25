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

describe('/api/glucose/stats', () => {
  it('exige sesión', async () => {
    const response = await api().get('/api/glucose/stats');

    expect(response.status).toBe(401);
  });

  it('devuelve no_data y valores nulos sin lecturas', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/glucose/stats').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.periods['7']).toEqual({
      days: 7,
      count: 0,
      average: null,
      min: null,
      max: null,
      trend: 'no_data',
    });
    expect(response.body.data.target).toEqual({ min: 80, max: 180 });
  });

  it('calcula los promedios de las tres ventanas y no mezcla lecturas de otro usuario', async () => {
    const { accessToken, user } = await registerUser();
    const otro = await registerUser();

    const ahora = Date.now();
    const haceDias = (dias: number) => new Date(ahora - dias * 24 * 60 * 60 * 1000);

    await createReading(user.id, { value: 100, timestamp: haceDias(1) });
    await createReading(user.id, { value: 120, timestamp: haceDias(5) });
    await createReading(user.id, { value: 200, timestamp: haceDias(20) }); // solo entra en la ventana de 30
    await createReading(otro.user.id, { value: 999, timestamp: haceDias(1) });

    const response = await api().get('/api/glucose/stats').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.periods['7'].count).toBe(2);
    expect(response.body.data.periods['7'].average).toBe(110);
    expect(response.body.data.periods['14'].count).toBe(2);
    expect(response.body.data.periods['30'].count).toBe(3);
  });

  it('respeta el límite exacto de la ventana de 7 días (día 6 sí, día 8 no)', async () => {
    const { accessToken, user } = await registerUser();

    const ahora = Date.now();
    const haceDias = (dias: number) => new Date(ahora - dias * 24 * 60 * 60 * 1000);

    await createReading(user.id, { value: 100, timestamp: haceDias(6) });
    await createReading(user.id, { value: 150, timestamp: haceDias(8) });

    const response = await api().get('/api/glucose/stats').set(authHeader(accessToken));

    expect(response.body.data.periods['7'].count).toBe(1);
    expect(response.body.data.periods['7'].average).toBe(100);
  });
});

describe('/api/glucose/hba1c', () => {
  it('exige sesión', async () => {
    const response = await api().get('/api/glucose/hba1c');

    expect(response.status).toBe(401);
  });

  it('devuelve datos insuficientes con menos de 10 lecturas', async () => {
    const { accessToken, user } = await registerUser();

    await createReading(user.id, { value: 120, timestamp: new Date() });

    const response = await api().get('/api/glucose/hba1c').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      average90: null,
      sampleCount: 1,
      sufficientData: false,
      projectedHba1c: null,
      targetHba1c: null,
    });
  });

  it('proyecta HbA1c con al menos 10 lecturas en 90 días y no mezcla lecturas de otro usuario', async () => {
    const { accessToken, user } = await registerUser();
    const otro = await registerUser();

    const ahora = Date.now();
    const haceDias = (dias: number) => new Date(ahora - dias * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 10; i++) {
      await createReading(user.id, { value: 120, timestamp: haceDias(i * 5) });
    }
    await createReading(user.id, { value: 999, timestamp: haceDias(200) }); // fuera de la ventana de 90
    await createReading(otro.user.id, { value: 300, timestamp: haceDias(1) });

    const response = await api().get('/api/glucose/hba1c').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.sampleCount).toBe(10);
    expect(response.body.data.sufficientData).toBe(true);
    expect(response.body.data.average90).toBe(120);
    expect(response.body.data.projectedHba1c).toBe(5.8);
  });
});

describe('/api/glucose/export', () => {
  it('exige sesión en ambos formatos', async () => {
    const csv = await api().get('/api/glucose/export/csv');
    const pdf = await api().get('/api/glucose/export/pdf');

    expect(csv.status).toBe(401);
    expect(pdf.status).toBe(401);
  });

  it('devuelve un CSV con una fila por lectura', async () => {
    const { accessToken, user } = await registerUser();
    await createReading(user.id, { value: 110, timestamp: new Date('2026-09-19T10:00:00.000Z') });

    const response = await api().get('/api/glucose/export/csv').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    const lines = response.text.trim().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('110');
  });

  it('devuelve un CSV solo con encabezados sin lecturas', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/glucose/export/csv').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.text.trim().split('\r\n')).toHaveLength(1);
  });

  it('devuelve un PDF válido con lecturas', async () => {
    const { accessToken, user } = await registerUser();
    await createReading(user.id);

    const response = await api()
      .get('/api/glucose/export/pdf')
      .set(authHeader(accessToken))
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect((response.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('devuelve un PDF válido sin lecturas', async () => {
    const { accessToken } = await registerUser();

    const response = await api()
      .get('/api/glucose/export/pdf')
      .set(authHeader(accessToken))
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect((response.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });
});

describe('/api/glucose/streak', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const haceDias = (dias: number) => new Date(Date.now() - dias * DAY);

  it('exige sesión', async () => {
    const response = await api().get('/api/glucose/streak');

    expect(response.status).toBe(401);
  });

  it('devuelve todo en cero sin lecturas', async () => {
    const { accessToken } = await registerUser();

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      current: 0,
      longest: 0,
      todayCount: 0,
      dailyGoal: 4,
      goalReachedToday: false,
    });
  });

  it('calcula la racha, cuenta las lecturas de hoy y respeta la meta', async () => {
    const { accessToken, user } = await registerUser();

    for (const dias of [0, 0, 1, 2]) {
      await createReading(user.id, { timestamp: haceDias(dias) });
    }
    await createReading(user.id, { timestamp: haceDias(10) });

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.body.data).toMatchObject({
      current: 3,
      longest: 3,
      todayCount: 2,
      dailyGoal: 4,
      goalReachedToday: false,
    });
  });

  it('marca la meta como cumplida y usa la meta del perfil', async () => {
    const { accessToken, user } = await registerUser();
    await api().put('/api/profile').set(authHeader(accessToken)).send({ dailyGlucoseChecks: 2 });

    await createReading(user.id, { timestamp: haceDias(0) });
    await createReading(user.id, { timestamp: haceDias(0) });

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.body.data).toMatchObject({
      dailyGoal: 2,
      todayCount: 2,
      goalReachedToday: true,
    });
  });

  it('mantiene viva la racha si hoy no hay lecturas', async () => {
    const { accessToken, user } = await registerUser();
    await createReading(user.id, { timestamp: haceDias(1) });
    await createReading(user.id, { timestamp: haceDias(2) });

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.body.data).toMatchObject({ current: 2, todayCount: 0 });
  });

  it('une dos rachas con una lectura retroactiva', async () => {
    const { accessToken, user } = await registerUser();
    for (const dias of [0, 1, 3, 4]) {
      await createReading(user.id, { timestamp: haceDias(dias) });
    }
    const antes = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    await createReading(user.id, { timestamp: haceDias(2) });
    const despues = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(antes.body.data).toMatchObject({ current: 2, longest: 2 });
    expect(despues.body.data).toMatchObject({ current: 5, longest: 5 });
  });

  it('agrupa por día local (Bogotá) y no por día UTC', async () => {
    const { accessToken, user } = await registerUser();
    const hoyLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    // 04:30 UTC de hoy local = 23:30 de ayer en Bogotá (UTC-5), siempre en el pasado
    await createReading(user.id, { timestamp: new Date(hoyLocal + 'T04:30:00.000Z') });

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.body.data).toMatchObject({ current: 1, longest: 1, todayCount: 0 });
  });

  it('no cuenta lecturas de otro usuario', async () => {
    const { accessToken } = await registerUser();
    const otro = await registerUser();
    await createReading(otro.user.id, { timestamp: haceDias(0) });

    const response = await api().get('/api/glucose/streak').set(authHeader(accessToken));

    expect(response.body.data).toMatchObject({ current: 0, todayCount: 0 });
  });
});
