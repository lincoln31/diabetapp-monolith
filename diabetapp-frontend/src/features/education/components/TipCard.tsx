import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useTipOfTheDay } from '../hooks/useTipOfTheDay';

/** Tarjeta «Consejo del día» (spec fase 10, RF-10.1; vive en Educación desde la fase 15). */
const TipCard = () => {
  const tip = useTipOfTheDay();

  return (
    <Card padding="large" style={styles.card}>
      <View style={styles.header}>
        <Icon name="bulb" size={20} color={color.warning} />
        <Text style={styles.title} accessibilityRole="header">
          Consejo del día
        </Text>
      </View>
      <Text style={styles.tip}>{tip}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: color.warningBg, rowGap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', columnGap: space.sm },
  title: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  tip: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: color.text },
});

export default TipCard;
