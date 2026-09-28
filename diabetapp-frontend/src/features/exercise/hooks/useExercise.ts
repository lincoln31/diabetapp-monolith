import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { showError } from '@/src/shared/utils/showError';
import { exerciseApi } from '../api';
import { ExerciseActivity, ExerciseSummary } from '../types';

type Status = 'loading' | 'success' | 'error';

interface ExerciseState {
  status: Status;
  activities: ExerciseActivity[];
  page: number;
  totalPages: number;
  summary: ExerciseSummary | null;
  errorMessage: string | null;
}

const initialState: ExerciseState = {
  status: 'loading',
  activities: [],
  page: 1,
  totalPages: 1,
  summary: null,
  errorMessage: null,
};

/**
 * Pantalla «Ejercicio» (spec fase 12, RF-12.9, RF-12.12): historial paginado con
 * «Cargar más», avance de hoy y borrado. Se recarga al recuperar el foco.
 */
export const useExercise = () => {
  const [state, setState] = useState<ExerciseState>(initialState);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ items, meta }, summary] = await Promise.all([
        exerciseApi.list(1),
        exerciseApi.getSummary(),
      ]);
      setState({
        status: 'success',
        activities: items,
        page: meta.page,
        totalPages: meta.totalPages,
        summary,
        errorMessage: null,
      });
    } catch (error) {
      setState({ ...initialState, status: 'error', errorMessage: toApiError(error).message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || state.page >= state.totalPages) return;

    setLoadingMore(true);
    try {
      const { items, meta } = await exerciseApi.list(state.page + 1);
      setState((current) => ({
        ...current,
        activities: [...current.activities, ...items],
        page: meta.page,
        totalPages: meta.totalPages,
      }));
    } catch (error) {
      showError(toApiError(error), 'No se pudo cargar más');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, state.page, state.totalPages]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await exerciseApi.remove(id);
        await load();
      } catch (error) {
        showError(toApiError(error), 'No se pudo borrar la actividad');
      }
    },
    [load],
  );

  return {
    ...state,
    hasMore: state.page < state.totalPages,
    loadingMore,
    reload: load,
    loadMore,
    remove,
  };
};
