import { calculateAdherence } from '../src/modules/medications/medications.adherence';

const med = (createdDay: string, scheduledPerDay = 2) => ({
  id: 'm1',
  scheduledPerDay,
  createdDay,
});
const taken = (day: string, count: number) => ({ medicationId: 'm1', day, taken: count });

describe('calculateAdherence', () => {
  const today = '2026-09-20';

  it('devuelve porcentaje null sin medicamentos', () => {
    expect(calculateAdherence({ medications: [], intakes: [], today, windowDays: 7 })).toEqual({
      expected: 0,
      taken: 0,
      percent: null,
    });
  });

  it('cuenta la ventana completa de un medicamento antiguo, hoy incluido', () => {
    const result = calculateAdherence({
      medications: [med('2026-08-01')],
      intakes: [taken('2026-09-20', 2), taken('2026-09-19', 1)],
      today,
      windowDays: 7,
    });

    expect(result).toEqual({ expected: 14, taken: 3, percent: 21 });
  });

  it('no penaliza los días anteriores a la creación del medicamento', () => {
    const result = calculateAdherence({
      medications: [med('2026-09-20')],
      intakes: [],
      today,
      windowDays: 30,
    });

    expect(result).toEqual({ expected: 2, taken: 0, percent: 0 });
  });

  it('limita las tomas de un día a los horarios: nunca supera el 100 %', () => {
    const result = calculateAdherence({
      medications: [med('2026-09-20')],
      intakes: [taken('2026-09-20', 5)],
      today,
      windowDays: 7,
    });

    expect(result).toEqual({ expected: 2, taken: 2, percent: 100 });
  });

  it('las tomas de más de un día no compensan las que faltan en otro', () => {
    const result = calculateAdherence({
      medications: [med('2026-09-19')],
      intakes: [taken('2026-09-19', 4)],
      today,
      windowDays: 7,
    });

    expect(result).toEqual({ expected: 4, taken: 2, percent: 50 });
  });

  it('ignora las tomas fuera de la ventana', () => {
    const result = calculateAdherence({
      medications: [med('2026-08-01', 1)],
      intakes: [taken('2026-09-10', 1)],
      today,
      windowDays: 7,
    });

    expect(result.taken).toBe(0);
    expect(result.expected).toBe(7);
  });
});
