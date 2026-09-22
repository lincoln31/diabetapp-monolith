import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { PaginationMeta } from '../../shared/http/respond';
import { CreateGlucoseInput, ListGlucoseQuery, UpdateGlucoseInput } from './glucose.schemas';

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
}
