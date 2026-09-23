import { MomentOfDay } from '@prisma/client';

interface ExportReading {
  value: number;
  timestamp: Date;
  momentOfDay: MomentOfDay;
  notes: string | null;
}

/** Mismas etiquetas que `MOMENT_OF_DAY_OPTIONS` del frontend (spec fase 1, RF-1.18). */
const MOMENT_OF_DAY_LABELS: Record<MomentOfDay, string> = {
  BEFORE_BREAKFAST: 'En ayunas',
  AFTER_BREAKFAST: 'Después del desayuno',
  BEFORE_LUNCH: 'Antes del almuerzo',
  AFTER_LUNCH: 'Después del almuerzo',
  BEFORE_DINNER: 'Antes de la cena',
  AFTER_DINNER: 'Después de la cena',
  BEFORE_SLEEP: 'Antes de dormir',
  OTHER: 'Otro momento',
};

const HEADERS = ['Fecha', 'Hora', 'Valor (mg/dL)', 'Momento del día', 'Notas'];

/** Envuelve en comillas si el valor contiene coma, comilla o salto de línea. */
const csvCell = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const csvRow = (cells: string[]): string => cells.map(csvCell).join(',') + '\r\n';

/** Reporte CSV del historial completo (spec fase 6, RF-6.5, RF-6.8, D-6.4). */
export const buildGlucoseCsv = (readings: ExportReading[]): string => {
  let csv = csvRow(HEADERS);

  for (const reading of readings) {
    csv += csvRow([
      reading.timestamp.toISOString().slice(0, 10),
      reading.timestamp.toISOString().slice(11, 16),
      String(reading.value),
      MOMENT_OF_DAY_LABELS[reading.momentOfDay],
      reading.notes ?? '',
    ]);
  }

  return csv;
};
