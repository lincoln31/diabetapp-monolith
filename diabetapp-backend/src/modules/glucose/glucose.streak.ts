const MS_PER_DAY = 86_400_000;

/** 'YYYY-MM-DD' → número de día de calendario (sin horas: los cambios de horario no afectan). */
const toDayNumber = (day: string): number => {
  const [year, month, date] = day.split('-').map(Number);

  return Date.UTC(year, month - 1, date) / MS_PER_DAY;
};

/**
 * Rachas de días seguidos con al menos una lectura (spec fase 8, D-8.2).
 *
 * `days` son fechas locales del usuario ('YYYY-MM-DD'), en cualquier orden y
 * posiblemente repetidas. La racha actual termina hoy o, si hoy aún no tiene
 * lecturas, ayer: no se rompe hasta que el día en curso termina (RF-8.3).
 */
export const calculateStreaks = (
  days: string[],
  today: string,
): { current: number; longest: number } => {
  const numbers = [...new Set(days.map(toDayNumber))].sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  numbers.forEach((day, index) => {
    run = index > 0 && day === numbers[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });

  const present = new Set(numbers);
  const todayNumber = toDayNumber(today);
  const end = present.has(todayNumber) ? todayNumber : todayNumber - 1;

  let current = 0;
  while (present.has(end - current)) {
    current++;
  }

  return { current, longest };
};
