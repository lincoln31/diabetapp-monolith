import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('muestra la llamada a la acción y avisa al pulsarla', async () => {
    const onRegister = jest.fn();
    const { getByText } = await render(<EmptyState onRegister={onRegister} />);

    expect(getByText('Todavía no tienes lecturas')).toBeTruthy();

    fireEvent.press(getByText('Registrar glucosa'));

    expect(onRegister).toHaveBeenCalledTimes(1);
  });
});
