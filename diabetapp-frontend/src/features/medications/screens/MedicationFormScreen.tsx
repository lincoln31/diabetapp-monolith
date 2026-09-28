import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  ErrorView,
  FormError,
  Input,
  LoadingView,
  Screen,
  useToast,
} from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import TimesField from '@/src/shared/components/TimesField';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { medicationsApi } from '../api';
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

/**
 * Alta y edición de un medicamento (spec fase 11, RF-11.9, RF-11.10; rediseñado en la fase 15):
 * botón principal fijo al pie y, al editar, «Dejar de usar» separado y con confirmación.
 */
const MedicationForm = ({ medication }: { medication: Medication | null }) => {
  const router = useRouter();
  const toast = useToast();
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
        toast.show('Cambios guardados');
      } else {
        await medicationsApi.create(input);
        toast.show('Medicamento guardado');
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
              toast.show('Medicamento archivado');
              router.back();
            } catch (error) {
              setFormError(toApiError(error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen
      keyboard
      header={
        <ScreenHeader
          title={medication ? 'Editar medicamento' : 'Nuevo medicamento'}
          safeTop={false}
        />
      }
      footer={
        <Button
          title={medication ? 'Guardar cambios' : 'Guardar medicamento'}
          size="large"
          onPress={onSubmit}
          loading={isSubmitting}
          loadingText="Guardando…"
          disabled={isSubmitting}
        />
      }
    >
      <FormError message={formError} />

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nombre"
            placeholder="Metformina"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            maxLength={80}
          />
        )}
      />

      <Controller
        control={control}
        name="dosage"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Dosis"
            placeholder="850 mg"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.dosage?.message}
            maxLength={40}
          />
        )}
      />

      <Text style={styles.label}>Horarios</Text>
      <Controller
        control={control}
        name="scheduledTimes"
        render={({ field: { onChange, value } }) => (
          <TimesField value={value} onChange={onChange} error={errors.scheduledTimes?.message} />
        )}
      />

      <View style={styles.notes}>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notas (opcional)"
              placeholder="Con las comidas"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.notes?.message}
              maxLength={300}
            />
          )}
        />
      </View>

      {medication ? (
        <View style={styles.danger}>
          <Button
            title="Dejar de usar este medicamento"
            variant="secondary"
            tone="danger"
            icon="trash"
            onPress={confirmArchive}
            disabled={isSubmitting}
          />
        </View>
      ) : null}
    </Screen>
  );
};

/** Carga el medicamento al editar (por el parámetro `id`) y muestra el formulario. */
const MedicationFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { status, medications, errorMessage, offline, reload } = useMedications();
  const editing = id ? (medications.find((item) => item.id === id) ?? null) : null;

  if (!id || (status === 'success' && editing)) {
    return <MedicationForm medication={editing} />;
  }

  return (
    <Screen header={<ScreenHeader title="Editar medicamento" safeTop={false} />}>
      {status === 'loading' ? <LoadingView /> : null}
      {status === 'error' ? (
        <ErrorView message={errorMessage ?? ''} offline={offline} onRetry={reload} />
      ) : null}
      {status === 'success' && !editing ? (
        <ErrorView message="No encontramos este medicamento." />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  notes: { marginTop: space.lg },
  danger: {
    marginTop: space.huge,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});

export default MedicationFormScreen;
