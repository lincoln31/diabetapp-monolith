import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { color, radius, space, touch } from '../../theme/tokens';
import Icon from './Icon';

/**
 * Botón «✕» para volver desde una pantalla secundaria (spec fase 15): icono propio, área táctil
 * de 48 dp y nombre accesible. Como `ScreenHeader`, se importa por su ruta y no desde el barril
 * `ui/index.ts` (usa `expo-router`).
 */
const CloseButton = () => {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar"
      onPress={() => router.back()}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="close" size={24} color={color.text} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    marginRight: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.disabledBg },
});

export default CloseButton;
