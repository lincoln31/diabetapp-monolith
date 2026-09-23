import React from 'react';
import { render } from '@testing-library/react-native';
import Hba1cCard from '../Hba1cCard';
import { Hba1cProjection } from '../../types';

const projection = (overrides: Partial<Hba1cProjection> = {}): Hba1cProjection => ({
  average90: 140,
  sampleCount: 15,
  sufficientData: true,
  projectedHba1c: 6.1,
  targetHba1c: null,
  ...overrides,
});

describe('Hba1cCard', () => {
  it('muestra el mensaje de datos insuficientes cuando sufficientData es false', async () => {
    const { getByText, queryByText } = await render(
      <Hba1cCard projection={projection({ sufficientData: false, sampleCount: 3, projectedHba1c: null })} />,
    );

    expect(getByText(/Necesitas más lecturas/)).toBeTruthy();
    expect(getByText(/3 de 10/)).toBeTruthy();
    expect(queryByText('6.1')).toBeNull();
  });

  it('muestra la proyección sin comparación cuando no hay meta', async () => {
    const { getByText, queryByText } = await render(<Hba1cCard projection={projection()} />);

    expect(getByText('6.1', { exact: false })).toBeTruthy();
    expect(queryByText('Dentro de tu meta')).toBeNull();
    expect(queryByText('Por encima de tu meta')).toBeNull();
  });

  it('marca dentro de la meta cuando la proyección no la supera', async () => {
    const { getByText } = await render(
      <Hba1cCard projection={projection({ projectedHba1c: 6.0, targetHba1c: 6.5 })} />,
    );

    expect(getByText('Dentro de tu meta')).toBeTruthy();
  });

  it('marca por encima de la meta cuando la proyección la supera', async () => {
    const { getByText } = await render(
      <Hba1cCard projection={projection({ projectedHba1c: 7.2, targetHba1c: 6.5 })} />,
    );

    expect(getByText('Por encima de tu meta')).toBeTruthy();
  });
});
