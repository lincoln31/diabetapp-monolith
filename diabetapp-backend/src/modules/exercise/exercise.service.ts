import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { PaginationMeta } from '../../shared/http/respond';
import { correlateExerciseGlucose, DayGlucose } from './exercise.correlation';
import { CreateExerciseInput, ExerciseSummary, ListExerciseQuery } from './exercise.schemas';

const activityFields = {
  id: true,
  type: true,
  durationMinutes: true,
  startedAt: true,
  notes: true,
} satisfies Prisma.ExerciseActivitySelect;

const MS_PER_DAY = 86_400_000;

const toDayString = (dayNumber: number): string =>
  new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);

const toDayNumber = (day: string): number => {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date) / MS_PER_DAY;
};

export class ExerciseService {
  async create(userId: string, input: CreateExerciseInput) {
    return prisma.exerciseActivity.create({
      data: {
        userId,
        type: input.type,
        durationMinutes: input.durationMinutes,
        startedAt: input.startedAt ?? new Date(),
        notes: input.notes || null,
      },
      select: activityFields,
    });
  }

  /** Historial del usuario, filtrado por fechas y paginado (spec fase 12, RF-12.3). */
  async list(userId: string, { from, to, page, limit }: ListExerciseQuery) {
    const where: Prisma.ExerciseActivityWhereInput = {
      userId,
      ...(from || to
        ? { startedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const [activities, total] = await prisma.$transaction([
      prisma.exerciseActivity.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: activityFields,
      }),
      prisma.exerciseActivity.count({ where }),
    ]);

    const meta: PaginationMeta = { page, limit, total, totalPages: Math.ceil(total / limit) };

    return { activities, meta };
  }

  async remove(id: string, userId: string): Promise<void> {
    const { count } = await prisma.exerciseActivity.deleteMany({ where: { id, userId } });
    if (count === 0) throw new AppError('NOT_FOUND');
  }

  /**
   * Avance de hoy, minutos de 7 días y correlación con la glucosa (spec fase 12, D-12.4):
   * consultas fijas agrupadas por día local del usuario, sin N+1 (RNF-12.1).
   */
  async getSummary(userId: string): Promise<ExerciseSummary> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true, exerciseGoalMinutes: true },
    });
    const tz = user.timezone ?? 'America/Bogota';

    const [minutesRows, glucoseRows, todayRows] = await prisma.$transaction([
      prisma.$queryRaw<{ day: string; minutes: number }[]>`
        SELECT to_char(("startedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
               SUM("durationMinutes")::int AS minutes
        FROM exercise_activities
        WHERE "userId" = ${userId} AND "startedAt" >= now() - interval '31 days'
        GROUP BY day`,
      prisma.$queryRaw<{ day: string; total: number; count: number }[]>`
        SELECT to_char(("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
               SUM(value)::int AS total,
               COUNT(*)::int AS count
        FROM glucose_readings
        WHERE "userId" = ${userId} AND "timestamp" >= now() - interval '31 days'
        GROUP BY day`,
      prisma.$queryRaw<{ today: string }[]>`
        SELECT to_char(now() AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS today`,
    ]);

    const today = todayRows[0].today;
    const todayNumber = toDayNumber(today);
    const windowStart = toDayString(todayNumber - 29);
    const last7Start = toDayString(todayNumber - 6);

    const minutesByDay = new Map(minutesRows.map((row) => [row.day, row.minutes]));
    const inWindow = (day: string, start: string) => day >= start && day <= today;

    const exerciseDays = new Set(
      minutesRows.filter((row) => inWindow(row.day, windowStart)).map((row) => row.day),
    );
    const glucose: DayGlucose[] = glucoseRows.filter((row) => inWindow(row.day, windowStart));

    const last7DaysMinutes = minutesRows
      .filter((row) => inWindow(row.day, last7Start))
      .reduce((sum, row) => sum + row.minutes, 0);

    return {
      todayMinutes: minutesByDay.get(today) ?? 0,
      goalMinutes: user.exerciseGoalMinutes ?? 30,
      last7DaysMinutes,
      correlation: correlateExerciseGlucose(exerciseDays, glucose),
    };
  }
}
