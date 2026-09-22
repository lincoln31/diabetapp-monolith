import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../theme/colors';

/** Error general del formulario: lo que no corresponde a un campo concreto. */
const FormError = ({ message }: { message?: string | null }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FormError;
