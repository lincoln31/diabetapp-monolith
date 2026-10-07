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

describe('useStaleQuery — reabrir la pantalla con algo guardado', () => {
  it('se ve de inmediato lo guardado mientras el servidor tarda, y se reemplaza al responder', async () => {
    const fetcher = jest.fn().mockResolvedValue({ value: 'fresco' });
    const first = await renderHook(() => useStaleQuery('k3', fetcher, () => 'error'));
    await waitFor(() => expect(first.result.current.status).toBe('success'));
    first.unmount();

    // Segunda "apertura de pantalla": el backend tarda (simula el cold start de Render).
    let resolveSecondFetch: (value: { value: string }) => void = () => {};
    const slowFetcher = jest.fn(
      () => new Promise<{ value: string }>((resolve) => (resolveSecondFetch = resolve)),
    );
    const { result, unmount } = await renderHook(() =>
      useStaleQuery('k3', slowFetcher, () => 'error'),
    );

    // No se ve el spinner: ya hay datos de la caché desde el primer momento.
    await waitFor(() => expect(result.current.data).toEqual({ value: 'fresco' }));
    expect(result.current.status).toBe('success');
    expect(result.current.stale).toBe(true);

    resolveSecondFetch({ value: 'actualizado' });
    await waitFor(() => expect(result.current.stale).toBe(false));
    expect(result.current.data).toEqual({ value: 'actualizado' });

    unmount();
  });
});
