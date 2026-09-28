import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_CONFIG } from '../../config/app';
import { color, radius, space, type } from '../../theme/tokens';
import Icon from './Icon';

/** Marca de la app para las pantallas de acceso (spec fase 15): logo, nombre y una línea. */
interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

const Header = ({
  title = APP_CONFIG.name,
  subtitle = APP_CONFIG.description,
  showLogo = true,
}: HeaderProps) => (
  <View style={styles.header}>
    {showLogo ? (
      <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no">
        <Icon name="heart" size={28} color={color.onPrimary} />
      </View>
    ) : null}

    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: space.xl, rowGap: space.xs },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    marginBottom: space.sm,
  },
  title: {
    fontSize: type.title.fontSize,
    lineHeight: type.title.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  subtitle: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default Header;
