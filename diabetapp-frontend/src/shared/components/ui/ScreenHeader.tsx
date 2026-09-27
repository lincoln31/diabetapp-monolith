import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, gutter, space, type } from '../../theme/tokens';
import CloseButton from './CloseButton';

/**
 * Cabecera única de las pantallas apiladas (spec fase 15, RF-15.13): botón de cerrar + título,
 * respetando el área segura superior. Cuando la pantalla usa `Screen` (que ya reserva ese
 * espacio) se pasa `safeTop={false}`.
 */
const ScreenHeader = ({
  title,
  safeTop = true,
  showClose = true,
}: {
  title: string;
  safeTop?: boolean;
  /** `false` en las pantallas raíz de una pestaña, que no se cierran. */
  showClose?: boolean;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: (safeTop ? insets.top : 0) + space.sm }]}>
      {showClose ? <CloseButton /> : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingBottom: space.sm,
  },
  title: {
    flex: 1,
    fontSize: type.title.fontSize,
    lineHeight: type.title.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
});

export default ScreenHeader;
