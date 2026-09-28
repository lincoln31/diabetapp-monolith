import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/src/shared/components/ui';
import ProgressBar from '@/src/shared/components/ui/ProgressBar';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, type } from '@/src/shared/theme/tokens';
import AdherenceCard from '../components/AdherenceCard';
import { useAdherence } from '../hooks/useAdherence';
import { useMedications } from '../hooks/useMedications';
import { Medication } from '../types';

interface MedicationRowProps {
  medication: Medication;
  busy: boolean;
  onLogIntake: () => void;
  onEdit: () => void;
}

const MedicationRow = ({ medication, busy, onLogIntake, onEdit }: MedicationRowProps) => {
  const { name, dosage, scheduledTimes, notes, takenToday } = medication;
  const total = scheduledTimes.length;

  return (
    <Card padding="large" style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.dosage}>{dosage}</Text>
      <Text style={styles.times}>Horarios: {scheduledTimes.join(' · ')}</Text>
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}

      <View style={styles.progress}>
        <Text style={styles.today}>
          {takenToday} de {total} {total === 1 ? 'toma' : 'tomas'} hoy
        </Text>
        <ProgressBar value={takenToday} max={total} label={`${takenToday} de ${total} tomas hoy`} />
      </View>

      <View style={styles.actions}>
        <Button
          title="Registrar toma"
          variant="secondary"
          onPress={onLogIntake}
          loading={busy}
          disabled={busy}
          accessibilityLabel={`Registrar toma de ${name}`}
          style={styles.actionMain}
        />
        <Button
          title="Editar"
          variant="tertiary"
          size="small"
          icon="edit"
          accessibilityLabel={`Editar ${name}`}
          onPress={onEdit}
        />
      </View>
    </Card>
  );
};

/**
 * Pestaña Medicación (spec fase 11, RF-11.8; rediseñada en la fase 15): adherencia arriba, una
 * tarjeta por medicamento con «Registrar toma», y «Agregar medicamento» fijo abajo.
 */
const MedicationsScreen = () => {
  const router = useRouter();
  const meds = useMedications();
  const adherence = useAdherence();
  const goToForm = () => router.push('/medications/form');

  const showAdherence =
    adherence.status === 'success' &&
    adherence.adherence &&
    (adherence.adherence.days7.percent !== null || adherence.adherence.days30.percent !== null);

  return (
    <Screen
      insetBottom={false}
      header={<ScreenHeader title="Medicación" showClose={false} safeTop={false} />}
      refreshing={meds.refreshing}
      onRefresh={meds.refresh}
      contentStyle={styles.content}
      footer={
        meds.status === 'success' && meds.medications.length > 0 ? (
          <Button title="Agregar medicamento" icon="plus" size="large" onPress={goToForm} />
        ) : undefined
      }
    >
      {meds.status === 'loading' ? <LoadingView /> : null}

      {meds.status === 'error' ? (
        <ErrorView message={meds.errorMessage ?? ''} offline={meds.offline} onRetry={meds.reload} />
      ) : null}

      {meds.status === 'success' ? (
        <>
          {showAdherence && adherence.adherence ? (
            <AdherenceCard adherence={adherence.adherence} />
          ) : null}

          {meds.medications.length === 0 ? (
            <EmptyView
              icon="medication"
              title="Aún no tienes medicamentos"
              message="Agrega tu primer medicamento para registrar tus tomas y ver tu adherencia."
              actionLabel="Agregar medicamento"
              onAction={goToForm}
            />
          ) : (
            meds.medications.map((medication) => (
              <MedicationRow
                key={medication.id}
                medication={medication}
                busy={meds.busyId === medication.id}
                onLogIntake={() => void meds.logIntake(medication)}
                onEdit={() =>
                  router.push({ pathname: '/medications/form', params: { id: medication.id } })
                }
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.lg },
  row: { rowGap: space.xs },
  name: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  dosage: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: color.text },
  times: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
  },
  notes: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    fontStyle: 'italic',
  },
  progress: { rowGap: space.sm, marginTop: space.sm },
  today: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  actions: { flexDirection: 'row', alignItems: 'center', columnGap: space.sm, marginTop: space.md },
  actionMain: { flex: 1 },
});

export default MedicationsScreen;
