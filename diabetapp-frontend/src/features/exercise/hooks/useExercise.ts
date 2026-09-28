import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toApiError } from '@/src/shared/api/errors';
import { useToast } from '@/src/shared/components/ui';
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
  offline: boolean;
}

const initialState: ExerciseState = {
  status: 'loading',
  activities: [],
  page: 1,
  totalPages: 1,
  summary: null,
  errorMessage: null,
  offline: false,
};

/**
 * Pantalla «Ejercicio» (spec fase 12, RF-12.9, RF-12.12): historial paginado con
 * «Cargar más», avance de hoy y borrado. Se recarga al recuperar el foco.
 */
export const useExercise = () => {
  const [state, setState] = useState<ExerciseState>(initialState);
  const toast = useToast();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        offline: false,
      });
    } catch (error) {
      const apiError = toApiError(error);
      setState((current) => ({
        ...(current.activities.length > 0 ? current : initialState),
        status: current.activities.length > 0 ? 'success' : 'error',
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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading' }));
    void load();
  }, [load]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await exerciseApi.remove(id);
        toast.show('Actividad borrada');
        await load();
      } catch (error) {
        showError(toApiError(error), 'No se pudo borrar la actividad');
      }
    },
    [load, toast],
  );

  return {
    ...state,
    hasMore: state.page < state.totalPages,
    loadingMore,
    refreshing,
    refresh,
    reload: retry,
    loadMore,
    remove,
  };
};
