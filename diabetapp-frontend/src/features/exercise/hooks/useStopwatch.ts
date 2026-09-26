import { useCallback, useEffect, useState } from 'react';
import {
  StopwatchState,
  elapsedMs,
  initialStopwatch,
  isRunning,
  pause as pauseState,
  start as startState,
} from '../timer';

/**
 * Cronómetro de la pantalla (spec fase 12, RF-12.11): el estado son marcas de tiempo
 * y el intervalo de 1 s solo repinta; el valor mostrado sale siempre de `Date.now()`.
 */
export const useStopwatch = () => {
  const [state, setState] = useState<StopwatchState>(initialStopwatch);
  const [now, setNow] = useState(() => Date.now());
  const running = isRunning(state);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((current) => startState(current, at));
  }, []);

  const pause = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((current) => pauseState(current, at));
  }, []);

  /** Milisegundos hasta este instante, sin esperar al siguiente repintado. */
  const finish = useCallback((): number => elapsedMs(state, Date.now()), [state]);

  // En pausa `elapsedMs` ignora `now`; corriendo, `now` se refresca cada segundo
  return { running, elapsed: elapsedMs(state, now), start, pause, finish };
};
