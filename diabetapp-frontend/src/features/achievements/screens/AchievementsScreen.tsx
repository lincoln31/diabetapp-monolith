import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { useAchievements } from '../hooks/useAchievements';
import { Achievement, AchievementMetric } from '../types';

const METRIC_ICON: Record<AchievementMetric, 'flame' | 'chart'> = {
  streak: 'flame',
  readingsCount: 'chart',
};

const METRIC_UNIT: Record<AchievementMetric, string> = {
  streak: 'días seguidos',
  readingsCount: 'lecturas',
};

const AchievementRow = ({ achievement }: { achievement: Achievement }) => {
  const { name, description, metric, threshold, currentValue, unlocked } = achievement;

  return (
    <Card
      padding="large"
      style={StyleSheet.flatten([styles.row, unlocked ? styles.rowUnlocked : styles.rowLocked])}
    >
      <View
        style={[styles.iconCircle, unlocked ? styles.iconCircleUnlocked : styles.iconCircleLocked]}
      >
        <Icon
          name={METRIC_ICON[metric]}
          size={26}
          color={unlocked ? COLORS.warning : COLORS.gray[400]}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.name, !unlocked && styles.nameLocked]}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={unlocked ? styles.progressUnlocked : styles.progressLocked}>
          {unlocked ? 'Desbloqueado' : `${currentValue} de ${threshold} ${METRIC_UNIT[metric]}`}
        </Text>
      </View>
    </Card>
  );
};

/** Pantalla «Mis Logros» (spec fase 9, RF-9.6 – RF-9.9). */
const AchievementsScreen = () => {
  const router = useRouter();
  const { status, achievements, errorMessage, reload } = useAchievements();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          variant="outline"
          size="small"
          style={styles.closeButton}
          onPress={() => router.back()}
          title="✕"
        />
        <Icon name="trophy" size={22} color={COLORS.gray[800]} style={styles.titleIcon} />
        <Text style={styles.title}>Mis Logros</Text>
      </View>

      {status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Reintentar" variant="outline" onPress={reload} />
        </View>
      )}

      {status === 'success' && achievements && (
        <ScrollView contentContainerStyle={styles.list}>
          {achievements.map((achievement) => (
            <AchievementRow key={achievement.code} achievement={achievement} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 15,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleIcon: { marginRight: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[800], flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
  list: { padding: 20, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowUnlocked: { backgroundColor: COLORS.white },
  rowLocked: { backgroundColor: COLORS.gray[50] },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconCircleUnlocked: { backgroundColor: '#FEF3C7' },
  iconCircleLocked: { backgroundColor: COLORS.gray[100] },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  nameLocked: { color: COLORS.gray[500] },
  description: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  progressUnlocked: { fontSize: 13, fontWeight: '600', color: COLORS.green[700], marginTop: 6 },
  progressLocked: { fontSize: 13, fontWeight: '600', color: COLORS.gray[400], marginTop: 6 },
});

export default AchievementsScreen;
