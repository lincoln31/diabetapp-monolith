import React from 'react';
import { render } from '@testing-library/react-native';
import RangeAlert from '../RangeAlert';

describe('RangeAlert', () => {
  it('avisa cuando el valor está por debajo del rango', async () => {
    const { getByText } = await render(<RangeAlert status="low" min={80} max={180} />);

    expect(getByText(/Por debajo de tu rango \(80–180 mg\/dL\)/)).toBeTruthy();
    expect(getByText('Consulta a tu médico si se repite')).toBeTruthy();
  });

  it('avisa cuando el valor está por encima del rango', async () => {
    const { getByText } = await render(<RangeAlert status="high" min={80} max={180} />);

    expect(getByText(/Por encima de tu rango/)).toBeTruthy();
  });

  it.each(['in_range', 'unknown'] as const)('no muestra nada con %s', async (status) => {
    const { toJSON } = await render(<RangeAlert status={status} min={80} max={180} />);

    expect(toJSON()).toBeNull();
  });
});
