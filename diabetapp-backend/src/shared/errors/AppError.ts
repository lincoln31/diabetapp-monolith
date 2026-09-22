import { ERROR_CODES, ErrorCode, FieldError } from './errorCodes';

/**
 * Error de negocio con un código del catálogo (spec fase 1, RF-1.7).
 *
 * Cualquier capa lo lanza y el `errorHandler` lo convierte en la respuesta HTTP:
 *   throw new AppError('EMAIL_IN_USE');
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: FieldError[];

  constructor(code: ErrorCode, message?: string, fields?: FieldError[]) {
    super(message ?? ERROR_CODES[code].message);
    this.name = 'AppError';
    this.code = code;
    this.fields = fields;
    Error.captureStackTrace?.(this, AppError);
  }

  get status(): number {
    return ERROR_CODES[this.code].status;
  }
}
