/**
 * Lógica pura del cronómetro (spec fase 12, D-12.7). El tiempo se calcula siempre con
 * marcas de tiempo, no acumulando ticks de un intervalo: un `setInterval` se retrasa o
 * se detiene con la app en segundo plano, y las marcas de tiempo no.
 */
export interface StopwatchState {
  /** Marca de tiempo del último «iniciar»; `null` si está en pausa o sin empezar. */
  startedAt: number | null;
  /** Milisegundos acumulados de tramos anteriores. */
  accumulatedMs: number;
}

export const initialStopwatch: StopwatchState = { startedAt: null, accumulatedMs: 0 };

export const isRunning = (state: StopwatchState): boolean => state.startedAt !== null;

export const elapsedMs = (state: StopwatchState, now: number): number =>
  state.accumulatedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));

export const start = (state: StopwatchState, now: number): StopwatchState =>
  isRunning(state) ? state : { startedAt: now, accumulatedMs: state.accumulatedMs };

export const pause = (state: StopwatchState, now: number): StopwatchState => ({
  startedAt: null,
  accumulatedMs: elapsedMs(state, now),
});

/** Minutos a registrar: se redondea hacia arriba y nunca baja de 1. */
export const toMinutes = (ms: number): number => Math.max(1, Math.ceil(ms / 60_000));

/** «mm:ss», o «h:mm:ss» a partir de una hora. */
export const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};
