import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, radius } from '../../theme/tokens';

/**
 * Barra de avance (spec fase 15, D-15.7). Siempre va acompañada de su cifra en texto
 * («2 de 4 lecturas»); la barra es un refuerzo visual y anuncia su valor a los lectores.
 */
interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

const ProgressBar = ({ value, max, label }: ProgressBarProps) => {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const reached = max > 0 && value >= max;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.round(ratio * 100)}%` },
          reached && styles.fillReached,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.disabledBg,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: color.accent },
  fillReached: { backgroundColor: color.success },
});

export default ProgressBar;
