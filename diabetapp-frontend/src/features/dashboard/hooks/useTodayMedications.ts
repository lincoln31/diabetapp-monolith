import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { useToast } from '@/src/shared/components/ui';
import { medicationsApi } from '@/src/features/medications';
import type { Medication } from '@/src/features/medications';

type Status = 'loading' | 'success' | 'error';

interface TodayState {
  status: Status;
  medications: Medication[];
  errorMessage: string | null;
}

/**
 * Medicación de hoy para «Hoy» (spec fase 15, RF-15.4): permite marcar una toma sin salir de la
 * pantalla y refresca los contadores.
 */
export const useTodayMedications = () => {
  const toast = useToast();
  const [state, setState] = useState<TodayState>({
    status: 'loading',
    medications: [],
    errorMessage: null,
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState({ status: 'success', medications: await medicationsApi.list(), errorMessage: null });
    } catch (error) {
      setState((current) => ({
        status: 'error',
        medications: current.medications,
        errorMessage: toApiError(error).message,
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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

  return { ...state, busyId, refresh: load, logIntake };
};
