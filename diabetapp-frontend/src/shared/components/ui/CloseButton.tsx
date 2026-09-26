import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from './Icon';
import { COLORS } from '../../theme/colors';

/**
 * Botón «✕» para volver desde una pantalla secundaria. Es un icono propio (no un `Button`
 * pequeño): el texto «✕» dentro del botón de 32 px quedaba recortado y se veía un círculo vacío.
 * Como `ScreenHeader`, se importa por su ruta y no desde el barril `ui/index.ts` (usa `expo-router`).
 */
const CloseButton = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Cerrar"
      onPress={() => router.back()}
      style={styles.button}
    >
      <Icon name="close" size={20} color={COLORS.gray[700]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CloseButton;
