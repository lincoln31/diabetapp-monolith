import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS } from '../../constants/config';

interface CardProps extends ViewProps {
  variant?: 'default' | 'motivation' | 'security';
  padding?: 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  ...props
}) => {
  return (
    <View 
      style={[
        styles.card, 
        styles[variant], 
        styles[`${padding}Padding`],
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Variantes
  default: {
    backgroundColor: COLORS.white,
  },
  motivation: {
    backgroundColor: COLORS.blue[100],
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  security: {
    backgroundColor: COLORS.green[50],
  },
  
  // Padding
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },
});

export default Card;
