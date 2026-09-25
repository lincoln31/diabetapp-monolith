import React from 'react';
import { render } from '@testing-library/react-native';
import GlucoseAveragesCard from '../GlucoseAveragesCard';
import { GlucoseStats, PeriodStats } from '../../types';

const period = (overrides: Partial<PeriodStats> = {}): PeriodStats => ({
  days: 7,
  count: 5,
  average: 120,
  min: 90,
  max: 150,
  trend: 'stable',
  ...overrides,
});

const stats = (overrides: Partial<GlucoseStats> = {}): GlucoseStats => ({
  target: { min: 80, max: 180 },
  periods: { '7': period(), '14': period({ days: 14 }), '30': period({ days: 30 }) },
  ...overrides,
});

describe('GlucoseAveragesCard', () => {
  it('marca el promedio como dentro del rango cuando cae dentro del objetivo', async () => {
    const { getByText } = await render(<GlucoseAveragesCard stats={stats()} />);

    expect(getByText('Dentro del rango')).toBeTruthy();
  });

  it('marca el promedio como fuera del rango cuando lo supera', async () => {
    const data = stats({
      periods: { '7': period({ average: 200 }), '14': period(), '30': period() },
    });

    const { getByText } = await render(<GlucoseAveragesCard stats={data} />);

    expect(getByText('Fuera del rango')).toBeTruthy();
  });

  it('no muestra la marca de rango si el usuario no tiene rango meta', async () => {
    const data = stats({ target: { min: null, max: null } });

    const { queryByText } = await render(<GlucoseAveragesCard stats={data} />);

    expect(queryByText('Dentro del rango')).toBeNull();
    expect(queryByText('Fuera del rango')).toBeNull();
  });

  it('muestra la tendencia de los periodos de 14 y 30 días', async () => {
    const data = stats({
      periods: {
        '7': period(),
        '14': period({ days: 14, trend: 'improving' }),
        '30': period({ days: 30, trend: 'worsening' }),
      },
    });

    const { getByText } = await render(<GlucoseAveragesCard stats={data} />);

    expect(getByText('Mejorando')).toBeTruthy();
    expect(getByText('Empeorando')).toBeTruthy();
  });

  it('muestra "Sin lecturas" en un periodo sin datos', async () => {
    const data = stats({
      periods: {
        '7': period(),
        '14': period({ days: 14, count: 0, average: null, trend: 'no_data' }),
        '30': period(),
      },
    });

    const { getByText } = await render(<GlucoseAveragesCard stats={data} />);

    expect(getByText('Sin lecturas')).toBeTruthy();
  });
});
