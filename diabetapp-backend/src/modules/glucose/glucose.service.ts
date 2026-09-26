import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { PaginationMeta } from '../../shared/http/respond';
import {
  CreateGlucoseInput,
  GlucoseStats,
  Hba1cProjection,
  StreakStats,
  ListGlucoseQuery,
  UpdateGlucoseInput,
} from './glucose.schemas';
import { projectHba1c } from './glucose.hba1c';
import { summarize } from './glucose.stats';
import { calculateStreaks, longestStreak } from './glucose.streak';

/** Campos que la API devuelve de una lectura. */
const readingFields = {
  id: true,
  value: true,
  timestamp: true,
  momentOfDay: true,
  notes: true,
  createdAt: true,
} satisfies Prisma.GlucoseReadingSelect;

export class GlucoseService {
  /** Historial del usuario, filtrado por fechas y paginado (spec fase 1, RF-1.14, RF-1.15). */
  async list(userId: string, { from, to, page, limit }: ListGlucoseQuery) {
    const where: Prisma.GlucoseReadingWhereInput = {
      userId,
      ...(from || to
        ? { timestamp: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    // En una transacción para que el total sea coherente con la página devuelta
    const [readings, total] = await prisma.$transaction([
      prisma.glucoseReading.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: readingFields,
      }),
      prisma.glucoseReading.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return { readings, meta };
  }

  async getById(id: string, userId: string) {
    const reading = await prisma.glucoseReading.findFirst({
      where: { id, userId }, // Solo el propietario puede verla
      select: readingFields,
    });

    if (!reading) {
      throw new AppError('NOT_FOUND', 'Lectura de glucosa no encontrada');
    }

    return reading;
  }

  async create(userId: string, data: CreateGlucoseInput) {
    return prisma.glucoseReading.create({
      data: { ...data, userId },
      select: readingFields,
    });
  }

  /**
   * Actualiza filtrando por id y usuario en la misma operación (spec fase 1, RF-1.16).
   * Una lectura de otro usuario responde NOT_FOUND para no revelar que existe.
   */
  async update(id: string, userId: string, data: UpdateGlucoseInput) {
    const { count } = await prisma.glucoseReading.updateMany({
      where: { id, userId },
      data,
    });

    if (count === 0) {
      throw new AppError('NOT_FOUND', 'Lectura de glucosa no encontrada');
    }

    return prisma.glucoseReading.findUniqueOrThrow({ where: { id }, select: readingFields });
  }

  async remove(id: string, userId: string) {
    const { count } = await prisma.glucoseReading.deleteMany({ where: { id, userId } });

    if (count === 0) {
      throw new AppError('NOT_FOUND', 'Lectura de glucosa no encontrada');
    }
  }

  /**
   * Promedios de 7/14/30 días para el dashboard (spec fase 5, RF-5.1 – RF-5.6).
   * Una sola consulta trae los 30 días y cada ventana se calcula en memoria (D-5.2).
   */
  async getStats(userId: string): Promise<GlucoseStats> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [readings, user] = await prisma.$transaction([
      prisma.glucoseReading.findMany({
        where: { userId, timestamp: { gte: windowStart, lte: now } },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { targetGlucoseMin: true, targetGlucoseMax: true },
      }),
    ]);

    return {
      target: { min: user.targetGlucoseMin, max: user.targetGlucoseMax },
      periods: {
        '7': summarize(readings, 7, now),
        '14': summarize(readings, 14, now),
        '30': summarize(readings, 30, now),
      },
    };
  }

  /**
   * Proyección de HbA1c sobre el promedio de 90 días (spec fase 6, RF-6.1 – RF-6.3).
   * Una sola consulta trae los 90 días y la fórmula ADAG se aplica en memoria (D-6.3).
   */
  async getHba1cProjection(userId: string): Promise<Hba1cProjection> {
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [readings, user] = await prisma.$transaction([
      prisma.glucoseReading.findMany({
        where: { userId, timestamp: { gte: since90 } },
        select: { value: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { targetHba1c: true },
      }),
    ]);

    return {
      ...projectHba1c(readings.map((r) => r.value)),
      targetHba1c: user.targetHba1c,
    };
  }

  /** Historial completo para exportar (spec fase 6, RF-6.5 – RF-6.8): sin paginar. */
  async getAllForExport(userId: string) {
    const [readings, user] = await prisma.$transaction([
      prisma.glucoseReading.findMany({
        where: { userId },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true, momentOfDay: true, notes: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    return { readings, patientName: [user.firstName, user.lastName].filter(Boolean).join(' ') };
  }

  /**
   * Racha de días seguidos y avance de hoy (spec fase 8, RF-8.1 – RF-8.7).
   * La base agrupa las lecturas por día local del usuario; la racha se calcula sobre
   * esa lista de días y no se guarda (D-8.2, RNF-8.1).
   */
  async getStreak(userId: string): Promise<StreakStats> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true, dailyGlucoseChecks: true },
    });
    const tz = user.timezone ?? 'America/Bogota';
    const dailyGoal = user.dailyGlucoseChecks ?? 4;

    const [rows, todayRows] = await prisma.$transaction([
      prisma.$queryRaw<{ day: string; count: number }[]>`
        SELECT to_char(("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM glucose_readings
        WHERE "userId" = ${userId}
        GROUP BY day`,
      prisma.$queryRaw<{ today: string }[]>`
        SELECT to_char(now() AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS today`,
    ]);

    const today = todayRows[0].today;
    const todayCount = rows.find((row) => row.day === today)?.count ?? 0;

    return {
      ...calculateStreaks(
        rows.map((row) => row.day),
        today,
      ),
      todayCount,
      dailyGoal,
      goalReachedToday: todayCount >= dailyGoal,
    };
  }

  /**
   * Mejor racha histórica, sin «hoy» (spec fase 9, D-9.3): la usan los logros por
   * racha. Mismo agrupado por día local que `getStreak`, sin la consulta de «hoy».
   */
  async getLongestStreak(userId: string): Promise<number> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user.timezone ?? 'America/Bogota';

    const rows = await prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char(("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day
      FROM glucose_readings
      WHERE "userId" = ${userId}`;

    return longestStreak(rows.map((row) => row.day));
  }
}
