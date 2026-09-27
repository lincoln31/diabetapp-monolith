import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Icon } from '@/src/shared/components/ui';
import { color, radius, space, touch, type } from '@/src/shared/theme/tokens';

interface TimesFieldProps {
  value: string[];
  onChange: (times: string[]) => void;
  error?: string;
  /** Permite quitar el último horario (lista vacía); por defecto se exige al menos uno. */
  allowEmpty?: boolean;
}

/** `HH:mm` (24 h, como lo guarda el backend) → `Date` de hoy con esa hora. */
const timeToDate = (time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 8, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
};

/** `Date` → `HH:mm` (24 h) para guardar. */
const dateToTime = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** `HH:mm` → «8:00 a. m.» para mostrar, sin ambigüedad de AM/PM. */
const formatTime = (time: string): string =>
  timeToDate(time).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

/**
 * Lista editable de horarios (spec fase 11, D-11.5; compartida con la fase 13; el reloj nativo
 * sustituye al texto libre en la fase 15 tras verificación en dispositivo: escribir `HH:mm` a
 * mano no dejaba claro si una hora era a. m. o p. m.). Cada horario se elige con el selector de
 * hora del sistema (12 h con a. m./p. m., o 24 h si así lo tiene configurado el celular) y se
 * guarda como `HH:mm` de 24 h, que es lo que espera el backend.
 */
const TimesField = ({ value, onChange, error, allowEmpty = false }: TimesFieldProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const openPicker = (index: number) => setEditingIndex(index);

  const onPickerChange = (_event: unknown, selected?: Date) => {
    const index = editingIndex;
    setEditingIndex(null);
    if (!selected || index === null) return;
    onChange(value.map((time, i) => (i === index ? dateToTime(selected) : time)));
  };

  const addTime = () => {
    onChange([...value, '08:00']);
    setEditingIndex(value.length);
  };

  return (
    <View>
      {value.map((time, index) => (
        <View key={index} style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              time
                ? `Horario ${index + 1}: ${formatTime(time)}. Toca para cambiarlo`
                : `Elegir horario ${index + 1}`
            }
            onPress={() => openPicker(index)}
            style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
          >
            <Icon name="today" size={20} color={color.textMuted} />
            <View style={styles.fieldText}>
              <Text style={styles.label}>Horario {index + 1}</Text>
              <Text style={styles.value}>{time ? formatTime(time) : 'Elegir hora'}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={color.textMuted} />
          </Pressable>
          {allowEmpty || value.length > 1 ? (
            <Button
              title="Quitar"
              variant="tertiary"
              tone="danger"
              size="small"
              icon="trash"
              accessibilityLabel={`Quitar horario ${index + 1}`}
              onPress={() => onChange(value.filter((_, i) => i !== index))}
            />
          ) : null}
        </View>
      ))}

      {value.length < 10 ? (
        <Button title="Agregar horario" variant="secondary" icon="plus" onPress={addTime} />
      ) : null}

      {error ? (
        <View style={styles.error}>
          <Icon name="alert" size={16} color={color.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {editingIndex !== null ? (
        <DateTimePicker
          value={timeToDate(value[editingIndex] || '08:00')}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', columnGap: space.sm, marginBottom: space.sm },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.sm,
    minHeight: touch.min,
    paddingHorizontal: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  fieldPressed: { backgroundColor: color.primarySoft },
  fieldText: { flex: 1 },
  label: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
  value: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: space.xs,
    marginTop: space.sm,
  },
  errorText: {
    flexShrink: 1,
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    fontWeight: '600',
    color: color.danger,
  },
});

export default TimesField;
