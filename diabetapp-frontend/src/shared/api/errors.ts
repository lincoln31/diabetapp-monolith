import { isAxiosError } from 'axios';
import { ApiErrorBody, ApiErrorCode, ApiFieldError } from './types';

/** Único tipo de error que ven las pantallas (spec fase 3, RF-3.8). */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly fields?: ApiFieldError[];
  readonly status?: number;

  constructor(code: ApiErrorCode, message: string, fields?: ApiFieldError[], status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }

  /** Mensaje del primer campo, si el error trae detalle de validación. */
  get firstFieldMessage(): string | undefined {
    return this.fields?.[0]?.message;
  }
}

/**
 * Decodifica un `ArrayBuffer` a texto sin depender de `TextDecoder` (no está
 * garantizado en todos los motores de React Native). Solo se usa para leer el
 * cuerpo de un error cuando la petición pidió una respuesta binaria (spec
 * fase 6, D-6.6: exportar el PDF con `responseType: 'arraybuffer'`).
 */
const decodeArrayBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let raw = '';
  for (let i = 0; i < bytes.length; i++) {
    raw += String.fromCharCode(bytes[i]);
  }
  return decodeURIComponent(escape(raw));
};

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** Convierte cualquier error (axios, red, inesperado) en un `ApiError`. */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const rawData = error.response?.data;
    const body = (
      rawData instanceof ArrayBuffer
        ? safeJsonParse(decodeArrayBuffer(rawData))
        : rawData
    ) as ApiErrorBody | undefined;

    if (body?.error?.code) {
      return new ApiError(
        body.error.code,
        body.error.message,
        body.error.fields,
        error.response?.status,
      );
    }

    if (!error.response) {
      return new ApiError(
        'NETWORK_ERROR',
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
  }

  return new ApiError('INTERNAL_ERROR', 'Ocurrió un error inesperado. Intenta de nuevo.');
};
