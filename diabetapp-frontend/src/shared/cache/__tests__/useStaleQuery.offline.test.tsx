import { renderHook, waitFor } from '@testing-library/react-native';
import { useStaleQuery } from '../useStaleQuery';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    useEffect(() => callback(), [callback]);
  },
}));

// El mock global (jest.setup.js) no guarda nada; aquí hace falta un `setItem`/`getItem` con
// estado real para comprobar que lo escrito por la primera carga lo lee la segunda.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
  };
});

describe('useStaleQuery — el servidor no responde, pero ya hay algo guardado', () => {
  it('se queda con lo guardado en vez de mostrar un error', async () => {
    // Primero una carga exitosa dentro de la app, que deja algo en la caché.
    const okFetcher = jest.fn().mockResolvedValue({ value: 'guardado' });
    const first = await renderHook(() => useStaleQuery('k4', okFetcher, () => 'error'));
    await waitFor(() => expect(first.result.current.status).toBe('success'));
    first.unmount();

    // La pantalla se vuelve a abrir (p. ej. el backend de Render está "dormido") y falla.
    const failingFetcher = jest.fn().mockRejectedValue(new Error('sin red'));
    const { result, unmount } = await renderHook(() =>
      useStaleQuery('k4', failingFetcher, () => 'No se pudo conectar'),
    );

    await waitFor(() => expect(failingFetcher).toHaveBeenCalled());
    await waitFor(() => expect(result.current.data).toEqual({ value: 'guardado' }));
    expect(result.current.status).toBe('success');
    expect(result.current.errorMessage).toBeNull();

    unmount();
  });
});
