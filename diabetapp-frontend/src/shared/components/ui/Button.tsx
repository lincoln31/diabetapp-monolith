import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../theme/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  loadingText?: string;
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText,
  icon,
  style,
  disabled,
  ...props
}) => {
  // Mapas tipados en lugar de índices dinámicos (styles[`${size}Text`]),
  // que TypeScript no puede comprobar
  const getButtonStyle = (): StyleProp<ViewStyle>[] => [
    styles.button,
    styles[size],
    disabled || loading ? styles.disabled : styles[variant],
  ];

  const getTextStyle = (): StyleProp<TextStyle>[] => [
    styles.text,
    SIZE_TEXT_STYLES[size],
    disabled || loading ? styles.disabledText : VARIANT_TEXT_STYLES[variant],
  ];

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      {...props}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? COLORS.primary : COLORS.white}
          />
          {loadingText && <Text style={getTextStyle()}>{loadingText}</Text>}
        </View>
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Variantes
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.gray[200],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Tamaños
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 32,
  },

  // Estados
  disabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },

  // Texto
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Colores de texto por variante
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.gray[800],
  },
  outlineText: {
    color: COLORS.primary,
  },

  // Estados de texto
  disabledText: {
    color: COLORS.gray[500],
  },
});

// Mapas tipados de estilos de texto por tamaño y variante
const SIZE_TEXT_STYLES = {
  small: styles.smallText,
  medium: styles.mediumText,
  large: styles.largeText,
} as const;

const VARIANT_TEXT_STYLES = {
  primary: styles.primaryText,
  secondary: styles.secondaryText,
  outline: styles.outlineText,
} as const;

export default Button;
