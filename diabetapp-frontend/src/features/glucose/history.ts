import { GlucoseReading } from './types';

/** Lógica pura del historial de glucosa (spec fase 15, D-15.4): resumen y agrupación por día. */

export interface ReadingsSummary {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
}

export const summarizeReadings = (readings: Pick<GlucoseReading, 'value'>[]): ReadingsSummary => {
  if (readings.length === 0) return { count: 0, average: null, min: null, max: null };

  const values = readings.map((reading) => reading.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    count: values.length,
    average: Math.round(total / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** Clave de día en hora local del celular: 'YYYY-MM-DD'. */
export const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const DAY_MS = 86_400_000;

/** «Hoy», «Ayer» o «lun 22 sept». */
export const dayTitle = (day: Date, now: Date): string => {
  const key = localDayKey(day);
  if (key === localDayKey(now)) return 'Hoy';
  if (key === localDayKey(new Date(now.getTime() - DAY_MS))) return 'Ayer';

  return day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
};

export interface DaySection {
  key: string;
  title: string;
  data: GlucoseReading[];
}

/** Agrupa por día local, del más reciente al más antiguo, y ordena cada día por hora descendente. */
export const groupByDay = (readings: GlucoseReading[], now: Date = new Date()): DaySection[] => {
  const sorted = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const sections: DaySection[] = [];

  for (const reading of sorted) {
    const date = new Date(reading.timestamp);
    const key = localDayKey(date);
    const last = sections[sections.length - 1];

    if (last && last.key === key) {
      last.data.push(reading);
    } else {
      sections.push({ key, title: dayTitle(date, now), data: [reading] });
    }
  }

  return sections;
};

export const formatReadingTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

/** «Hoy, 08:05», «Ayer, 21:30» o «lun 22 sept, 08:05». */
export const formatWhen = (iso: string, now: Date = new Date()): string =>
  `${dayTitle(new Date(iso), now)}, ${formatReadingTime(iso)}`;
