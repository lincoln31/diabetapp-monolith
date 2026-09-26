import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { COLORS } from '@/src/shared/theme/colors';
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

  return (
    <Card padding="large" style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.dosage}>{dosage}</Text>
      <Text style={styles.times}>Horarios: {scheduledTimes.join(' · ')}</Text>
      {notes && <Text style={styles.notes}>{notes}</Text>}

      <Text style={styles.today}>
        {takenToday} de {scheduledTimes.length} {scheduledTimes.length === 1 ? 'toma' : 'tomas'} hoy
      </Text>

      <View style={styles.actions}>
        <Button
          title="Registrar toma"
          size="small"
          onPress={onLogIntake}
          loading={busy}
          disabled={busy}
          style={styles.actionMain}
        />
        <Button title="Editar" variant="outline" size="small" onPress={onEdit} />
      </View>
    </Card>
  );
};

/** Pantalla «Mis Medicamentos» (spec fase 11, RF-11.8, RF-11.11, RF-11.13). */
const MedicationsScreen = () => {
  const router = useRouter();
  const { status, medications, errorMessage, busyId, reload, logIntake } = useMedications();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mis Medicamentos" />

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

      {status === 'success' && (
        <ScrollView contentContainerStyle={styles.list}>
          {medications.length === 0 && (
            <Card padding="large" style={styles.empty}>
              <Text style={styles.emptyTitle}>Aún no tienes medicamentos</Text>
              <Text style={styles.emptyText}>
                Agrega tu primer medicamento para registrar tus tomas y ver tu adherencia.
              </Text>
            </Card>
          )}

          {medications.map((medication) => (
            <MedicationRow
              key={medication.id}
              medication={medication}
              busy={busyId === medication.id}
              onLogIntake={() => void logIntake(medication.id)}
              onEdit={() =>
                router.push({ pathname: '/medications/form', params: { id: medication.id } })
              }
            />
          ))}

          <Button
            title="Agregar medicamento"
            onPress={() => router.push('/medications/form')}
            style={styles.add}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
  list: { padding: 20, paddingTop: 4 },
  row: { marginBottom: 12 },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.gray[900] },
  dosage: { fontSize: 14, color: COLORS.gray[600], marginTop: 2 },
  times: { fontSize: 13, color: COLORS.gray[500], marginTop: 6 },
  notes: { fontSize: 13, color: COLORS.gray[500], marginTop: 4, fontStyle: 'italic' },
  today: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800], marginTop: 10 },
  actions: { flexDirection: 'row', columnGap: 8, marginTop: 12 },
  actionMain: { flex: 1 },
  empty: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  emptyText: { fontSize: 14, color: COLORS.gray[600], marginTop: 6, lineHeight: 20 },
  add: { marginTop: 4 },
});

export default MedicationsScreen;
