import React from 'react';
import { render } from '@testing-library/react-native';
import AchievementsScreen from '../screens/AchievementsScreen';
import { Achievement } from '../types';

const achievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  code: 'STREAK_3',
  name: 'Constancia inicial',
  description: 'Registra glucosa 3 días seguidos',
  metric: 'streak',
  threshold: 3,
  currentValue: 0,
  unlocked: false,
  ...overrides,
});

const mockUseAchievements = jest.fn();
jest.mock('../hooks/useAchievements', () => ({
  useAchievements: () => mockUseAchievements(),
}));

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

describe('AchievementsScreen', () => {
  it('muestra un logro desbloqueado sin el texto de progreso', async () => {
    mockUseAchievements.mockReturnValue({
      status: 'success',
      achievements: [achievement({ unlocked: true, currentValue: 5 })],
      errorMessage: null,
      reload: jest.fn(),
    });

    const { getByText, queryByText } = await render(<AchievementsScreen />);

    expect(getByText('Constancia inicial')).toBeTruthy();
    expect(getByText('Desbloqueado')).toBeTruthy();
    expect(queryByText(/de 3 días seguidos/)).toBeNull();
  });

  it('muestra el progreso de un logro bloqueado', async () => {
    mockUseAchievements.mockReturnValue({
      status: 'success',
      achievements: [achievement({ unlocked: false, currentValue: 1 })],
      errorMessage: null,
      reload: jest.fn(),
    });

    const { getByText } = await render(<AchievementsScreen />);

    expect(getByText('1 de 3 días seguidos')).toBeTruthy();
  });

  it('muestra un error claro con reintentar cuando falla la carga', async () => {
    mockUseAchievements.mockReturnValue({
      status: 'error',
      achievements: null,
      errorMessage: 'No se pudo conectar con el servidor.',
      reload: jest.fn(),
    });

    const { getByText, getByRole } = await render(<AchievementsScreen />);

    expect(getByText('No se pudo conectar con el servidor.')).toBeTruthy();
    expect(getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
