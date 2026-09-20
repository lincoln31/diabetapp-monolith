import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { AppError } from '../errors/AppError';
import { FieldError } from '../errors/errorCodes';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/** Un `field` vacío significa que el error es del formulario completo, no de un campo. */
export const toFieldErrors = (error: ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

/**
 * Valida la petición con esquemas Zod (spec fase 1, RF-1.9, RF-1.10).
 *
 * El `body` se reemplaza por el dato ya convertido. En Express 5 `req.query` y `req.params`
 * son de solo lectura, así que su resultado se expone en `req.validated`.
 */
export const validate =
  (schemas: Schemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const fields: FieldError[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) req.body = result.data;
      else fields.push(...toFieldErrors(result.error));
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) req.validated = { ...req.validated, query: result.data };
      else fields.push(...toFieldErrors(result.error));
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) req.validated = { ...req.validated, params: result.data };
      else fields.push(...toFieldErrors(result.error));
    }

    if (fields.length > 0) {
      next(new AppError('VALIDATION_ERROR', undefined, fields));
      return;
    }

    next();
  };

/** Lee un valor validado con su tipo (el esquema es la fuente de verdad). */
export const validatedQuery = <T>(req: Request): T => req.validated?.query as T;
export const validatedParams = <T>(req: Request): T => req.validated?.params as T;
