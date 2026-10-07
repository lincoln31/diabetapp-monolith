import { renderHook, waitFor } from '@testing-library/react-native';
import { useStaleQuery } from '../useStaleQuery';

// `useFocusEffect` real exige un `NavigationContainer`; en estos tests se simula como un
// `useEffect` que corre al montar, igual que hace la pantalla al enfocarse la primera vez.
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    useEffect(() => callback(), [callback]);
  },
}));

describe('useStaleQuery — sin caché previa', () => {
  it('carga normal: termina en success con los datos del servidor', async () => {
    const fetcher = jest.fn().mockResolvedValue({ value: 1 });
    const { result, unmount } = await renderHook(() => useStaleQuery('k1', fetcher, () => 'error'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual({ value: 1 });
    expect(result.current.stale).toBe(false);

    unmount();
  });

  it('si la carga falla no hay nada que mostrar: status error', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('fail'));
    const { result, unmount } = await renderHook(() =>
      useStaleQuery('k2', fetcher, () => 'No se pudo conectar'),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeNull();
    expect(result.current.errorMessage).toBe('No se pudo conectar');

    unmount();
  });
});
