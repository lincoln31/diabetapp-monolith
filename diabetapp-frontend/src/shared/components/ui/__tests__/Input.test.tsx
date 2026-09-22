import React from 'react';
import { render } from '@testing-library/react-native';
import Input from '../Input';

describe('Input', () => {
  it('muestra el mensaje de error bajo el campo', async () => {
    const { getByText } = await render(
      <Input placeholder="Correo electrónico" error="Correo electrónico inválido" />,
    );

    expect(getByText('Correo electrónico inválido')).toBeTruthy();
  });

  it('no muestra nada cuando no hay error', async () => {
    const { queryByText } = await render(<Input placeholder="Correo electrónico" />);

    expect(queryByText('Correo electrónico inválido')).toBeNull();
  });
});
