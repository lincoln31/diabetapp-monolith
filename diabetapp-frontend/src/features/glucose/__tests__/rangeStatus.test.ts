import { getRangeStatus } from '../rangeStatus';

describe('getRangeStatus', () => {
  it.each([
    [65, 80, 180, 'low'],
    [79, 80, 180, 'low'],
    [80, 80, 180, 'in_range'],
    [120, 80, 180, 'in_range'],
    [180, 80, 180, 'in_range'],
    [181, 80, 180, 'high'],
    [220, 80, 180, 'high'],
  ])('valor %i con rango %i–%i es %s', (value, min, max, expected) => {
    expect(getRangeStatus(value, min, max)).toBe(expected);
  });

  it('no avisa sin ningún límite', () => {
    expect(getRangeStatus(300, null, null)).toBe('unknown');
  });

  it('evalúa contra el único límite definido', () => {
    expect(getRangeStatus(60, 80, null)).toBe('low');
    expect(getRangeStatus(300, 80, null)).toBe('in_range');
    expect(getRangeStatus(300, null, 180)).toBe('high');
    expect(getRangeStatus(60, null, 180)).toBe('in_range');
  });

  it('no avisa con un valor que no es un número', () => {
    expect(getRangeStatus(NaN, 80, 180)).toBe('unknown');
  });
});
