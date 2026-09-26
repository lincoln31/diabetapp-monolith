import { del, get, getPaginated, post } from '@/src/shared/api/client';
import { CreateExerciseInput, ExerciseActivity, ExerciseSummary } from './types';

/** Todas las llamadas de actividad física (spec fase 12, D-12.3). */
export const exerciseApi = {
  list: (page = 1, limit = 20) =>
    getPaginated<ExerciseActivity>('/exercise', { params: { page, limit } }),

  create: (input: CreateExerciseInput) => post<ExerciseActivity>('/exercise', input),

  remove: (id: string) => del<null>(`/exercise/${id}`),

  getSummary: () => get<ExerciseSummary>('/exercise/summary'),
};
