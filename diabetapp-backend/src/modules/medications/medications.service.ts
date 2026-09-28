import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { calculateAdherence } from './medications.adherence';
import {
  AdherenceStats,
  CreateMedicationInput,
  MedicationView,
  UpdateMedicationInput,
} from './medications.schemas';

const medicationFields = {
  id: true,
  name: true,
  dosage: true,
  scheduledTimes: true,
  notes: true,
} satisfies Prisma.MedicationSelect;

export class MedicationsService {
  private async timezoneOf(userId: string): Promise<string> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    return user.timezone ?? 'America/Bogota';
  }

  async create(userId: string, input: CreateMedicationInput): Promise<MedicationView> {
    const medication = await prisma.medication.create({
      data: { ...input, notes: input.notes || null, userId },
      select: medicationFields,
    });

    return { ...medication, takenToday: 0 };
  }

  /** Medicamentos activos con las tomas de hoy (día local del usuario), sin N+1 (RNF-11.1). */
  async list(userId: string): Promise<MedicationView[]> {
    const tz = await this.timezoneOf(userId);

    const [medications, todayRows] = await prisma.$transaction([
      prisma.medication.findMany({
        where: { userId, active: true },
        orderBy: { createdAt: 'asc' },
        select: medicationFields,
      }),
      prisma.$queryRaw<{ medicationId: string; count: number }[]>`
        SELECT "medicationId", COUNT(*)::int AS count
        FROM medication_intakes
        WHERE "userId" = ${userId}
          AND (("takenAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date
              = (now() AT TIME ZONE ${tz})::date
        GROUP BY "medicationId"`,
    ]);

    const takenById = new Map(todayRows.map((row) => [row.medicationId, row.count]));

    return medications.map((medication) => ({
      ...medication,
      takenToday: takenById.get(medication.id) ?? 0,
    }));
  }

  async update(id: string, userId: string, input: UpdateMedicationInput): Promise<MedicationView> {
    const { count } = await prisma.medication.updateMany({
      where: { id, userId, active: true },
      data: { ...input, notes: input.notes || null },
    });
    if (count === 0) throw new AppError('NOT_FOUND');

    const view = (await this.list(userId)).find((item) => item.id === id);
    if (!view) throw new AppError('NOT_FOUND');

    return view;
  }

  /** «Dejar de usar»: archiva para conservar el historial de tomas (spec fase 11, RF-11.2). */
  async archive(id: string, userId: string): Promise<void> {
    const { count } = await prisma.medication.updateMany({
      where: { id, userId, active: true },
      data: { active: false },
    });
    if (count === 0) throw new AppError('NOT_FOUND');
  }

  async logIntake(id: string, userId: string, takenAt: Date = new Date()) {
    const medication = await prisma.medication.findFirst({
      where: { id, userId, active: true },
      select: { id: true },
    });
    if (!medication) throw new AppError('NOT_FOUND');

    return prisma.medicationIntake.create({
      data: { medicationId: id, userId, takenAt },
      select: { id: true, medicationId: true, takenAt: true },
    });
  }

  /** Adherencia de 7 y 30 días: consultas fijas, sin importar cuántos medicamentos haya. */
  async getAdherence(userId: string): Promise<AdherenceStats> {
    const tz = await this.timezoneOf(userId);

    const [medications, intakes, todayRows] = await prisma.$transaction([
      prisma.$queryRaw<{ id: string; scheduledPerDay: number; createdDay: string }[]>`
        SELECT id,
               cardinality("scheduledTimes")::int AS "scheduledPerDay",
               to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS "createdDay"
        FROM medications
        WHERE "userId" = ${userId} AND active = true`,
      prisma.$queryRaw<{ medicationId: string; day: string; taken: number }[]>`
        SELECT "medicationId",
               to_char(("takenAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS taken
        FROM medication_intakes
        WHERE "userId" = ${userId}
          AND "takenAt" >= now() - interval '31 days'
        GROUP BY 1, 2`,
      prisma.$queryRaw<{ today: string }[]>`
        SELECT to_char(now() AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS today`,
    ]);

    const input = { medications, intakes, today: todayRows[0].today };

    return {
      days7: calculateAdherence({ ...input, windowDays: 7 }),
      days30: calculateAdherence({ ...input, windowDays: 30 }),
    };
  }
}
