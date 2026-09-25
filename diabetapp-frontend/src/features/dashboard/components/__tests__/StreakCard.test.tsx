import React from 'react';
import { render } from '@testing-library/react-native';
import StreakCard from '../StreakCard';
import { StreakStats } from '../../types';

const streak = (overrides: Partial<StreakStats> = {}): StreakStats => ({
  current: 3,
  longest: 7,
  todayCount: 2,
  dailyGoal: 4,
  goalReachedToday: false,
  ...overrides,
});

describe('StreakCard', () => {
  it('muestra la racha actual, la mejor y el avance de hoy', async () => {
    const { getByText, queryByText } = await render(<StreakCard streak={streak()} />);

    expect(getByText('3 días seguidos')).toBeTruthy();
    expect(getByText('Tu mejor racha: 7 días')).toBeTruthy();
    expect(getByText('Hoy: 2 de 4 lecturas')).toBeTruthy();
    expect(queryByText('Meta de hoy cumplida')).toBeNull();
  });

  it('usa el singular con un solo día', async () => {
    const { getByText } = await render(<StreakCard streak={streak({ current: 1, longest: 1 })} />);

    expect(getByText('1 día seguido')).toBeTruthy();
  });

  it('invita a empezar cuando no hay racha, sin mostrar "0 días"', async () => {
    const { getByText, queryByText } = await render(
      <StreakCard streak={streak({ current: 0, longest: 5 })} />,
    );

    expect(getByText('Registra una glucosa hoy para iniciar tu racha')).toBeTruthy();
    expect(getByText('Tu mejor racha: 5 días')).toBeTruthy();
    expect(queryByText(/0 días/)).toBeNull();
  });

  it('no muestra la mejor racha si nunca hubo una', async () => {
    const { queryByText } = await render(
      <StreakCard streak={streak({ current: 0, longest: 0 })} />,
    );

    expect(queryByText(/Tu mejor racha/)).toBeNull();
  });

  it('marca la meta de hoy como cumplida', async () => {
    const { getByText } = await render(
      <StreakCard streak={streak({ todayCount: 4, goalReachedToday: true })} />,
    );

    expect(getByText('Meta de hoy cumplida')).toBeTruthy();
  });
});
