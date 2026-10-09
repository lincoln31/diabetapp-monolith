import { buildChart } from '../chart';
import { groupByDay, summarizeReadings } from '../history';
import { suggestMomentOfDay } from '../momentOfDay';
import { GlucoseReading } from '../types';

const reading = (id: string, value: number, iso: string): GlucoseReading => ({
  id,
  value,
  timestamp: iso,
  momentOfDay: 'OTHER',
  notes: null,
  insulinUnits: null,
  createdAt: iso,
});

// Fechas construidas en hora local para que el agrupado no dependa de la zona horaria del CI
const at = (day: number, hour: number, minute = 0): string =>
  new Date(2026, 8, day, hour, minute).toISOString();

describe('suggestMomentOfDay', () => {
  it.each([
    [8, 'BEFORE_BREAKFAST'],
    [10, 'AFTER_BREAKFAST'],
    [12, 'BEFORE_LUNCH'],
    [14, 'AFTER_LUNCH'],
    [17, 'BEFORE_DINNER'],
    [20, 'AFTER_DINNER'],
    [22, 'BEFORE_SLEEP'],
    [3, 'BEFORE_SLEEP'],
  ])('a las %s h propone %s', (hour, expected) => {
    expect(suggestMomentOfDay(new Date(2026, 8, 26, hour, 30))).toBe(expected);
  });

  it('a las 8:00 (caso CA-15.9) propone en ayunas', () => {
    expect(suggestMomentOfDay(new Date(2026, 8, 26, 8, 0))).toBe('BEFORE_BREAKFAST');
  });
});

describe('summarizeReadings', () => {
  it('sin mediciones no inventa números', () => {
    expect(summarizeReadings([])).toEqual({ count: 0, average: null, min: null, max: null });
  });

  it('calcula promedio redondeado, mínimo y máximo', () => {
    expect(summarizeReadings([{ value: 100 }, { value: 111 }, { value: 140 }])).toEqual({
      count: 3,
      average: 117,
      min: 100,
      max: 140,
    });
  });
});

describe('groupByDay', () => {
  const now = new Date(2026, 8, 26, 15, 0);

  it('agrupa por día local, del más reciente al más antiguo, y ordena cada día por hora', () => {
    const sections = groupByDay(
      [
        reading('a', 100, at(26, 8)),
        reading('b', 120, at(25, 21)),
        reading('c', 110, at(26, 13)),
        reading('d', 90, at(20, 9)),
      ],
      now,
    );

    expect(sections.map((s) => s.data.map((r) => r.id))).toEqual([['c', 'a'], ['b'], ['d']]);
  });

  it('titula Hoy y Ayer', () => {
    const sections = groupByDay(
      [reading('a', 100, at(26, 8)), reading('b', 120, at(25, 21)), reading('d', 90, at(20, 9))],
      now,
    );

    expect(sections[0].title).toBe('Hoy');
    expect(sections[1].title).toBe('Ayer');
    expect(sections[2].title).not.toBe('Hoy');
  });

  it('con una lista vacía devuelve cero secciones', () => {
    expect(groupByDay([], now)).toEqual([]);
  });
});

describe('buildChart', () => {
  const size = { width: 300, height: 160, padding: { top: 8, right: 8, bottom: 8, left: 8 } };
  const target = { min: 80, max: 180 };

  it('sin lecturas no dibuja nada y lo describe', () => {
    const chart = buildChart([], size, target);

    expect(chart.points).toEqual([]);
    expect(chart.path).toBe('');
    expect(chart.description).toBe('Sin mediciones en este período');
  });

  it('con una sola lectura hay un punto centrado y ninguna línea', () => {
    const chart = buildChart([reading('a', 100, at(26, 8))], size, target);

    expect(chart.points).toHaveLength(1);
    expect(chart.points[0].x).toBe(150);
    expect(chart.path).toBe('');
  });

  it('ordena por hora, dibuja una línea y coloca los valores altos más arriba', () => {
    const chart = buildChart(
      [reading('b', 200, at(26, 12)), reading('a', 90, at(26, 8)), reading('c', 120, at(26, 16))],
      size,
      target,
    );

    expect(chart.points.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(chart.path.startsWith('M ')).toBe(true);
    expect(chart.points[1].y).toBeLessThan(chart.points[0].y);
    expect(chart.points[0].x).toBeLessThan(chart.points[2].x);
  });

  it('marca como fuera de rango los valores fuera del objetivo', () => {
    const chart = buildChart(
      [reading('a', 60, at(26, 8)), reading('b', 120, at(26, 12)), reading('c', 200, at(26, 16))],
      size,
      target,
    );

    expect(chart.points.map((p) => p.outOfRange)).toEqual([true, false, true]);
  });

  it('incluye la banda del rango objetivo y la describe con promedio y extremos', () => {
    const chart = buildChart(
      [reading('a', 100, at(26, 8)), reading('b', 140, at(26, 12))],
      size,
      target,
    );

    expect(chart.band).not.toBeNull();
    expect(chart.band!.height).toBeGreaterThan(0);
    expect(chart.description).toBe('Tendencia: 2 mediciones, promedio 120 mg/dL, entre 100 y 140');
  });

  it('sin rango objetivo no hay banda', () => {
    const chart = buildChart([reading('a', 100, at(26, 8))], size, { min: null, max: null });

    expect(chart.band).toBeNull();
  });
});
