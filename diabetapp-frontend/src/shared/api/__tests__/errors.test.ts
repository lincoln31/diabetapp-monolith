import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, toApiError } from '../errors';

const axiosErrorWith = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError('fallo', 'ERR_BAD_REQUEST');
  error.response = {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe('toApiError', () => {
  it('conserva el código, el mensaje y los campos del backend', () => {
    const error = toApiError(
      axiosErrorWith(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          fields: [{ field: 'value', message: 'El valor debe ser un número entero' }],
        },
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.status).toBe(400);
    expect(error.firstFieldMessage).toBe('El valor debe ser un número entero');
  });

  it('marca como NETWORK_ERROR cuando no hubo respuesta', () => {
    const error = toApiError(new AxiosError('sin red', 'ECONNABORTED'));

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toContain('No se pudo conectar');
  });

  it('usa INTERNAL_ERROR ante un error desconocido', () => {
    expect(toApiError(new Error('cualquier cosa')).code).toBe('INTERNAL_ERROR');
  });

  it('no envuelve dos veces un ApiError', () => {
    const original = new ApiError('NOT_FOUND', 'No está');

    expect(toApiError(original)).toBe(original);
  });
});
