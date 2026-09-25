import React, { useEffect } from 'react';
import { Alert, StyleProp, ViewStyle } from 'react-native';
import { Button } from '@/src/shared/components/ui';
import { useExportReport } from '../hooks/useExportReport';

interface ExportReportButtonProps {
  style?: StyleProp<ViewStyle>;
}

/** Botón de exportar el historial en CSV/PDF (spec fase 6, RF-6.12 – RF-6.14). */
const ExportReportButton = ({ style }: ExportReportButtonProps) => {
  const { status, errorMessage, download } = useExportReport();

  useEffect(() => {
    if (status === 'error' && errorMessage) {
      Alert.alert('No se pudo exportar', errorMessage);
    }
  }, [status, errorMessage]);

  const pickFormat = () => {
    Alert.alert('Exportar reporte', 'Elige el formato del archivo', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'CSV', onPress: () => void download('csv') },
      { text: 'PDF', onPress: () => void download('pdf') },
    ]);
  };

  return (
    <Button
      title="Exportar reporte"
      variant="outline"
      loading={status === 'loading'}
      loadingText="Exportando…"
      onPress={pickFormat}
      style={style}
    />
  );
};

export default ExportReportButton;
