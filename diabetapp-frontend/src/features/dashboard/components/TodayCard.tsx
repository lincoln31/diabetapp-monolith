import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/src/shared/components/ui';
import ProgressBar from '@/src/shared/components/ui/ProgressBar';
import { color, space, type } from '@/src/shared/theme/tokens';
import type { Medication } from '@/src/features/medications';
import { StreakStats } from '../types';

/** Tomas que faltan hoy de un medicamento. */
export const pendingIntakes = (medication: Medication): number =>
  Math.max(0, medication.scheduledTimes.length - medication.takenToday);

interface TodayCardProps {
  streak: StreakStats | null;
  medications: Medication[] | null;
  exercise: { todayMinutes: number; goalMinutes: number } | null;
  busyMedicationId: string | null;
  onLogIntake: (medication: Medication) => void;
  onGoToMedications: () => void;
  onRegisterActivity: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

/**
 * «Hoy» (spec fase 15, RF-15.3, RF-15.4): lecturas del día frente a la meta, tomas pendientes
 * (con «Tomé» sin salir de la pantalla) y ejercicio. Solo lo que importa hoy.
 */
const TodayCard = ({
  streak,
  medications,
  exercise,
  busyMedicationId,
  onLogIntake,
  onGoToMedications,
  onRegisterActivity,
}: TodayCardProps) => {
  const pending = (medications ?? []).filter((medication) => pendingIntakes(medication) > 0);

  return (
    <Card padding="large" style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Hoy
      </Text>

      {streak ? (
        <Section title="Lecturas">
          <Text style={styles.line}>
            {streak.todayCount} de {streak.dailyGoal}{' '}
            {streak.dailyGoal === 1 ? 'lectura' : 'lecturas'}
          </Text>
          <ProgressBar
            value={streak.todayCount}
            max={streak.dailyGoal}
            label={`${streak.todayCount} de ${streak.dailyGoal} lecturas hoy`}
          />
        </Section>
      ) : null}

      {medications !== null ? (
        <Section title="Medicación">
          {medications.length === 0 ? (
            <Button
              title="Agregar mis medicamentos"
              variant="tertiary"
              size="small"
              onPress={onGoToMedications}
              style={styles.link}
            />
          ) : pending.length === 0 ? (
            <View style={styles.done}>
              <Icon name="check-circle" size={20} color={color.success} />
              <Text style={[styles.line, { color: color.success }]}>Tomas de hoy al día</Text>
            </View>
          ) : (
            pending.map((medication) => (
              <View key={medication.id} style={styles.medRow}>
                <View style={styles.medText}>
                  <Text style={styles.medName}>
                    {medication.name} · {medication.dosage}
                  </Text>
                  <Text style={styles.medHint}>
                    {pendingIntakes(medication)}{' '}
                    {pendingIntakes(medication) === 1 ? 'toma pendiente' : 'tomas pendientes'}
                  </Text>
                </View>
                <Button
                  title="Tomé"
                  size="small"
                  accessibilityLabel={`Registrar toma de ${medication.name}`}
                  loading={busyMedicationId === medication.id}
                  disabled={busyMedicationId !== null}
                  onPress={() => onLogIntake(medication)}
                />
              </View>
            ))
          )}
        </Section>
      ) : null}

      {exercise ? (
        <Section title="Ejercicio">
          <Text style={styles.line}>
            {exercise.todayMinutes} de {exercise.goalMinutes} min
          </Text>
          <ProgressBar
            value={exercise.todayMinutes}
            max={exercise.goalMinutes}
            label={`${exercise.todayMinutes} de ${exercise.goalMinutes} minutos de ejercicio hoy`}
          />
          <Button
            title="Registrar actividad"
            variant="tertiary"
            size="small"
            onPress={onRegisterActivity}
            style={styles.link}
          />
        </Section>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { rowGap: space.lg },
  title: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  section: { rowGap: space.sm },
  sectionTitle: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.textMuted,
  },
  line: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.text,
    fontWeight: '600',
  },
  done: { flexDirection: 'row', alignItems: 'center', columnGap: space.sm },
  link: { alignSelf: 'flex-start' },
  medRow: { flexDirection: 'row', alignItems: 'center', columnGap: space.md },
  medText: { flex: 1 },
  medName: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  medHint: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
});

export default TodayCard;
