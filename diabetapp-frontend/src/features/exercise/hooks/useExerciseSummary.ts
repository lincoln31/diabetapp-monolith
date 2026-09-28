import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { exerciseApi } from '../api';
import { ExerciseSummary } from '../types';

type Status = 'loading' | 'success' | 'error';

interface SummaryState {
  status: Status;
  summary: ExerciseSummary | null;
  errorMessage: string | null;
}

/** Estado de la tarjeta de ejercicio (spec fase 12, D-12.8): mismo patrón que `useStreak`. */
export const useExerciseSummary = () => {
  const [state, setState] = useState<SummaryState>({
    status: 'loading',
    summary: null,
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const summary = await exerciseApi.getSummary();
      setState({ status: 'success', summary, errorMessage: null });
    } catch (error) {
      setState({ status: 'error', summary: null, errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, refresh: load };
};
