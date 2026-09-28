/** API pública de la funcionalidad de actividad física (spec fase 12, D-12.6). */
export { exerciseApi } from './api';
export { useExerciseSummary } from './hooks/useExerciseSummary';
export { default as ExerciseSummaryCard } from './components/ExerciseSummaryCard';
export { default as ExerciseScreen } from './screens/ExerciseScreen';
export { default as ExerciseFormScreen } from './screens/ExerciseFormScreen';
export { default as StopwatchScreen } from './screens/StopwatchScreen';
export type { ExerciseSummary, ExerciseActivity } from './types';
