import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Chips,
  FormError,
  Input,
  Screen,
  useToast,
} from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useProfile } from '@/src/features/profile';
import { ensurePermission, scheduleReminder } from '@/src/features/notifications';
import { glucoseApi } from '../api';
import { GLUCOSE_MAX, GLUCOSE_MIN, MOMENT_OF_DAY_OPTIONS, NOTES_MAX_LENGTH } from '../constants';
import { formatWhen } from '../history';
import { suggestMomentOfDay } from '../momentOfDay';
import { getRangeStatus } from '../rangeStatus';
import { CreateGlucoseFormValues, createGlucoseFormSchema } from '../schemas';
import { GlucoseReading } from '../types';
import RangeAlert from './RangeAlert';

const FIELDS = ['value', 'momentOfDay', 'notes', 'timestamp'] as const;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
// Función de módulo, no del cuerpo del componente: `Date.now()` es impura y
// `react-hooks/purity` no permite llamarla directamente al renderizar.
const isFuture = (date: Date): boolean => date.getTime() > Date.now();

interface GlucoseFormProps {
  /** Con una medición existente el formulario edita; sin ella, registra una nueva. */
  reading?: GlucoseReading;
}

/**
 * Registrar o editar una medición (spec fase 15, RF-15.8, RF-15.9): el valor primero y grande,
 * «Ahora» y el momento del día ya propuestos, notas plegadas, botón principal fijo al pie y
 * confirmación no bloqueante. Al editar se añade «Borrar medición», separada y con confirmación.
 */
const GlucoseForm = ({ reading }: GlucoseFormProps) => {
  const router = useRouter();
  const toast = useToast();
  const editing = reading !== undefined;

  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [momentTouched, setMomentTouched] = useState(editing);
  const [showNotes, setShowNotes] = useState(Boolean(reading?.notes));
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [remindLater, setRemindLater] = useState(false);

  const initialTimestamp = reading ? new Date(reading.timestamp) : new Date();

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateGlucoseFormValues>({
    resolver: zodResolver(createGlucoseFormSchema),
    defaultValues: {
      value: reading ? String(reading.value) : '',
      momentOfDay: reading ? reading.momentOfDay : suggestMomentOfDay(initialTimestamp),
      notes: reading?.notes ?? '',
      timestamp: initialTimestamp,
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const timestamp = useWatch({ control, name: 'timestamp' });
  const notes = useWatch({ control, name: 'notes' });
  const glucoseValue = useWatch({ control, name: 'value' });

  // Si el perfil no carga, no hay rango y el aviso simplemente no aparece (spec fase 7, RF-7.12)
  const { profile } = useProfile();
  const min = profile?.targetGlucoseMin ?? null;
  const max = profile?.targetGlucoseMax ?? null;
  const rangeStatus = getRangeStatus(
    glucoseValue.trim() === '' ? NaN : Number(glucoseValue),
    min,
    max,
  );

  const changeTimestamp = (next: Date) => {
    setValue('timestamp', next);
    // Mientras el paciente no elija el momento a mano, sigue a la hora
    if (!momentTouched) setValue('momentOfDay', suggestMomentOfDay(next));
  };

  // «Cambiar» abre primero el día y después la hora
  const onPickerChange = (_event: unknown, selected?: Date) => {
    const mode = pickerMode;
    setPickerMode(null);
    if (!selected || !mode) return;

    const next = new Date(timestamp);
    if (mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      changeTimestamp(next);
      setPickerMode('time');
    } else {
      next.setHours(selected.getHours(), selected.getMinutes());
      changeTimestamp(next);
    }
  };

  /** «Recordármelo en 2 horas»: un aviso puntual, no la reprogramación diaria de la fase 13. */
  const scheduleTwoHourReminder = async (readingId: string, glucoseValue: number) => {
    const remindAt = new Date(timestamp.getTime() + TWO_HOURS_MS);
    if (!isFuture(remindAt)) return; // Hora ya pasada: no tiene sentido avisar

    const permission = await ensurePermission();
    if (permission !== 'granted') {
      toast.show('No se pudo programar el recordatorio: activa las notificaciones');
      return;
    }

    await scheduleReminder(
      `glucose-reminder-${readingId}`,
      'Hora de tu próxima medición',
      `Registraste ${glucoseValue} mg/dL hace 2 horas. Es un buen momento para volver a medir.`,
      remindAt,
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input = {
      value: Number(values.value),
      momentOfDay: values.momentOfDay,
      notes: values.notes.trim() || undefined,
      timestamp: values.timestamp.toISOString(),
    };

    try {
      if (reading) {
        await glucoseApi.update(reading.id, { ...input, notes: values.notes.trim() });
        if (remindLater) await scheduleTwoHourReminder(reading.id, input.value);
        toast.show('Cambios guardados');
      } else {
        const created = await glucoseApi.create(input);
        if (remindLater) await scheduleTwoHourReminder(created.id, input.value);
        toast.show(`Medición guardada: ${input.value} mg/dL`);
      }
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  const confirmDelete = () => {
    if (!reading) return;

    Alert.alert('Borrar medición', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await glucoseApi.remove(reading.id);
            toast.show('Medición borrada');
            router.back();
          } catch (error) {
            setDeleting(false);
            setFormError(toApiError(error).message);
          }
        },
      },
    ]);
  };

  return (
    <Screen
      keyboard
      header={
        <ScreenHeader title={editing ? 'Editar medición' : 'Registrar glucosa'} safeTop={false} />
      }
      footer={
        <Button
          title={editing ? 'Guardar cambios' : 'Guardar medición'}
          size="large"
          onPress={onSubmit}
          loading={isSubmitting}
          loadingText="Guardando…"
          disabled={isSubmitting || deleting}
        />
      }
    >
      <FormError message={formError} />

      <Controller
        control={control}
        name="value"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nivel de glucosa"
            helper={`mg/dL · entre ${GLUCOSE_MIN} y ${GLUCOSE_MAX}`}
            placeholder="110"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.value?.message}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus={!editing}
            style={styles.valueInput}
          />
        )}
      />

      <RangeAlert status={rangeStatus} min={min} max={max} />

      <Button
        title="Calcular dosis de insulina"
        variant="tertiary"
        icon="pulse"
        onPress={() =>
          router.push({
            pathname: '/education/insulin-calculator',
            params: glucoseValue.trim() !== '' ? { glucose: glucoseValue } : undefined,
          })
        }
        style={styles.insulinButton}
      />

      <Text style={styles.label}>Cuándo</Text>
      <View style={styles.whenRow}>
        <Text style={styles.when}>{formatWhen(timestamp.toISOString())}</Text>
        <Button
          title="Cambiar"
          variant="tertiary"
          size="small"
          icon="calendar"
          onPress={() => setPickerMode('date')}
        />
      </View>
      {errors.timestamp?.message ? (
        <Text style={styles.error}>{errors.timestamp.message}</Text>
      ) : null}

      {pickerMode ? (
        <DateTimePicker
          value={timestamp}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          maximumDate={pickerMode === 'date' ? new Date() : undefined}
        />
      ) : null}

      <Text style={styles.label}>Momento del día</Text>
      <Controller
        control={control}
        name="momentOfDay"
        render={({ field: { onChange, value } }) => (
          <Chips
            label="Momento del día"
            options={MOMENT_OF_DAY_OPTIONS}
            value={value}
            onChange={(next) => {
              setMomentTouched(true);
              onChange(next);
            }}
          />
        )}
      />

      <Checkbox
        checked={remindLater}
        onPress={() => setRemindLater((v) => !v)}
        label="Recordármelo en 2 horas"
        containerStyle={styles.remindLater}
      />

      <View style={styles.notes}>
        {showNotes ? (
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nota"
                helper={`${notes.length}/${NOTES_MAX_LENGTH} caracteres`}
                placeholder="Ej. Después de caminar"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.notes?.message}
                multiline
                maxLength={NOTES_MAX_LENGTH}
                style={styles.notesInput}
              />
            )}
          />
        ) : (
          <Button
            title="Agregar nota"
            variant="tertiary"
            icon="note"
            onPress={() => setShowNotes(true)}
            style={styles.addNote}
          />
        )}
      </View>

      {editing ? (
        <View style={styles.danger}>
          <Button
            title="Borrar medición"
            variant="destructive"
            icon="trash"
            onPress={confirmDelete}
            disabled={isSubmitting}
            loading={deleting}
          />
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  valueInput: {
    fontSize: type.display.fontSize,
    lineHeight: type.display.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
    marginTop: space.sm,
    marginBottom: space.xs,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  when: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: color.text },
  insulinButton: { alignSelf: 'flex-start', marginBottom: space.sm },
  error: { fontSize: type.caption.fontSize, color: color.danger, fontWeight: '600' },
  remindLater: { marginTop: space.lg },
  notes: { marginTop: space.lg },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  addNote: { alignSelf: 'flex-start' },
  danger: {
    marginTop: space.huge,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});

export default GlucoseForm;
