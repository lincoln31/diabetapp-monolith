import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import InsulinCalculatorScreen from '../screens/InsulinCalculatorScreen';

const mockPush = jest.fn();
let mockParams: { glucose?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

const mockUseProfile = jest.fn();
jest.mock('@/src/features/profile', () => ({ useProfile: () => mockUseProfile() }));

const WAIT = { timeout: 5000 };

describe('InsulinCalculatorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('sin ratio ni factor configurados, avisa y no muestra resultado', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        insulinCarbRatio: null,
        insulinSensitivityFactor: null,
        targetGlucoseMin: 80,
        targetGlucoseMax: 180,
      },
    });

    const { getByText, getByRole } = await render(<InsulinCalculatorScreen />);

    expect(getByText('Configura tu ratio y tu factor')).toBeTruthy();
    expect(getByRole('button', { name: 'Ir a Mi perfil' })).toBeTruthy();
  });

  it('busca un alimento y precarga sus carbohidratos', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        insulinCarbRatio: 10,
        insulinSensitivityFactor: 40,
        targetGlucoseMin: 80,
        targetGlucoseMax: 180,
      },
    });

    const { getByPlaceholderText, getByText, getByLabelText } = await render(
      <InsulinCalculatorScreen />,
    );

    await fireEvent.changeText(getByPlaceholderText('Busca un alimento, ej. arepa'), 'arroz');
    await fireEvent.press(getByText('Arroz cocido'));

    await waitFor(
      () => expect(getByLabelText('Carbohidratos de la comida (g)').props.value).toBe('45'),
      WAIT,
    );
  });

  it('con ratio, factor y rango configurados, calcula la dosis total', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        insulinCarbRatio: 10,
        insulinSensitivityFactor: 40,
        targetGlucoseMin: 80,
        targetGlucoseMax: 180,
      },
    });

    const { getByLabelText, getByText } = await render(<InsulinCalculatorScreen />);

    await fireEvent.changeText(getByLabelText('Carbohidratos de la comida (g)'), '45');
    await fireEvent.changeText(getByLabelText('Glucosa actual (mg/dL)'), '200');

    await waitFor(() => expect(getByText('6.5 u')).toBeTruthy(), WAIT);
  });

  it('precarga la glucosa actual desde el parámetro de navegación', async () => {
    mockParams = { glucose: '150' };
    mockUseProfile.mockReturnValue({
      profile: {
        insulinCarbRatio: 10,
        insulinSensitivityFactor: 40,
        targetGlucoseMin: 80,
        targetGlucoseMax: 180,
      },
    });

    const { getByLabelText } = await render(<InsulinCalculatorScreen />);

    expect(getByLabelText('Glucosa actual (mg/dL)').props.value).toBe('150');
  });

  it('no sugiere una dosis negativa cuando la glucosa está bajo la meta', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        insulinCarbRatio: 10,
        insulinSensitivityFactor: 40,
        targetGlucoseMin: 80,
        targetGlucoseMax: 180,
      },
    });

    const { getByLabelText, getByText } = await render(<InsulinCalculatorScreen />);

    await fireEvent.changeText(getByLabelText('Carbohidratos de la comida (g)'), '0');
    await fireEvent.changeText(getByLabelText('Glucosa actual (mg/dL)'), '90');

    await waitFor(() => expect(getByText('0 u')).toBeTruthy(), WAIT);
  });
});
