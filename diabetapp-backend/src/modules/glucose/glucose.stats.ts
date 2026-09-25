import { PeriodStats, Trend } from './glucose.schemas';

export interface ReadingPoint {
  value: number;
  timestamp: Date;
}

const average = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Tendencia de un periodo (spec fase 5, D-5.3): compara el promedio de la primera
 * mitad del periodo contra la segunda, partiendo por la fecha intermedia de la
 * ventana (no por cantidad de lecturas), con ±5 % de margen para "stable".
 */
export const calculateTrend = (
  periodReadings: ReadingPoint[],
  windowStart: Date,
  windowEnd: Date,
): Trend => {
  if (periodReadings.length < 2) {
    return 'no_data';
  }

  const midpoint = new Date((windowStart.getTime() + windowEnd.getTime()) / 2);
  const firstHalf = periodReadings.filter((r) => r.timestamp < midpoint);
  const secondHalf = periodReadings.filter((r) => r.timestamp >= midpoint);

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return 'no_data';
  }

  const avgFirst = average(firstHalf.map((r) => r.value));
  const avgSecond = average(secondHalf.map((r) => r.value));
  const delta = (avgSecond - avgFirst) / avgFirst;

  if (delta <= -0.05) return 'improving';
  if (delta >= 0.05) return 'worsening';
  return 'stable';
};

/** Estadísticas de una ventana de `days` días hasta `now` (spec fase 5, D-5.2). */
export const summarize = (readings: ReadingPoint[], days: number, now: Date): PeriodStats => {
  const windowStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const periodReadings = readings.filter((r) => r.timestamp >= windowStart && r.timestamp <= now);

  if (periodReadings.length === 0) {
    return { days, count: 0, average: null, min: null, max: null, trend: 'no_data' };
  }

  const values = periodReadings.map((r) => r.value);

  return {
    days,
    count: periodReadings.length,
    average: Math.round(average(values) * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    trend: calculateTrend(periodReadings, windowStart, now),
  };
};
