/**
 * Catálogo de errores de la API (spec fase 1, RF-1.3).
 *
 * El frontend decide su comportamiento según el `code`, nunca según el `message`.
 * Añadir un código nuevo requiere actualizar la spec correspondiente.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: { status: 400, message: 'Datos de entrada inválidos' },
  INVALID_CREDENTIALS: { status: 401, message: 'Email o contraseña incorrectos' },
  UNAUTHENTICATED: { status: 401, message: 'Debes iniciar sesión' },
  TOKEN_EXPIRED: { status: 401, message: 'Tu sesión expiró' },
  FORBIDDEN: { status: 403, message: 'No tienes permiso para esta acción' },
  NOT_FOUND: { status: 404, message: 'Recurso no encontrado' },
  EMAIL_IN_USE: { status: 409, message: 'El correo electrónico ya está registrado' },
  CONFLICT: { status: 409, message: 'El recurso ya existe' },
  INTERNAL_ERROR: { status: 500, message: 'Error interno del servidor' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Detalle de un campo inválido, tal como lo recibe la app. */
export interface FieldError {
  field: string;
  message: string;
}
