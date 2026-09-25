import { buildGlucosePdf } from '../src/modules/glucose/glucose.export.pdf';

const collectBuffer = (doc: PDFKit.PDFDocument): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

describe('buildGlucosePdf', () => {
  it('genera un PDF válido sin lecturas', async () => {
    const doc = buildGlucosePdf('Ana Pérez', []);
    const buffer = await collectBuffer(doc);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('genera un PDF válido con lecturas', async () => {
    const doc = buildGlucosePdf('Ana Pérez', [
      {
        value: 110,
        timestamp: new Date('2026-09-19T10:00:00.000Z'),
        momentOfDay: 'BEFORE_BREAKFAST',
        notes: 'Antes del desayuno',
      },
    ]);
    const buffer = await collectBuffer(doc);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(0);
  });
});
