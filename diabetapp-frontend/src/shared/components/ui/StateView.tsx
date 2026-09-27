import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '../../theme/tokens';
import Button from './Button';
import Icon, { AppIconName } from './Icon';

/**
 * Estados de una pantalla con datos (spec fase 15, RF-15.14): cargando, vacío, error y sin
 * conexión. Cada uno dice qué pasa y ofrece **una** acción clara.
 */

export const LoadingView = ({ label = 'Cargando…' }: { label?: string }) => (
  <View style={styles.center} accessibilityLiveRegion="polite" accessibilityLabel={label}>
    <ActivityIndicator size="large" color={color.primary} />
    <Text style={styles.muted}>{label}</Text>
  </View>
);

interface EmptyViewProps {
  icon?: AppIconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyView = ({
  icon = 'info',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyViewProps) => (
  <View style={styles.center}>
    <View style={styles.iconCircle}>
      <Icon name={icon} size={28} color={color.primary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <Button title={actionLabel} onPress={onAction} style={styles.action} />
    ) : null}
  </View>
);

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  /** Sin conexión con el servidor (cambia el icono y el título). */
  offline?: boolean;
}

export const ErrorView = ({ message, onRetry, offline = false }: ErrorViewProps) => (
  <View style={styles.center} accessible accessibilityRole="alert">
    <View style={[styles.iconCircle, styles.dangerCircle]}>
      <Icon name={offline ? 'offline' : 'alert'} size={28} color={color.danger} />
    </View>
    <Text style={styles.title}>{offline ? 'Sin conexión' : 'No pudimos cargar esto'}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry ? (
      <Button
        title="Reintentar"
        variant="secondary"
        icon="refresh"
        onPress={onRetry}
        style={styles.action}
      />
    ) : null}
  </View>
);

/** Bloque gris con la altura final del contenido: evita saltos de layout al cargar (A14). */
export const Skeleton = ({ height = 96 }: { height?: number }) => (
  <View
    style={[styles.skeleton, { height }]}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  />
);

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    rowGap: space.sm,
  },
  muted: { fontSize: type.label.fontSize, color: color.textMuted },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primarySoft,
  },
  dangerCircle: { backgroundColor: color.dangerBg },
  title: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '600',
    color: color.text,
    textAlign: 'center',
  },
  message: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
  action: { alignSelf: 'stretch', marginTop: space.sm },
  skeleton: {
    borderRadius: radius.card,
    backgroundColor: color.disabledBg,
    marginBottom: space.lg,
  },
});
