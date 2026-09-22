import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { ERROR_CODES, ErrorCode, FieldError } from '../errors/errorCodes';
import { toFieldErrors } from './validate';

const send = (res: Response, code: ErrorCode, message?: string, fields?: FieldError[]): void => {
  res.status(ERROR_CODES[code].status).json({
    success: false,
    error: {
      code,
      message: message ?? ERROR_CODES[code].message,
      ...(fields ? { fields } : {}),
    },
  });
};

/** Body JSON mal formado: express.json() lanza un SyntaxError con estas propiedades. */
const isMalformedJson = (error: unknown): boolean =>
  error instanceof SyntaxError && 'body' in error && 'status' in error;

/** Body por encima del límite de express.json(). */
const isPayloadTooLarge = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  (error as { type?: string }).type === 'entity.too.large';

/**
 * Único lugar donde un error se convierte en respuesta HTTP
 * (spec fase 1, RF-1.2, RF-1.4, RF-1.8).
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    send(res, error.code, error.message, error.fields);
    return;
  }

  if (error instanceof ZodError) {
    send(res, 'VALIDATION_ERROR', undefined, toFieldErrors(error));
    return;
  }

  if (isPayloadTooLarge(error)) {
    send(res, 'PAYLOAD_TOO_LARGE');
    return;
  }

  if (isMalformedJson(error)) {
    send(res, 'VALIDATION_ERROR', 'El cuerpo de la petición no es JSON válido');
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      send(res, 'CONFLICT');
      return;
    }
    if (error.code === 'P2025') {
      send(res, 'NOT_FOUND');
      return;
    }
  }

  // Errores no previstos: detalle completo al log, mensaje genérico al cliente
  console.error('Error no controlado:', error);
  send(res, 'INTERNAL_ERROR');
};
