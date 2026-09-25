/** Tipos del contrato de estadísticas de glucosa (spec fase 5, D-5.1, D-5.8). */

export type Trend = 'improving' | 'worsening' | 'stable' | 'no_data';

export interface PeriodStats {
  days: number;
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  trend: Trend;
}

export interface GlucoseStats {
  target: { min: number | null; max: number | null };
  periods: {
    '7': PeriodStats;
    '14': PeriodStats;
    '30': PeriodStats;
  };
}
