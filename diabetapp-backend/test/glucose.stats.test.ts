import { calculateTrend, ReadingPoint, summarize } from '../src/modules/glucose/glucose.stats';

const reading = (value: number, isoTimestamp: string): ReadingPoint => ({
  value,
  timestamp: new Date(isoTimestamp),
});

describe('calculateTrend', () => {
  const windowStart = new Date('2026-09-01T00:00:00.000Z');
  const windowEnd = new Date('2026-09-08T00:00:00.000Z'); // ventana de 7 días, medio: 04T12:00

  it('devuelve no_data con menos de dos lecturas', () => {
    expect(calculateTrend([], windowStart, windowEnd)).toBe('no_data');
    expect(calculateTrend([reading(120, '2026-09-02T00:00:00.000Z')], windowStart, windowEnd)).toBe(
      'no_data',
    );
  });

  it('devuelve no_data si una de las mitades queda vacía', () => {
    const readings = [reading(120, '2026-09-01T01:00:00.000Z'), reading(130, '2026-09-01T02:00:00.000Z')];

    expect(calculateTrend(readings, windowStart, windowEnd)).toBe('no_data');
  });

  it('devuelve improving cuando el promedio baja más de 5 %', () => {
    const readings = [
      reading(200, '2026-09-02T00:00:00.000Z'), // primera mitad
      reading(200, '2026-09-03T00:00:00.000Z'), // primera mitad
      reading(100, '2026-09-06T00:00:00.000Z'), // segunda mitad
      reading(100, '2026-09-07T00:00:00.000Z'), // segunda mitad
    ];

    expect(calculateTrend(readings, windowStart, windowEnd)).toBe('improving');
  });

  it('devuelve worsening cuando el promedio sube más de 5 %', () => {
    const readings = [
      reading(100, '2026-09-02T00:00:00.000Z'),
      reading(100, '2026-09-03T00:00:00.000Z'),
      reading(200, '2026-09-06T00:00:00.000Z'),
      reading(200, '2026-09-07T00:00:00.000Z'),
    ];

    expect(calculateTrend(readings, windowStart, windowEnd)).toBe('worsening');
  });

  it('devuelve stable dentro del margen de ±5 %', () => {
    const readings = [
      reading(100, '2026-09-02T00:00:00.000Z'),
      reading(100, '2026-09-03T00:00:00.000Z'),
      reading(104, '2026-09-06T00:00:00.000Z'), // +4 %: dentro del margen
      reading(104, '2026-09-07T00:00:00.000Z'),
    ];

    expect(calculateTrend(readings, windowStart, windowEnd)).toBe('stable');
  });

  it('trata exactamente ±5 % como el extremo correspondiente, no como stable', () => {
    const mejora = [
      reading(100, '2026-09-02T00:00:00.000Z'),
      reading(100, '2026-09-03T00:00:00.000Z'),
      reading(95, '2026-09-06T00:00:00.000Z'), // exactamente -5 %
      reading(95, '2026-09-07T00:00:00.000Z'),
    ];
    const empeora = [
      reading(100, '2026-09-02T00:00:00.000Z'),
      reading(100, '2026-09-03T00:00:00.000Z'),
      reading(105, '2026-09-06T00:00:00.000Z'), // exactamente +5 %
      reading(105, '2026-09-07T00:00:00.000Z'),
    ];

    expect(calculateTrend(mejora, windowStart, windowEnd)).toBe('improving');
    expect(calculateTrend(empeora, windowStart, windowEnd)).toBe('worsening');
  });
});

describe('summarize', () => {
  const now = new Date('2026-09-22T12:00:00.000Z');

  it('devuelve valores nulos y no_data sin lecturas en el periodo', () => {
    expect(summarize([], 7, now)).toEqual({
      days: 7,
      count: 0,
      average: null,
      min: null,
      max: null,
      trend: 'no_data',
    });
  });

  it('calcula count, average, min y max de las lecturas dentro de la ventana', () => {
    const readings = [
      reading(100, '2026-09-20T10:00:00.000Z'),
      reading(150, '2026-09-21T10:00:00.000Z'),
      reading(50, '2026-08-01T10:00:00.000Z'), // fuera de la ventana de 7 días
    ];

    const stats = summarize(readings, 7, now);

    expect(stats.count).toBe(2);
    expect(stats.average).toBe(125);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(150);
  });

  it('incluye el límite exacto del día 7 pero no el día 8', () => {
    const dentro = reading(110, '2026-09-15T12:00:00.000Z'); // exactamente hace 7 días
    const fuera = reading(120, '2026-09-14T11:59:59.000Z'); // más de 7 días

    const stats = summarize([dentro, fuera], 7, now);

    expect(stats.count).toBe(1);
    expect(stats.average).toBe(110);
  });
});
