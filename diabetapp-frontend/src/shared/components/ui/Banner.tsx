import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '../../theme/tokens';
import Icon, { AppIconName } from './Icon';

/**
 * Aviso en línea (spec fase 15, D-15.7): el estado se comunica con icono + texto + color,
 * nunca solo con color (RNF-15.1).
 */
export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

interface BannerProps {
  tone?: BannerTone;
  message: string;
  title?: string;
}

const TONES: Record<BannerTone, { fg: string; bg: string; icon: AppIconName }> = {
  info: { fg: color.info, bg: color.infoBg, icon: 'info' },
  success: { fg: color.success, bg: color.successBg, icon: 'check-circle' },
  warning: { fg: color.warning, bg: color.warningBg, icon: 'alert' },
  danger: { fg: color.danger, bg: color.dangerBg, icon: 'alert' },
};

const Banner = ({ tone = 'info', message, title }: BannerProps) => {
  const { fg, bg, icon } = TONES[tone];

  return (
    <View
      accessible
      style={[styles.container, { backgroundColor: bg, borderColor: fg }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'danger' ? 'assertive' : 'polite'}
    >
      <Icon name={icon} size={20} color={fg} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: fg }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: fg }]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: space.sm,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.lg,
  },
  body: { flex: 1 },
  title: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '700',
  },
  message: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '500',
  },
});

export default Banner;
