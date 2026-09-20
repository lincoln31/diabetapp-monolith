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
import { Card, Input, Button, Icon } from '../../../src/components/ui';
import apiClient, { getApiError, getFirstFieldMessage } from '../../../src/api/apiClient';
import { API_CONFIG, COLORS } from '../../../src/constants/config';
import { validateRequired } from '../../../src/utils/validation';

const AddGlucoseScreen = () => {
  const router = useRouter();

  // Estados del formulario
  const [glucoseValue, setGlucoseValue] = useState('');
  const [momentOfDay, setMomentOfDay] = useState('BEFORE_BREAKFAST');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Opciones para momento del día (los valores deben coincidir con el enum del backend)
  const momentOptions = [
    { label: 'En ayunas', value: 'BEFORE_BREAKFAST' },
    { label: 'Después del desayuno', value: 'AFTER_BREAKFAST' },
    { label: 'Antes del almuerzo', value: 'BEFORE_LUNCH' },
    { label: 'Después del almuerzo', value: 'AFTER_LUNCH' },
    { label: 'Antes de la cena', value: 'BEFORE_DINNER' },
    { label: 'Después de la cena', value: 'AFTER_DINNER' },
    { label: 'Antes de dormir', value: 'BEFORE_SLEEP' },
    { label: 'Otro momento', value: 'OTHER' },
  ];

  // Validar el valor de glucosa
  const validateGlucoseValue = (value: string): string | null => {
    const numValue = Number(value);
    if (!Number.isInteger(numValue)) {
      return 'El valor debe ser un número entero';
    }
    if (numValue < 20 || numValue > 600) {
      return 'El valor debe estar entre 20 y 600 mg/dL';
    }
    return null;
  };

  // Función para manejar el cambio de fecha
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newTimestamp = new Date(timestamp);
      newTimestamp.setFullYear(selectedDate.getFullYear());
      newTimestamp.setMonth(selectedDate.getMonth());
      newTimestamp.setDate(selectedDate.getDate());
      setTimestamp(newTimestamp);
    }
  };

  // Función para manejar el cambio de hora
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newTimestamp = new Date(timestamp);
      newTimestamp.setHours(selectedTime.getHours());
      newTimestamp.setMinutes(selectedTime.getMinutes());
      setTimestamp(newTimestamp);
    }
  };

  // Función principal para guardar el registro
  const handleSave = async () => {
    // Validaciones del frontend
    if (!glucoseValue.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un valor de glucosa');
      return;
    }
    const validationError = validateGlucoseValue(glucoseValue);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }
    setIsLoading(true);
    try {
      // Preparar el objeto de datos
      const payload = {
        value: Number(glucoseValue),
        momentOfDay,
        notes: notes.trim() || undefined,
        timestamp: timestamp.toISOString(),
      };
      // Llamada a la API del backend (el token se agrega automáticamente)
      const response = await apiClient.post(API_CONFIG.endpoints.glucose.add, payload);
      if (response.status === 201 || response.status === 200) {
        Alert.alert(
          '¡Éxito!',
          'Registro de glucosa guardado correctamente',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      const apiError = getApiError(error);
      let errorMessage = apiError.message;

      if (apiError.code === 'UNAUTHENTICATED' || apiError.code === 'TOKEN_EXPIRED') {
        errorMessage = 'Tu sesión expiró. Inicia sesión nuevamente.';
      } else if (apiError.code === 'VALIDATION_ERROR') {
        errorMessage = getFirstFieldMessage(apiError) ?? apiError.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formatear hora para mostrar
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
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
          {/* Campo de Glucosa */}
          <Input
            icon="chart"
            placeholder="Nivel de Glucosa (mg/dL) *"
            value={glucoseValue}
            onChangeText={setGlucoseValue}
            keyboardType="numeric"
            maxLength={3}
            style={styles.glucoseInput}
          />

          {/* Momento del Día */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Momento del día</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={momentOfDay}
                onValueChange={(value) => setMomentOfDay(value)}
                style={styles.picker}
              >
                {momentOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Fecha y Hora */}
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

          {/* DateTimePickers */}
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

          {/* Notas */}
          <Input
            icon="note"
            placeholder="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
            maxLength={200}
          />
          <Text style={styles.charCounter}>{notes.length}/200 caracteres</Text>

          {/* Botón de Ahora */}
          <Button
            variant="secondary"
            size="small"
            style={styles.nowButton}
            onPress={() => setTimestamp(new Date())}
            title="🕐 Usar fecha y hora actual"
          />

          {/* Botón Guardar */}
          <Button
            title="Registrar Glucosa"
            onPress={handleSave}
            loading={isLoading}
            style={styles.saveButton}
            disabled={isLoading || !glucoseValue.trim()}
          />
        </Card>

        {/* Información de referencia */}
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