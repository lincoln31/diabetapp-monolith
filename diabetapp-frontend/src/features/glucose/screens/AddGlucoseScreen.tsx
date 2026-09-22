import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FormError, Input } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { COLORS } from '@/src/shared/theme/colors';
import { glucoseApi } from '../api';
import { MOMENT_OF_DAY_OPTIONS, NOTES_MAX_LENGTH } from '../constants';
import { CreateGlucoseFormValues, createGlucoseFormSchema } from '../schemas';

const FIELDS = ['value', 'momentOfDay', 'notes', 'timestamp'] as const;

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const AddGlucoseScreen = () => {
  const router = useRouter();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateGlucoseFormValues>({
    resolver: zodResolver(createGlucoseFormSchema),
    defaultValues: {
      value: '',
      momentOfDay: 'BEFORE_BREAKFAST',
      notes: '',
      timestamp: new Date(),
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const timestamp = useWatch({ control, name: 'timestamp' });
  const notes = useWatch({ control, name: 'notes' });

  // El selector de fecha solo cambia el día; el de hora, la hora
  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    const next = new Date(timestamp);
    next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setValue('timestamp', next);
  };

  const onTimeChange = (_event: unknown, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (!selectedTime) return;

    const next = new Date(timestamp);
    next.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    setValue('timestamp', next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await glucoseApi.create({
        value: Number(values.value),
        momentOfDay: values.momentOfDay,
        notes: values.notes.trim() || undefined,
        timestamp: values.timestamp.toISOString(),
      });

      Alert.alert('¡Éxito!', 'Registro de glucosa guardado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Button
            variant="outline"
            size="small"
            style={styles.closeButton}
            onPress={() => router.back()}
            title="✕"
          />
          <Text style={styles.title}>Nueva Medición de Glucosa</Text>
        </View>

        <Card style={styles.form}>
          <FormError message={formError} />

          <Controller
            control={control}
            name="value"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="chart"
                placeholder="Nivel de Glucosa (mg/dL) *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.value?.message}
                keyboardType="numeric"
                maxLength={3}
                style={styles.glucoseInput}
              />
            )}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Momento del día</Text>
            <View style={styles.pickerContainer}>
              <Controller
                control={control}
                name="momentOfDay"
                render={({ field: { onChange, value } }) => (
                  <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                    {MOMENT_OF_DAY_OPTIONS.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                )}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha y hora</Text>
            <View style={styles.dateTimeContainer}>
              <Button
                variant="outline"
                size="small"
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                title={`📅 ${formatDate(timestamp)}`}
              />
              <Button
                variant="outline"
                size="small"
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                title={`🕐 ${formatTime(timestamp)}`}
              />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={timestamp}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={timestamp}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="note"
                placeholder="Notas (opcional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.notes?.message}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                maxLength={NOTES_MAX_LENGTH}
              />
            )}
          />
          <Text style={styles.charCounter}>
            {notes.length}/{NOTES_MAX_LENGTH} caracteres
          </Text>

          <Button
            variant="secondary"
            size="small"
            style={styles.nowButton}
            onPress={() => setValue('timestamp', new Date())}
            title="🕐 Usar fecha y hora actual"
          />

          <Button
            title="Registrar Glucosa"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
          />
        </Card>

        <Card style={styles.infoContainer} variant="motivation">
          <Text style={styles.infoTitle}>ℹ️ Niveles de referencia:</Text>
          <Text style={styles.infoText}>• Normal: 70-140 mg/dL</Text>
          <Text style={styles.infoText}>• Consulta a tu médico para rangos personalizados</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    flex: 1,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  glucoseInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    borderColor: COLORS.primary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  picker: {
    height: 50,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  nowButton: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 8,
  },
  infoContainer: {
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 2,
  },
});

export default AddGlucoseScreen;
