import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Chips, FormError, Input, Screen, useToast } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { exerciseApi } from '../api';
import { ACTIVITY_TYPE_OPTIONS } from '../constants';
import { ExerciseFormValues, exerciseFormSchema, formValuesToInput } from '../schemas';

const FIELDS = ['type', 'durationMinutes', 'notes'] as const;

/** Registro de una actividad (spec fase 12, RF-12.10); `minutes` llega desde el cronómetro. */
const ExerciseFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
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
      toast.show('Actividad guardada');
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  return (
    <Screen
      keyboard
      header={<ScreenHeader title="Registrar actividad" safeTop={false} />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Guardar actividad"
          size="large"
          onPress={onSubmit}
          loading={isSubmitting}
          loadingText="Guardando…"
          disabled={isSubmitting}
        />
      }
    >
      <FormError message={formError} />

      <Text style={styles.label}>Tipo de actividad</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <Chips
            label="Tipo de actividad"
            options={ACTIVITY_TYPE_OPTIONS}
            value={value}
            onChange={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="durationMinutes"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Duración (minutos)"
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

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Notas (opcional)"
            placeholder="Ej. En el parque"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.notes?.message}
            maxLength={200}
          />
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
});

export default ExerciseFormScreen;
