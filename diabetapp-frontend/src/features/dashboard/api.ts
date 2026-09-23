import { get, getFile } from '@/src/shared/api/client';
import { ExportFormat, GlucoseStats, Hba1cProjection } from './types';

/** Llamada de estadísticas del dashboard (spec fase 5, RF-5.1). */
export const dashboardApi = {
  getStats: () => get<GlucoseStats>('/glucose/stats'),
};

/** Llamada de proyección de HbA1c (spec fase 6, RF-6.1). */
export const hba1cApi = {
  getProjection: () => get<Hba1cProjection>('/glucose/hba1c'),
};

/** Descarga del reporte exportado (spec fase 6, RF-6.5, RF-6.6). */
export const exportApi = {
  download: (format: ExportFormat) =>
    getFile(`/glucose/export/${format}`, format === 'pdf' ? 'arraybuffer' : 'text'),
};
