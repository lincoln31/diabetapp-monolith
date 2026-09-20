/**
 * Contrato de la API (specs/fase-1-bases-backend).
 * Éxito: { success: true, data, meta? } · Error: { success: false, error: { code, message, fields? } }
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_IN_USE'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'; // Solo del lado de la app: sin respuesta del servidor

export interface ApiFieldError {
  /** Vacío cuando el error no es de un campo concreto, sino del formulario. */
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: ApiFieldError[];
  };
}
