import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FormError, Input } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { COLORS } from '@/src/shared/theme/colors';
import { exerciseApi } from '../api';
import { ACTIVITY_TYPE_OPTIONS } from '../constants';
import { ExerciseFormValues, exerciseFormSchema, formValuesToInput } from '../schemas';

const FIELDS = ['type', 'durationMinutes', 'notes'] as const;

/** Registro de una actividad (spec fase 12, RF-12.10); `minutes` llega desde el cronómetro. */
const ExerciseFormScreen = () => {
  const router = useRouter();
  const { minutes } = useLocalSearchParams<{ minutes?: string }>();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: { type: 'WALKING', durationMinutes: minutes ?? '', notes: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await exerciseApi.create(formValuesToInput(values));
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Registrar actividad" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.form}>
          <FormError message={formError} />

          <View style={styles.group}>
            <Text style={styles.label}>Tipo de actividad</Text>
            <View style={styles.pickerContainer}>
              <Controller
                control={control}
                name="type"
                render={({ field: { onChange, value } }) => (
                  <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                    {ACTIVITY_TYPE_OPTIONS.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                )}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Duración (minutos)</Text>
            <Controller
              control={control}
              name="durationMinutes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Ej. 30"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.durationMinutes?.message}
                  keyboardType="numeric"
                  maxLength={3}
                />
              )}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Ej. En el parque"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.notes?.message}
                  maxLength={200}
                />
              )}
            />
          </View>

          <Button
            title="Guardar actividad"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.save}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 4 },
  form: { padding: 20 },
  group: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 6 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  picker: { height: 50 },
  save: { marginTop: 12 },
});

export default ExerciseFormScreen;
