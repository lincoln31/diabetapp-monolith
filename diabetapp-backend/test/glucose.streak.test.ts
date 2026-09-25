import { calculateStreaks } from '../src/modules/glucose/glucose.streak';

describe('calculateStreaks', () => {
  const today = '2026-09-24';

  it('devuelve 0 sin días', () => {
    expect(calculateStreaks([], today)).toEqual({ current: 0, longest: 0 });
  });

  it('cuenta hoy, ayer y anteayer como 3 días seguidos', () => {
    expect(calculateStreaks(['2026-09-24', '2026-09-23', '2026-09-22'], today)).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('mantiene viva la racha si hoy aún no tiene lecturas', () => {
    expect(calculateStreaks(['2026-09-23', '2026-09-22'], today)).toEqual({
      current: 2,
      longest: 2,
    });
  });

  it('rompe la racha si ni hoy ni ayer tienen lecturas, pero conserva la mejor', () => {
    expect(calculateStreaks(['2026-09-22', '2026-09-20'], today)).toEqual({
      current: 0,
      longest: 1,
    });
  });

  it('distingue la racha actual de la mejor racha pasada', () => {
    const days = [
      '2026-09-24',
      '2026-09-23',
      '2026-09-15',
      '2026-09-14',
      '2026-09-13',
      '2026-09-12',
      '2026-09-11',
    ];

    expect(calculateStreaks(days, today)).toEqual({ current: 2, longest: 5 });
  });

  it('cuenta una sola vez los días repetidos y no depende del orden', () => {
    const days = ['2026-09-23', '2026-09-24', '2026-09-24', '2026-09-23'];

    expect(calculateStreaks(days, today)).toEqual({ current: 2, longest: 2 });
  });

  it('une dos rachas cuando se rellena el hueco', () => {
    const conHueco = ['2026-09-24', '2026-09-23', '2026-09-21', '2026-09-20'];
    const sinHueco = [...conHueco, '2026-09-22'];

    expect(calculateStreaks(conHueco, today)).toEqual({ current: 2, longest: 2 });
    expect(calculateStreaks(sinHueco, today)).toEqual({ current: 5, longest: 5 });
  });

  it('cruza el fin de mes y de año', () => {
    expect(calculateStreaks(['2026-01-01', '2025-12-31', '2025-12-30'], '2026-01-01')).toEqual({
      current: 3,
      longest: 3,
    });
    expect(calculateStreaks(['2026-03-01', '2026-02-28'], '2026-03-01').current).toBe(2);
  });
});
