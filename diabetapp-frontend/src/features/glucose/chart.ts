import { GlucoseReading } from './types';

/**
 * Geometría del gráfico de tendencia (spec fase 15, RF-15.7, D-15.4). Pura: recibe lecturas y
 * el tamaño del lienzo y devuelve coordenadas listas para dibujar con `react-native-svg`.
 */
export interface ChartSize {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface ChartPoint {
  id: string;
  x: number;
  y: number;
  value: number;
  /** Fuera del rango objetivo (se dibuja distinto, no solo con otro color). */
  outOfRange: boolean;
}

export interface ChartModel {
  points: ChartPoint[];
  /** Trazado `M x y L x y …` de la línea; vacío con menos de 2 puntos. */
  path: string;
  /** Banda del rango objetivo (coordenadas y), o `null` si no hay rango. */
  band: { y: number; height: number } | null;
  yTicks: { y: number; label: string }[];
  yDomain: { min: number; max: number };
  /** Texto para lectores de pantalla. */
  description: string;
}

export const MIN_POINTS_FOR_CHART = 2;

const round1 = (value: number): number => Math.round(value * 10) / 10;

export const buildChart = (
  readings: Pick<GlucoseReading, 'id' | 'value' | 'timestamp'>[],
  size: ChartSize,
  target: { min: number | null; max: number | null },
): ChartModel => {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (sorted.length === 0) {
    return {
      points: [],
      path: '',
      band: null,
      yTicks: [],
      yDomain: { min: 0, max: 0 },
      description: 'Sin mediciones en este período',
    };
  }

  const values = sorted.map((reading) => reading.value);
  const candidatesMin = [Math.min(...values), ...(target.min !== null ? [target.min] : [])];
  const candidatesMax = [Math.max(...values), ...(target.max !== null ? [target.max] : [])];
  const yMin = Math.max(0, Math.floor((Math.min(...candidatesMin) - 10) / 10) * 10);
  const yMax = Math.ceil((Math.max(...candidatesMax) + 10) / 10) * 10;

  const innerWidth = size.width - size.padding.left - size.padding.right;
  const innerHeight = size.height - size.padding.top - size.padding.bottom;

  const times = sorted.map((reading) => new Date(reading.timestamp).getTime());
  const tMin = times[0];
  const tSpan = times[times.length - 1] - tMin;

  const toX = (time: number): number =>
    size.padding.left + (tSpan === 0 ? innerWidth / 2 : ((time - tMin) / tSpan) * innerWidth);
  const toY = (value: number): number =>
    size.padding.top + (1 - (value - yMin) / (yMax - yMin)) * innerHeight;

  const points: ChartPoint[] = sorted.map((reading, index) => ({
    id: reading.id,
    x: round1(toX(times[index])),
    y: round1(toY(reading.value)),
    value: reading.value,
    outOfRange:
      (target.min !== null && reading.value < target.min) ||
      (target.max !== null && reading.value > target.max),
  }));

  const path =
    points.length >= MIN_POINTS_FOR_CHART
      ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
      : '';

  const band =
    target.min !== null || target.max !== null
      ? (() => {
          const top = toY(target.max ?? yMax);
          const bottom = toY(target.min ?? yMin);
          return { y: round1(top), height: round1(Math.max(0, bottom - top)) };
        })()
      : null;

  const step = (yMax - yMin) / 3;
  const yTicks = [0, 1, 2, 3].map((i) => {
    const value = Math.round(yMin + step * i);
    return { y: round1(toY(value)), label: String(value) };
  });

  const total = values.reduce((sum, value) => sum + value, 0);
  const description = `Tendencia: ${values.length} ${values.length === 1 ? 'medición' : 'mediciones'}, promedio ${Math.round(total / values.length)} mg/dL, entre ${Math.min(...values)} y ${Math.max(...values)}`;

  return { points, path, band, yTicks, yDomain: { min: yMin, max: yMax }, description };
};
