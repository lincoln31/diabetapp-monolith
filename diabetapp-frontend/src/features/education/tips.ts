const MS_PER_DAY = 86_400_000;

const dayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY);
};

/**
 * Consejo del día (spec fase 10, D-10.2): el mismo durante todo el día local y
 * vuelve a empezar el catálogo al agotarlo. Pura: la fecha la da quien llama.
 */
export const getTipOfTheDay = (tips: string[], date: Date): string =>
  tips[dayOfYear(date) % tips.length];
