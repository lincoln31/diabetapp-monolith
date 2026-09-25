import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/shared/theme/colors';
import { RangeStatus } from '../rangeStatus';

interface RangeAlertProps {
  status: RangeStatus;
  min: number | null;
  max: number | null;
}

const rangeLabel = (min: number | null, max: number | null): string =>
  min !== null && max !== null
    ? `${min}–${max} mg/dL`
    : min !== null
      ? `mínimo ${min} mg/dL`
      : `máximo ${max} mg/dL`;

/**
 * Aviso visual bajo el campo de glucosa (spec fase 7, RF-7.11). Solo informa: no bloquea
 * el guardado ni da consejo médico. Con `in_range` o `unknown` no muestra nada (RF-7.12).
 */
const RangeAlert = ({ status, min, max }: RangeAlertProps) => {
  if (status !== 'low' && status !== 'high') {
    return null;
  }

  const isLow = status === 'low';

  return (
    <View accessibilityRole="alert" style={[styles.container, isLow ? styles.low : styles.high]}>
      <Text style={[styles.title, isLow ? styles.lowText : styles.highText]}>
        {isLow ? 'Por debajo de tu rango' : 'Por encima de tu rango'} ({rangeLabel(min, max)})
      </Text>
      <Text style={styles.hint}>Consulta a tu médico si se repite</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4 },
  low: { backgroundColor: '#FEF3C7', borderLeftColor: COLORS.warning },
  high: { backgroundColor: '#FEE2E2', borderLeftColor: COLORS.error },
  title: { fontSize: 14, fontWeight: '600' },
  lowText: { color: '#92400E' },
  highText: { color: COLORS.error },
  hint: { fontSize: 12, color: COLORS.gray[600], marginTop: 2 },
});

export default RangeAlert;
