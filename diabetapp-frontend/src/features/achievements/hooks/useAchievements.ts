import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '@/src/shared/api/errors';
import { achievementsApi } from '../api';
import { Achievement } from '../types';

type Status = 'loading' | 'success' | 'error';

interface AchievementsState {
  status: Status;
  achievements: Achievement[] | null;
  errorMessage: string | null;
  offline: boolean;
}

const fetchAchievements = async (): Promise<AchievementsState> => {
  try {
    const { achievements } = await achievementsApi.list();
    return { status: 'success', achievements, errorMessage: null, offline: false };
  } catch (error) {
    const apiError = toApiError(error);
    return {
      status: 'error',
      achievements: null,
      errorMessage: apiError.message,
      offline: apiError.code === 'NETWORK_ERROR',
    };
  }
};

/**
 * Carga los logros al montar (spec fase 9, RF-9.6, RF-9.9). Sin `RefreshControl`
 * ni refresco por foco: el catálogo solo cambia cuando el paciente registra o
 * pasa el tiempo, así que basta con recargar al entrar (D-9.5).
 */
export const useAchievements = () => {
  const [state, setState] = useState<AchievementsState>({
    status: 'loading',
    achievements: null,
    errorMessage: null,
    offline: false,
  });

  useEffect(() => {
    let active = true;

    void fetchAchievements().then((next) => active && setState(next));

    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setState({ status: 'loading', achievements: null, errorMessage: null, offline: false });
    setState(await fetchAchievements());
  }, []);

  return { ...state, reload };
};
