import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { Hba1cProjection } from '../types';

/** Tarjeta de proyección de HbA1c (spec fase 6, RF-6.9 – RF-6.11, D-6.7). */

const MIN_READINGS_FOR_PROJECTION = 10;

interface Hba1cCardProps {
  projection: Hba1cProjection;
}

const Hba1cCard = ({ projection }: Hba1cCardProps) => {
  const { sufficientData, sampleCount, projectedHba1c, targetHba1c } = projection;

  if (!sufficientData) {
    return (
      <Card padding="large" style={styles.card}>
        <Text style={styles.title}>Proyección de HbA1c</Text>
        <Text style={styles.insufficientText}>
          Necesitas más lecturas de los últimos 90 días para una proyección confiable ({sampleCount}{' '}
          de {MIN_READINGS_FOR_PROJECTION}).
        </Text>
      </Card>
    );
  }

  const withinTarget =
    targetHba1c !== null && projectedHba1c !== null && projectedHba1c <= targetHba1c;

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title}>Proyección de HbA1c</Text>

      <View style={styles.headlineRow}>
        <Text style={styles.headlineValue}>
          {projectedHba1c}
          <Text style={styles.headlineUnit}> %</Text>
        </Text>

        {targetHba1c !== null && (
          <View style={[styles.badge, withinTarget ? styles.badgeIn : styles.badgeOut]}>
            <Text
              style={[styles.badgeText, withinTarget ? styles.badgeTextIn : styles.badgeTextOut]}
            >
              {withinTarget ? 'Dentro de tu meta' : 'Por encima de tu meta'}
            </Text>
          </View>
        )}
      </View>

      {targetHba1c !== null && <Text style={styles.targetText}>Tu meta: {targetHba1c} %</Text>}

      <Text style={styles.disclaimer}>
        Estimación a partir de tu promedio de glucosa de los últimos 90 días — no reemplaza un
        examen de laboratorio.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  insufficientText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  headlineValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  headlineUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeIn: {
    backgroundColor: COLORS.green[50],
  },
  badgeOut: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextIn: {
    color: COLORS.green[700],
  },
  badgeTextOut: {
    color: COLORS.error,
  },
  targetText: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 12,
    lineHeight: 16,
  },
});

export default Hba1cCard;
