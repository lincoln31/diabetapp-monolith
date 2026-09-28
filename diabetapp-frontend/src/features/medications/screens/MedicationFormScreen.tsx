import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FormError, Input } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { COLORS } from '@/src/shared/theme/colors';
import { medicationsApi } from '../api';
import TimesField from '../components/TimesField';
import { useMedications } from '../hooks/useMedications';
import {
  MedicationFormValues,
  emptyMedicationForm,
  formValuesToInput,
  medicationFormSchema,
  medicationToFormValues,
} from '../schemas';
import { Medication } from '../types';

const FIELDS = ['name', 'dosage', 'scheduledTimes', 'notes'] as const;

/** Formulario de alta y edición (spec fase 11, RF-11.9, RF-11.10). */
const MedicationForm = ({ medication }: { medication: Medication | null }) => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: medication ? medicationToFormValues(medication) : emptyMedicationForm,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const input = formValuesToInput(values);
      if (medication) {
        await medicationsApi.update(medication.id, input);
      } else {
        await medicationsApi.create(input);
      }
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  const confirmArchive = () => {
    if (!medication) return;

    Alert.alert(
      'Dejar de usar',
      `¿Dejar de usar ${medication.name}? Dejará de aparecer en tu lista, pero tu historial se conserva.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dejar de usar',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationsApi.archive(medication.id);
              router.back();
            } catch (error) {
              setFormError(toApiError(error).message);
            }
          },
        },
      ],
    );
  };

  const textField = (
    name: 'name' | 'dosage' | 'notes',
    label: string,
    placeholder: string,
    maxLength: number,
  ) => (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors[name]?.message}
            maxLength={maxLength}
          />
        )}
      />
    </View>
  );

  return (
    <Card style={styles.form}>
      <FormError message={formError} />

      {textField('name', 'Nombre', 'Metformina', 80)}
      {textField('dosage', 'Dosis', '850 mg', 40)}

      <View style={styles.group}>
        <Text style={styles.label}>Horarios (24 horas)</Text>
        <Controller
          control={control}
          name="scheduledTimes"
          render={({ field: { onChange, value } }) => (
            <TimesField value={value} onChange={onChange} error={errors.scheduledTimes?.message} />
          )}
        />
      </View>

      {textField('notes', 'Notas (opcional)', 'Con las comidas', 300)}

      <Button
        title={medication ? 'Guardar cambios' : 'Guardar medicamento'}
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.save}
      />

      {medication && (
        <Button
          title="Dejar de usar este medicamento"
          variant="outline"
          onPress={confirmArchive}
          style={styles.archive}
        />
      )}
    </Card>
  );
};

const MedicationFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { status, medications, errorMessage, reload } = useMedications();
  const editing = id ? (medications.find((item) => item.id === id) ?? null) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title={id ? 'Editar medicamento' : 'Nuevo medicamento'} />

      {id && status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {id && status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Reintentar" variant="outline" onPress={reload} />
        </View>
      )}

      {id && status === 'success' && !editing && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No encontramos este medicamento.</Text>
        </View>
      )}

      {(!id || (status === 'success' && editing)) && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <MedicationForm medication={editing} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
  form: { padding: 20 },
  group: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 6 },
  save: { marginTop: 12 },
  archive: { marginTop: 12 },
});

export default MedicationFormScreen;
