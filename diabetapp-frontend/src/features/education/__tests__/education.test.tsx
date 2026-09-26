import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { calculateCarbs } from '../carbCalculator';
import { FAQS, TIPS } from '../constants';
import { carbCalculatorSchema } from '../schemas';
import GuidesScreen from '../screens/GuidesScreen';
import { getTipOfTheDay } from '../tips';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

describe('catálogo', () => {
  it('tiene al menos 15 consejos', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(15);
  });
});

describe('getTipOfTheDay', () => {
  const tips = ['a', 'b', 'c'];

  it('da el mismo consejo durante todo el día', () => {
    const morning = new Date(2026, 8, 24, 6, 0);
    const night = new Date(2026, 8, 24, 23, 30);
    expect(getTipOfTheDay(tips, morning)).toBe(getTipOfTheDay(tips, night));
  });

  it('rota al día siguiente', () => {
    const today = getTipOfTheDay(tips, new Date(2026, 8, 24));
    const tomorrow = getTipOfTheDay(tips, new Date(2026, 8, 25));
    expect(tomorrow).not.toBe(today);
  });

  it('vuelve a empezar al agotar el catálogo', () => {
    expect(getTipOfTheDay(tips, new Date(2026, 8, 24))).toBe(
      getTipOfTheDay(tips, new Date(2026, 8, 27)),
    );
  });
});

describe('calculateCarbs', () => {
  it('25 g por 100 g y 80 g de porción dan 20 g y 2 raciones', () => {
    expect(calculateCarbs(25, 80)).toEqual({ totalCarbs: 20, portions: 2 });
  });

  it('redondea los gramos y da raciones con un decimal', () => {
    expect(calculateCarbs(33, 50)).toEqual({ totalCarbs: 17, portions: 1.7 });
  });
});

describe('carbCalculatorSchema', () => {
  it('acepta números positivos, con coma o punto', () => {
    expect(carbCalculatorSchema.safeParse({ carbsPer100g: '12,5', gramsEaten: '80' }).success).toBe(
      true,
    );
  });

  it.each([
    ['vacío', ''],
    ['texto', 'abc'],
    ['negativo', '-5'],
    ['cero', '0'],
  ])('rechaza %s', (_name, value) => {
    expect(carbCalculatorSchema.safeParse({ carbsPer100g: value, gramsEaten: '80' }).success).toBe(
      false,
    );
    expect(carbCalculatorSchema.safeParse({ carbsPer100g: '25', gramsEaten: value }).success).toBe(
      false,
    );
  });
});

describe('GuidesScreen', () => {
  it('muestra las preguntas plegadas y despliega una sola a la vez', async () => {
    const { getByText, queryByText } = await render(<GuidesScreen />);

    expect(queryByText(FAQS[0].answer)).toBeNull();

    await fireEvent.press(getByText(FAQS[0].question));
    expect(getByText(FAQS[0].answer)).toBeTruthy();
    expect(queryByText(FAQS[1].answer)).toBeNull();

    await fireEvent.press(getByText(FAQS[1].question));
    expect(getByText(FAQS[1].answer)).toBeTruthy();
    expect(queryByText(FAQS[0].answer)).toBeNull();
  });
});
