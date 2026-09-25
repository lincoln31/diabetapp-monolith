/**
 * Comprueba RF-2.19: si varias peticiones caducan a la vez, la app renueva
 * el token UNA sola vez y repite todas con el token nuevo.
 *
 * Los módulos se cargan con `require` dentro del test para que el adaptador
 * simulado exista antes de que el cliente cree su instancia de axios.
 */
describe('cliente HTTP: renovación única', () => {
  it('con tres peticiones caducadas hace un solo refresh y las repite', async () => {
    jest.resetModules();

    /* eslint-disable @typescript-eslint/no-require-imports */
    const axios = require('axios').default;
    const MockAdapter = require('axios-mock-adapter');
    const { setTokens } = require('../../session/tokenStorage');
    /* eslint-enable @typescript-eslint/no-require-imports */

    const adapter = new MockAdapter(axios);
    let refreshCalls = 0;
    let glucoseCalls = 0;

    adapter.onPost('/auth/refresh').reply(() => {
      refreshCalls += 1;
      return [200, { success: true, data: { accessToken: 'nuevo', refreshToken: 'r2' } }];
    });

    adapter.onGet('/glucose').reply((config: { headers?: Record<string, string> }) => {
      glucoseCalls += 1;

      if (config.headers?.Authorization === 'Bearer nuevo') {
        return [
          200,
          { success: true, data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } },
        ];
      }

      return [
        401,
        { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Tu sesión expiró' } },
      ];
    });

    await setTokens({ accessToken: 'viejo', refreshToken: 'r1' });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPaginated } = require('../client');

    const resultados = await Promise.all([
      getPaginated('/glucose'),
      getPaginated('/glucose'),
      getPaginated('/glucose'),
    ]);

    expect(resultados).toHaveLength(3);
    expect(refreshCalls).toBe(1); // Una sola renovación para las tres
    expect(glucoseCalls).toBe(6); // 3 fallidas + 3 repetidas
  });
});
