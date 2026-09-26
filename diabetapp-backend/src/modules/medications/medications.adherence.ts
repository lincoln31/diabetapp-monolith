import { AdherencePeriod } from './medications.schemas';

export interface AdherenceInput {
  medications: { id: string; scheduledPerDay: number; createdDay: string }[];
  intakes: { medicationId: string; day: string; taken: number }[];
  /** Día local de hoy, 'YYYY-MM-DD'. */
  today: string;
  /** Días de la ventana, hoy incluido. */
  windowDays: number;
}

const MS_PER_DAY = 86_400_000;

const toDayNumber = (day: string): number => {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date) / MS_PER_DAY;
};

const toDayString = (dayNumber: number): string =>
  new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);

/**
 * Adherencia de una ventana (spec fase 11, D-11.4): esperadas = horarios por día desde
 * el día de creación del medicamento; cumplidas = tomas del día con tope en los horarios
 * de ese medicamento, para que tomas de más no compensen las que faltaron.
 */
export const calculateAdherence = ({
  medications,
  intakes,
  today,
  windowDays,
}: AdherenceInput): AdherencePeriod => {
  const todayNumber = toDayNumber(today);
  const windowStart = todayNumber - (windowDays - 1);

  const takenByMedicationDay = new Map<string, number>();
  for (const intake of intakes) {
    takenByMedicationDay.set(`${intake.medicationId}|${intake.day}`, intake.taken);
  }

  let expected = 0;
  let taken = 0;

  for (const medication of medications) {
    const start = Math.max(windowStart, toDayNumber(medication.createdDay));
    for (let day = start; day <= todayNumber; day++) {
      expected += medication.scheduledPerDay;
      const count = takenByMedicationDay.get(`${medication.id}|${toDayString(day)}`) ?? 0;
      taken += Math.min(count, medication.scheduledPerDay);
    }
  }

  return {
    expected,
    taken,
    percent: expected === 0 ? null : Math.round((taken / expected) * 100),
  };
};
