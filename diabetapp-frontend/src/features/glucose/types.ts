/** Tipos del contrato de glucosa (specs/fase-1-bases-backend). */

export type MomentOfDay =
  | 'BEFORE_BREAKFAST'
  | 'AFTER_BREAKFAST'
  | 'BEFORE_LUNCH'
  | 'AFTER_LUNCH'
  | 'BEFORE_DINNER'
  | 'AFTER_DINNER'
  | 'BEFORE_SLEEP'
  | 'OTHER';

export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string; // ISO
  momentOfDay: MomentOfDay;
  notes: string | null;
  createdAt: string;
}

export interface CreateGlucoseInput {
  value: number;
  timestamp: string; // ISO
  momentOfDay?: MomentOfDay;
  notes?: string;
}

export interface ListGlucoseParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
