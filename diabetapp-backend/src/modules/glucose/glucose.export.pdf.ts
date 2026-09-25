import PDFDocument from 'pdfkit';
import { MomentOfDay } from '@prisma/client';

interface ExportReading {
  value: number;
  timestamp: Date;
  momentOfDay: MomentOfDay;
  notes: string | null;
}

/** Mismas etiquetas que en `glucose.export.csv.ts`. */
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

const COLUMNS = [
  { label: 'Fecha', x: 40, width: 70 },
  { label: 'Hora', x: 110, width: 50 },
  { label: 'Valor', x: 160, width: 50 },
  { label: 'Momento del día', x: 210, width: 140 },
  { label: 'Notas', x: 350, width: 200 },
];
const ROW_HEIGHT = 18;
const PAGE_BOTTOM = 760;

const drawTableHeader = (doc: PDFKit.PDFDocument, y: number): void => {
  doc.font('Helvetica-Bold').fontSize(9);
  for (const column of COLUMNS) {
    doc.text(column.label, column.x, y, { width: column.width });
  }
  doc.font('Helvetica').fontSize(9);
};

/** Reporte PDF del historial completo (spec fase 6, RF-6.6, RF-6.8, D-6.4). */
export const buildGlucosePdf = (
  patientName: string,
  readings: ExportReading[],
): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.fontSize(18).text('Historial de glucosa', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(`Paciente: ${patientName || 'Sin nombre registrado'}`);

  if (readings.length === 0) {
    doc.moveDown();
    doc.text('No hay lecturas registradas.');
    doc.end();
    return doc;
  }

  const first = readings[0].timestamp.toISOString().slice(0, 10);
  const last = readings[readings.length - 1].timestamp.toISOString().slice(0, 10);
  doc.text(`Rango: ${first} — ${last}`);
  doc.text(`Total de lecturas: ${readings.length}`);
  doc.moveDown();

  let y = doc.y;
  drawTableHeader(doc, y);
  y += ROW_HEIGHT;

  for (const reading of readings) {
    if (y > PAGE_BOTTOM) {
      doc.addPage();
      y = 40;
      drawTableHeader(doc, y);
      y += ROW_HEIGHT;
    }

    doc.text(reading.timestamp.toISOString().slice(0, 10), COLUMNS[0].x, y, {
      width: COLUMNS[0].width,
    });
    doc.text(reading.timestamp.toISOString().slice(11, 16), COLUMNS[1].x, y, {
      width: COLUMNS[1].width,
    });
    doc.text(String(reading.value), COLUMNS[2].x, y, { width: COLUMNS[2].width });
    doc.text(MOMENT_OF_DAY_LABELS[reading.momentOfDay], COLUMNS[3].x, y, {
      width: COLUMNS[3].width,
    });
    doc.text(reading.notes ?? '', COLUMNS[4].x, y, { width: COLUMNS[4].width });

    y += ROW_HEIGHT;
  }

  doc.end();
  return doc;
};
