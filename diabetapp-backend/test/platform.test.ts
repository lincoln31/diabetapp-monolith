import { api } from './helpers/api';

describe('Plataforma', () => {
  it('responde al chequeo de salud', async () => {
    const response = await api().get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('devuelve 404 sin listar las rutas disponibles', async () => {
    const response = await api().get('/api/no-existe');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(response.body)).not.toContain('/api/auth');
  });

  it('rechaza un JSON mal formado', async () => {
    const response = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{roto');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza un cuerpo mayor a 100 KB', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'x'.repeat(200_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('no expone la cabecera X-Powered-By', async () => {
    const response = await api().get('/api/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
