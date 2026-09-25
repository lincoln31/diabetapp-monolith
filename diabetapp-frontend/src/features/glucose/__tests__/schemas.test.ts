import { createGlucoseFormSchema } from '../schemas';

const valido = {
  value: '110',
  momentOfDay: 'BEFORE_BREAKFAST' as const,
  notes: 'Antes del desayuno',
  timestamp: new Date('2026-09-19T10:00:00.000Z'),
};

describe('createGlucoseFormSchema', () => {
  it('acepta una lectura válida', () => {
    expect(createGlucoseFormSchema.safeParse(valido).success).toBe(true);
  });

  it.each([
    ['vacío', ''],
    ['no numérico', 'abc'],
    ['decimal', '110.5'],
    ['por debajo del rango', '19'],
    ['por encima del rango', '601'],
  ])('rechaza un valor %s', (_caso, value) => {
    expect(createGlucoseFormSchema.safeParse({ ...valido, value }).success).toBe(false);
  });

  it('acepta los extremos del rango', () => {
    expect(createGlucoseFormSchema.safeParse({ ...valido, value: '20' }).success).toBe(true);
    expect(createGlucoseFormSchema.safeParse({ ...valido, value: '600' }).success).toBe(true);
  });

  it('rechaza un momento del día que no existe en el backend', () => {
    const result = createGlucoseFormSchema.safeParse({ ...valido, momentOfDay: 'ayunas' });

    expect(result.success).toBe(false);
  });

  it('rechaza notas de más de 200 caracteres', () => {
    const result = createGlucoseFormSchema.safeParse({ ...valido, notes: 'x'.repeat(201) });

    expect(result.success).toBe(false);
  });
});
