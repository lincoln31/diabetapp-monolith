import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import axios from 'axios';

const AddGlucoseScreen = () => {
  const router = useRouter();

  // Estados del formulario
  const [glucoseValue, setGlucoseValue] = useState('');
  const [momentOfDay, setMomentOfDay] = useState('ayunas');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para el DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Opciones para momento del día
  const momentOptions = [
    { label: 'En ayunas', value: 'ayunas' },
    { label: 'Después del desayuno', value: 'desayuno' },
    { label: 'Después del almuerzo', value: 'almuerzo' },
    { label: 'Después de la cena', value: 'cena' },
    { label: 'Antes de dormir', value: 'nocturna' },
    { label: 'Otro momento', value: 'otro' },
  ];

  // Validar el valor de glucosa
  const validateGlucoseValue = (value: string): string | null => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'El valor debe ser un número válido';
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
        value: parseFloat(glucoseValue),
        momentOfDay,
        notes: notes.trim(),
        timestamp: timestamp.toISOString(),
        userId: 'USER_ID', // Aquí iría el ID del usuario autenticado
      };

      // Llamada a la API del backend
      const response = await axios.post('/api/glucose/record', payload, {
        headers: {
          'Authorization': `Bearer ${userToken}`, // Token JWT del usuario
          'Content-Type': 'application/json',
        },
      });

      // Manejar respuesta exitosa
      if (response.status === 201 || response.status === 200) {
        Alert.alert(
          '¡Éxito!',
          'Registro de glucosa guardado correctamente',
          [
            {
              text: 'OK',
              onPress: () => router.back(), // Cerrar la pantalla modal
            },
          ]
        );
      }

    } catch (error) {
      console.error('Error saving glucose reading:', error);
      
      let errorMessage = 'No se pudo guardar el registro. Revisa tu conexión a internet.';
      
      if (axios.isAxiosError(error) && error.response) {
        // El servidor respondió con un error
        if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.response.status === 400) {
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        }
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nueva Medición de Glucosa</Text>
        </View>

        <View style={styles.form}>
          {/* Campo de Glucosa */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nivel de Glucosa (mg/dL) *</Text>
            <TextInput
              style={[styles.input, styles.glucoseInput]}
              value={glucoseValue}
              onChangeText={setGlucoseValue}
              placeholder="Ej: 120"
              keyboardType="numeric"
              maxLength={3}
              textAlign="center"
            />
          </View>

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
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>📅 {formatDate(timestamp)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>🕐 {formatTime(timestamp)}</Text>
              </TouchableOpacity>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="¿Cómo te sientes? ¿Qué comiste? ¿Hiciste ejercicio?"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.charCounter}>{notes.length}/200 caracteres</Text>
          </View>

          {/* Botón de Ahora */}
          <TouchableOpacity
            style={styles.nowButton}
            onPress={() => setTimestamp(new Date())}
          >
            <Text style={styles.nowButtonText}>🕐 Usar fecha y hora actual</Text>
          </TouchableOpacity>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isLoading || !glucoseValue.trim()) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading || !glucoseValue.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Registrar Glucosa</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Información de referencia */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Niveles de referencia:</Text>
          <Text style={styles.infoText}>• Normal: 70-140 mg/dL</Text>
          <Text style={styles.infoText}>• Consulta a tu médico para rangos personalizados</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  glucoseInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    borderColor: '#007bff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    backgroundColor: '#fff',
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
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#495057',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 4,
  },
  nowButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  nowButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    marginBottom: 2,
  },
});

export default AddGlucoseScreen;