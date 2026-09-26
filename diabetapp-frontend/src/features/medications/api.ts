import { del, get, post, put } from '@/src/shared/api/client';
import { AdherenceStats, Medication, MedicationInput } from './types';

/** Todas las llamadas de medicación (spec fase 11, D-11.3). */
export const medicationsApi = {
  list: async () => (await get<{ medications: Medication[] }>('/medications')).medications,

  create: (input: MedicationInput) => post<Medication>('/medications', input),

  update: (id: string, input: MedicationInput) => put<Medication>(`/medications/${id}`, input),

  archive: (id: string) => del<null>(`/medications/${id}`),

  logIntake: (id: string) => post<{ id: string }>(`/medications/${id}/intakes`, {}),

  getAdherence: () => get<AdherenceStats>('/medications/adherence'),
};
