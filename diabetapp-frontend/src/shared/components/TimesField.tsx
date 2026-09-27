import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Input } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';

interface TimesFieldProps {
  value: string[];
  onChange: (times: string[]) => void;
  error?: string;
  /** Permite quitar el último horario (lista vacía); por defecto se exige al menos uno. */
  allowEmpty?: boolean;
}

/**
 * Lista editable de horarios `HH:mm` (spec fase 11, D-11.5; compartida con la fase 13 y
 * rediseñada en la fase 15): cada horario con su etiqueta, «Quitar» accesible por horario,
 * y el error junto al campo con icono y texto.
 */
const TimesField = ({ value, onChange, error, allowEmpty = false }: TimesFieldProps) => {
  const setTime = (index: number, text: string) =>
    onChange(value.map((time, i) => (i === index ? text : time)));

  return (
    <View>
      {value.map((time, index) => (
        <View key={index} style={styles.row}>
          <Input
            label={`Horario ${index + 1}`}
            containerStyle={styles.input}
            placeholder="08:00"
            value={time}
            onChangeText={(text) => setTime(index, text)}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {allowEmpty || value.length > 1 ? (
            <Button
              title="Quitar"
              variant="tertiary"
              tone="danger"
              size="small"
              icon="trash"
              accessibilityLabel={`Quitar horario ${index + 1}`}
              onPress={() => onChange(value.filter((_, i) => i !== index))}
              style={styles.remove}
            />
          ) : null}
        </View>
      ))}

      {value.length < 10 ? (
        <Button
          title="Agregar horario"
          variant="secondary"
          icon="plus"
          onPress={() => onChange([...value, ''])}
        />
      ) : null}

      {error ? (
        <View style={styles.error}>
          <Icon name="alert" size={16} color={color.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', columnGap: space.sm },
  input: { flex: 1 },
  remove: { marginBottom: space.lg },
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
