import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

/**
 * Iconos vectoriales (spec fase 3, RF-3.16).
 *
 * Los nombres son semánticos y están tipados: usar uno que no exista es un
 * error de compilación, no un icono roto en pantalla.
 */
const ICONS = {
  heart: 'heart-outline',
  user: 'person-outline',
  email: 'mail-outline',
  lock: 'lock-closed-outline',
  phone: 'call-outline',
  calendar: 'calendar-outline',
  clock: 'time-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  home: 'home-outline',
  chart: 'stats-chart-outline',
  drop: 'water-outline',
  note: 'document-text-outline',
  settings: 'settings-outline',
  logout: 'log-out-outline',
  plus: 'add-outline',
  minus: 'remove-outline',
  check: 'checkmark-outline',
  close: 'close-outline',
  'arrow-right': 'arrow-forward-outline',
  'arrow-left': 'arrow-back-outline',
} as const satisfies Record<string, React.ComponentProps<typeof Ionicons>['name']>;

export type AppIconName = keyof typeof ICONS;

interface IconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const Icon = ({ name, size = 24, color = COLORS.gray[600], style }: IconProps) => (
  <Ionicons name={ICONS[name]} size={size} color={color} style={style} />
);

export default Icon;
