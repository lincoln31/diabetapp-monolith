import { useCallback, useState } from 'react';
import { toApiError } from '@/src/shared/api/errors';
import { useToast } from '@/src/shared/components/ui';
import { useStaleQuery } from '@/src/shared/cache/useStaleQuery';
import { medicationsApi } from '@/src/features/medications';
import type { Medication } from '@/src/features/medications';

const CACHE_KEY = 'dashboard.todayMedications';

/**
 * Medicación de hoy para «Hoy» (spec fase 15, RF-15.4; con caché local desde la fase 18):
 * permite marcar una toma sin salir de la pantalla y refresca los contadores.
 */
export const useTodayMedications = () => {
  const toast = useToast();
  const query = useStaleQuery<Medication[]>(
    CACHE_KEY,
    () => medicationsApi.list(),
    (error) => toApiError(error).message,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const logIntake = useCallback(
    async (medication: Medication) => {
      setBusyId(medication.id);
      try {
        await medicationsApi.logIntake(medication.id);
        toast.show(`Toma registrada: ${medication.name}`);
        await query.refresh();
      } catch (error) {
        toast.show(toApiError(error).message, 'error');
      } finally {
        setBusyId(null);
      }
    },
    [query, toast],
  );

  return {
    status: query.status,
    medications: query.data ?? [],
    errorMessage: query.errorMessage,
    stale: query.stale,
    busyId,
    refresh: query.refresh,
    logIntake,
  };
};
