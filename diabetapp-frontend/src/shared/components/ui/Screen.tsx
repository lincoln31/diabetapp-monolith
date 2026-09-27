import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, gutter } from '../../theme/tokens';

/**
 * Contenedor de pantalla (spec fase 15, RF-15.13): respeta las áreas seguras (barra de estado,
 * muesca, barra de gestos), desplaza el contenido, gestiona el teclado y admite un pie fijo
 * (la acción principal queda en la zona del pulgar). Sustituye a los `ScrollView` y
 * `paddingTop` sueltos de cada pantalla.
 */
interface ScreenProps {
  children: React.ReactNode;
  /** Desplazable (por defecto). Con `false` el contenido llena la pantalla. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Contenido fijo al pie (p. ej. el botón principal de un formulario). */
  footer?: React.ReactNode;
  /** Ajusta la pantalla al teclado (formularios). */
  keyboard?: boolean;
  /** `false` cuando una barra inferior (pestañas) ya cubre el área segura de abajo. */
  insetBottom?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

const Screen = ({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  footer,
  keyboard = false,
  insetBottom = true,
  contentStyle,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();
  const bottom = insetBottom ? insets.bottom : 0;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: gutter + (footer ? 0 : bottom) },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  const inner = (
    <>
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: gutter + bottom }]}>{footer}</View>
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  flex: { flex: 1 },
  content: { padding: gutter },
  footer: {
    paddingHorizontal: gutter,
    paddingTop: gutter,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});

export default Screen;
