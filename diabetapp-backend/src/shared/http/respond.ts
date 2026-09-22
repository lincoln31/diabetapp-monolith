import { Response } from 'express';

/** Metadatos de paginación de un listado (spec fase 1, RF-1.15). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OkOptions {
  status?: number;
  meta?: PaginationMeta | Record<string, unknown>;
}

/**
 * Única forma de responder con éxito (spec fase 1, RF-1.1):
 *   { success: true, data, meta? }
 */
export const ok = <T>(res: Response, data: T, { status = 200, meta }: OkOptions = {}): Response =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
