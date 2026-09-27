import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ErrorView, LoadingView, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { glucoseApi } from '../api';
import GlucoseForm from '../components/GlucoseForm';
import { GlucoseReading } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; offline: boolean }
  | { status: 'success'; reading: GlucoseReading };

const fetchReading = async (id: string): Promise<State> => {
  try {
    return { status: 'success', reading: await glucoseApi.getById(id) };
  } catch (error) {
    const apiError = toApiError(error);
    return {
      status: 'error',
      message: apiError.message,
      offline: apiError.code === 'NETWORK_ERROR',
    };
  }
};

/** Editar o borrar una medición (spec fase 15, RF-15.6): carga la medición por su id. */
const GlucoseEditScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    void fetchReading(id).then((next) => active && setState(next));

    return () => {
      active = false;
    };
  }, [id, attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  };

  if (state.status === 'success') {
    return <GlucoseForm reading={state.reading} />;
  }

  return (
    <Screen header={<ScreenHeader title="Editar medición" safeTop={false} />}>
      {state.status === 'loading' ? (
        <LoadingView />
      ) : (
        <ErrorView message={state.message} offline={state.offline} onRetry={retry} />
      )}
    </Screen>
  );
};

export default GlucoseEditScreen;
