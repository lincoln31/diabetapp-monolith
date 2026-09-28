import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';

interface TimesFieldProps {
  value: string[];
  onChange: (times: string[]) => void;
  error?: string;
}

/** Lista editable de horarios `HH:mm` (spec fase 11, D-11.5): agregar y quitar. */
const TimesField = ({ value, onChange, error }: TimesFieldProps) => {
  const setTime = (index: number, text: string) =>
    onChange(value.map((time, i) => (i === index ? text : time)));

  return (
    <View>
      {value.map((time, index) => (
        <View key={index} style={styles.row}>
          <Input
            containerStyle={styles.input}
            placeholder="08:00"
            value={time}
            onChangeText={(text) => setTime(index, text)}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {value.length > 1 && (
            <Button
              title="Quitar"
              variant="outline"
              size="small"
              onPress={() => onChange(value.filter((_, i) => i !== index))}
              style={styles.remove}
            />
          )}
        </View>
      ))}

      {value.length < 10 && (
        <Button
          title="Agregar horario"
          variant="outline"
          size="small"
          onPress={() => onChange([...value, ''])}
          style={styles.add}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  input: { flex: 1 },
  add: { marginBottom: 12 },
  remove: { marginBottom: 12 },
  error: { fontSize: 12, color: COLORS.error, marginTop: 6 },
});

export default TimesField;
