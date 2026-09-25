import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';

/** Estado sin lecturas del dashboard (spec fase 5, RF-5.11, CA-5.7). */

interface EmptyStateProps {
  onRegister: () => void;
}

const EmptyState = ({ onRegister }: EmptyStateProps) => (
  <View style={styles.container}>
    <Icon name="drop" size={48} color={COLORS.blue[500]} />
    <Text style={styles.title}>Todavía no tienes lecturas</Text>
    <Text style={styles.subtitle}>
      Registra tu primera glucosa para empezar a ver tus promedios aquí
    </Text>
    <Button title="Registrar glucosa" onPress={onRegister} style={styles.action} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  action: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
});

export default EmptyState;
