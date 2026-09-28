export interface CarbResult {
  /** Gramos de carbohidratos de la porción, redondeados. */
  totalCarbs: number;
  /** Raciones de 10 g, con un decimal. */
  portions: number;
}

/** Calculadora de carbohidratos (spec fase 10, D-10.3). Solo aritmética, sin recomendar dosis. */
export const calculateCarbs = (carbsPer100g: number, gramsEaten: number): CarbResult => {
  const totalCarbs = Math.round((carbsPer100g * gramsEaten) / 100);
  return { totalCarbs, portions: totalCarbs / 10 };
};
