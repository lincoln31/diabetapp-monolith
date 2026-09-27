import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { color, radius, space } from '../../theme/tokens';

/** Superficie plana con borde de 1 px y sin sombra (spec fase 15, D-15.7). */
interface CardProps extends ViewProps {
  variant?: 'default' | 'motivation' | 'security';
  padding?: 'small' | 'medium' | 'large';
}

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  ...props
}: CardProps) => (
  <View style={[styles.card, VARIANT[variant], PADDING[padding], style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  default: { backgroundColor: color.surface },
  motivation: { backgroundColor: color.infoBg },
  security: { backgroundColor: color.successBg },
  small: { padding: space.md },
  medium: { padding: space.lg },
  large: { padding: space.xl },
});

const VARIANT = {
  default: styles.default,
  motivation: styles.motivation,
  security: styles.security,
} as const;

const PADDING = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
} as const;

export default Card;
