import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toApiError } from '@/src/shared/api/errors';
import { exportApi } from '../api';
import { ExportFormat } from '../types';
import { arrayBufferToBase64 } from '../utils/base64';

type Status = 'idle' | 'loading' | 'error';

const MIME: Record<ExportFormat, string> = { csv: 'text/csv', pdf: 'application/pdf' };

/**
 * Descarga el reporte, lo escribe en un archivo temporal y abre la hoja de
 * compartir del sistema (spec fase 6, RF-6.12 – RF-6.14, D-6.6). Sin caché:
 * cada exportación pide el archivo de nuevo.
 */
export const useExportReport = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const download = async (format: ExportFormat) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const content = await exportApi.download(format);
      const path = `${FileSystem.cacheDirectory}glucosa-${Date.now()}.${format}`;

      if (format === 'pdf') {
        await FileSystem.writeAsStringAsync(path, arrayBufferToBase64(content as ArrayBuffer), {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.writeAsStringAsync(path, content as string);
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('SHARING_UNAVAILABLE');
      }

      await Sharing.shareAsync(path, { mimeType: MIME[format] });
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error && error.message === 'SHARING_UNAVAILABLE'
          ? 'Este dispositivo no permite compartir archivos.'
          : toApiError(error).message,
      );
    }
  };

  return { status, errorMessage, download };
};
