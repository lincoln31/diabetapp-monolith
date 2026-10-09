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
  /** Unidades de insulina rápida aplicadas junto a esta lectura (spec fase 19). */
  insulinUnits: number | null;
  createdAt: string;
}

export interface CreateGlucoseInput {
  value: number;
  timestamp: string; // ISO
  momentOfDay?: MomentOfDay;
  notes?: string;
  insulinUnits?: number;
}

export interface ListGlucoseParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
