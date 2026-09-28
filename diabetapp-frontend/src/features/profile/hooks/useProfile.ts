import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '@/src/shared/api/errors';
import { profileApi } from '../api';
import { Profile } from '../types';

type Status = 'loading' | 'success' | 'error';

interface ProfileState {
  status: Status;
  profile: Profile | null;
  errorMessage: string | null;
  offline: boolean;
}

const fetchProfile = async (): Promise<ProfileState> => {
  try {
    return {
      status: 'success',
      profile: await profileApi.get(),
      errorMessage: null,
      offline: false,
    };
  } catch (error) {
    const apiError = toApiError(error);
    return {
      status: 'error',
      profile: null,
      errorMessage: apiError.message,
      offline: apiError.code === 'NETWORK_ERROR',
    };
  }
};

/**
 * Carga el perfil al montar (spec fase 7, RF-7.7, RF-7.12). Quien lo usa decide qué
 * hacer si falla: el formulario de perfil muestra el error; el de glucosa lo ignora.
 */
export const useProfile = () => {
  const [state, setState] = useState<ProfileState>({
    status: 'loading',
    profile: null,
    errorMessage: null,
    offline: false,
  });

  useEffect(() => {
    let active = true;

    void fetchProfile().then((next) => active && setState(next));

    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setState({ status: 'loading', profile: null, errorMessage: null, offline: false });
    setState(await fetchProfile());
  }, []);

  return { ...state, reload };
};
