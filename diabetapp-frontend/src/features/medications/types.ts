/** Medicamento activo con las tomas de hoy (spec fase 11, D-11.3). */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes: string | null;
  takenToday: number;
}

export interface MedicationInput {
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes: string | null;
}

export interface AdherencePeriod {
  expected: number;
  taken: number;
  percent: number | null;
}

export interface AdherenceStats {
  days7: AdherencePeriod;
  days30: AdherencePeriod;
}
