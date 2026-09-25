import { MIN_READINGS_FOR_PROJECTION, projectHba1c } from '../src/modules/glucose/glucose.hba1c';

describe('projectHba1c', () => {
  it('devuelve datos insuficientes sin lecturas', () => {
    expect(projectHba1c([])).toEqual({
      average90: null,
      sampleCount: 0,
      sufficientData: false,
      projectedHba1c: null,
    });
  });

  it('devuelve datos insuficientes por debajo del umbral', () => {
    const values = Array(MIN_READINGS_FOR_PROJECTION - 1).fill(120);

    const result = projectHba1c(values);

    expect(result.sufficientData).toBe(false);
    expect(result.average90).toBeNull();
    expect(result.projectedHba1c).toBeNull();
    expect(result.sampleCount).toBe(MIN_READINGS_FOR_PROJECTION - 1);
  });

  it('proyecta HbA1c justo en el umbral', () => {
    const values = Array(MIN_READINGS_FOR_PROJECTION).fill(120);

    const result = projectHba1c(values);

    expect(result.sufficientData).toBe(true);
    expect(result.average90).toBe(120);
    // (120 + 46.7) / 28.7 = 5.8013... -> 5.8
    expect(result.projectedHba1c).toBe(5.8);
  });

  it('calcula el promedio y redondea a un decimal', () => {
    const values = [100, 101, 102, 100, 101, 102, 100, 101, 102, 103];

    const result = projectHba1c(values);

    expect(result.sampleCount).toBe(10);
    expect(result.average90).toBe(101.2);
    // (101.2 + 46.7) / 28.7 = 5.1567... -> 5.2
    expect(result.projectedHba1c).toBe(5.2);
  });
});
