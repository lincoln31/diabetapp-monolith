import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { useTipOfTheDay } from '../hooks/useTipOfTheDay';

/** Tarjeta «Consejo del día» del dashboard (spec fase 10, RF-10.1). */
const TipCard = () => {
  const tip = useTipOfTheDay();

  return (
    <Card padding="large" style={styles.card}>
      <View style={styles.header}>
        <Icon name="bulb" size={20} color={COLORS.warning} />
        <Text style={styles.title}>Consejo del día</Text>
      </View>
      <Text style={styles.tip}>{tip}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12, backgroundColor: '#FFFBEB' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800], marginLeft: 6 },
  tip: { fontSize: 14, lineHeight: 20, color: COLORS.gray[700] },
});

export default TipCard;
