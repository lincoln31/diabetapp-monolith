import { buildGlucoseCsv } from '../src/modules/glucose/glucose.export.csv';

describe('buildGlucoseCsv', () => {
  it('devuelve solo los encabezados sin lecturas', () => {
    const csv = buildGlucoseCsv([]);

    expect(csv).toBe('Fecha,Hora,Valor (mg/dL),Momento del día,Notas\r\n');
  });

  it('agrega una fila por lectura con las columnas esperadas', () => {
    const csv = buildGlucoseCsv([
      {
        value: 110,
        timestamp: new Date('2026-09-19T10:05:00.000Z'),
        momentOfDay: 'BEFORE_BREAKFAST',
        notes: null,
      },
    ]);

    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('2026-09-19,10:05,110,En ayunas,');
  });

  it('escapa comas y comillas en las notas', () => {
    const csv = buildGlucoseCsv([
      {
        value: 120,
        timestamp: new Date('2026-09-19T10:00:00.000Z'),
        momentOfDay: 'OTHER',
        notes: 'Comí pizza, con "extra" queso',
      },
    ]);

    const lines = csv.trim().split('\r\n');
    expect(lines[1]).toBe('2026-09-19,10:00,120,Otro momento,"Comí pizza, con ""extra"" queso"');
  });
});
