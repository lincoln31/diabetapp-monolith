import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '@/src/shared/api/errors';
import { profileApi } from '../api';
import { Profile } from '../types';

type Status = 'loading' | 'success' | 'error';

interface ProfileState {
  status: Status;
  profile: Profile | null;
  errorMessage: string | null;
}

const fetchProfile = async (): Promise<ProfileState> => {
  try {
    return { status: 'success', profile: await profileApi.get(), errorMessage: null };
  } catch (error) {
    return { status: 'error', profile: null, errorMessage: toApiError(error).message };
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
  });

  useEffect(() => {
    let active = true;

    void fetchProfile().then((next) => active && setState(next));

    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setState({ status: 'loading', profile: null, errorMessage: null });
    setState(await fetchProfile());
  }, []);

  return { ...state, reload };
};
