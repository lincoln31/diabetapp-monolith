import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { showError } from '@/src/shared/utils/showError';
import { medicationsApi } from '../api';
import { Medication } from '../types';

type Status = 'loading' | 'success' | 'error';

interface MedicationsState {
  status: Status;
  medications: Medication[];
  errorMessage: string | null;
}

/**
 * Lista de medicamentos activos (spec fase 11, RF-11.8): se recarga al recuperar el
 * foco y `logIntake` registra la toma y refresca los contadores de hoy.
 */
export const useMedications = () => {
  const [state, setState] = useState<MedicationsState>({
    status: 'loading',
    medications: [],
    errorMessage: null,
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState({ status: 'success', medications: await medicationsApi.list(), errorMessage: null });
    } catch (error) {
      setState({ status: 'error', medications: [], errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const logIntake = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await medicationsApi.logIntake(id);
        await load();
      } catch (error) {
        showError(toApiError(error), 'No se pudo registrar la toma');
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return { ...state, busyId, reload: load, logIntake };
};
