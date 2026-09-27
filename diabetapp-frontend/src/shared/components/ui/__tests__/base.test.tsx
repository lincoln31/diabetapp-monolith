import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { touch } from '../../../theme/tokens';
import Banner from '../Banner';
import Button from '../Button';
import Checkbox from '../Checkbox';
import Chips from '../Chips';
import Input from '../Input';
import { SwitchRow } from '../ListRow';
import { EmptyView, ErrorView } from '../StateView';

describe('Button', () => {
  it.each([
    ['medium', touch.min],
    ['large', 56],
  ] as const)('el tamaño %s mide al menos 48 dp', async (size, min) => {
    const { getByRole } = await render(<Button title="Guardar" size={size} />);
    const style = StyleSheet.flatten(getByRole('button').props.style);

    expect(style.minHeight).toBeGreaterThanOrEqual(min);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('el tamaño pequeño llega a 48 dp con hitSlop', async () => {
    const { getByRole } = await render(<Button title="Editar" size="small" />);
    const button = getByRole('button');
    const style = StyleSheet.flatten(button.props.style);
    const slop = button.props.hitSlop;

    expect(style.minHeight + slop.top + slop.bottom).toBeGreaterThanOrEqual(48);
  });

  it('anuncia su nombre y se deshabilita mientras carga', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button title="Guardar medición" loading onPress={onPress} />,
    );
    const button = getByRole('button', { name: 'Guardar medición' });

    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('"outline" es un alias de "secondary"', async () => {
    const a = await render(<Button title="A" variant="outline" />);
    const styleA = StyleSheet.flatten(a.getByRole('button').props.style);

    expect(styleA.borderWidth).toBe(1.5);
  });
});

describe('Input', () => {
  it('usa la etiqueta como nombre accesible y muestra el error con texto', async () => {
    const { getByLabelText, getByText } = await render(
      <Input label="Correo electrónico" error="Correo inválido" />,
    );

    expect(getByLabelText('Correo electrónico')).toBeTruthy();
    expect(getByText('Correo inválido')).toBeTruthy();
  });

  it('muestra la ayuda cuando no hay error', async () => {
    const { getByText, queryByText } = await render(
      <Input label="Contraseña" helper="Mínimo 8 caracteres" />,
    );

    expect(getByText('Mínimo 8 caracteres')).toBeTruthy();
    expect(queryByText('Correo inválido')).toBeNull();
  });
});

describe('Checkbox', () => {
  it('anuncia su estado y cambia al tocarla', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Checkbox checked={false} onPress={onPress} label="Acepto" />,
    );
    const box = getByRole('checkbox', { name: 'Acepto' });

    expect(box.props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(box);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Chips', () => {
  const options = [
    { value: 'A', label: 'Ayuno' },
    { value: 'B', label: 'Después de comer' },
  ];

  it('marca la opción elegida y cambia con un toque', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(<Chips options={options} value="A" onChange={onChange} />);

    expect(getByRole('radio', { name: 'Ayuno' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    fireEvent.press(getByRole('radio', { name: 'Después de comer' }));
    expect(onChange).toHaveBeenCalledWith('B');
  });
});

describe('SwitchRow', () => {
  it('es un interruptor con nombre y estado', async () => {
    const { getByRole } = await render(
      <SwitchRow title="Recordatorios" value onValueChange={() => undefined} />,
    );

    expect(getByRole('switch', { name: 'Recordatorios' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
  });
});

describe('Banner y estados', () => {
  it('el error se anuncia como alerta con icono y texto', async () => {
    const { getByRole, getByText } = await render(
      <Banner tone="danger" message="No se pudo guardar" />,
    );

    expect(getByRole('alert')).toBeTruthy();
    expect(getByText('No se pudo guardar')).toBeTruthy();
  });

  it('el estado vacío ofrece una acción', async () => {
    const onAction = jest.fn();
    const { getByRole } = await render(
      <EmptyView title="Sin mediciones" actionLabel="Registrar glucosa" onAction={onAction} />,
    );

    fireEvent.press(getByRole('button', { name: 'Registrar glucosa' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('sin conexión se explica y permite reintentar', async () => {
    const onRetry = jest.fn();
    const { getByText, getByRole } = await render(
      <ErrorView offline message="Revisa tu conexión" onRetry={onRetry} />,
    );

    expect(getByText('Sin conexión')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
