import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { useToast } from '@/src/shared/components/ui';
import { medicationsApi } from '../api';
import { Medication } from '../types';

type Status = 'loading' | 'success' | 'error';

interface MedicationsState {
  status: Status;
  medications: Medication[];
  errorMessage: string | null;
  offline: boolean;
}

/**
 * Lista de medicamentos activos (spec fase 11, RF-11.8; fase 15): se recarga al recuperar el
 * foco, `logIntake` registra la toma, confirma con un aviso no bloqueante y refresca los
 * contadores de hoy.
 */
export const useMedications = () => {
  const toast = useToast();
  const [state, setState] = useState<MedicationsState>({
    status: 'loading',
    medications: [],
    errorMessage: null,
    offline: false,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setState({
        status: 'success',
        medications: await medicationsApi.list(),
        errorMessage: null,
        offline: false,
      });
    } catch (error) {
      const apiError = toApiError(error);
      setState((current) => ({
        status: current.medications.length > 0 ? 'success' : 'error',
        medications: current.medications,
        errorMessage: apiError.message,
        offline: apiError.code === 'NETWORK_ERROR',
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading' }));
    void load();
  }, [load]);

  const logIntake = useCallback(
    async (medication: Medication) => {
      setBusyId(medication.id);
      try {
        await medicationsApi.logIntake(medication.id);
        toast.show(`Toma registrada: ${medication.name}`);
        await load();
      } catch (error) {
        toast.show(toApiError(error).message, 'error');
      } finally {
        setBusyId(null);
      }
    },
    [load, toast],
  );

  return { ...state, busyId, refreshing, refresh, reload: retry, logIntake };
};
