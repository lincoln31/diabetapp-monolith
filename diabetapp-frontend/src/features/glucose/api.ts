import { del, get, getPaginated, post, put } from '@/src/shared/api/client';
import { CreateGlucoseInput, GlucoseReading, ListGlucoseParams } from './types';

/** Todas las llamadas de glucosa (spec fase 3, RF-3.6). */
export const glucoseApi = {
  list: (params: ListGlucoseParams = {}) =>
    getPaginated<GlucoseReading>('/glucose', { params }),

  getById: (id: string) => get<GlucoseReading>(`/glucose/${id}`),

  create: (input: CreateGlucoseInput) => post<GlucoseReading>('/glucose', input),

  update: (id: string, input: Partial<CreateGlucoseInput>) =>
    put<GlucoseReading>(`/glucose/${id}`, input),

  remove: (id: string) => del<null>(`/glucose/${id}`),
};
