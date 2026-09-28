import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color as tone } from '../../theme/tokens';

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
  flame: 'flame-outline',
  trophy: 'trophy-outline',
  book: 'book-outline',
  medication: 'medkit-outline',
  calculator: 'calculator-outline',
  bulb: 'bulb-outline',
  'chevron-down': 'chevron-down-outline',
  'chevron-up': 'chevron-up-outline',
  'trend-up': 'trending-up-outline',
  'trend-down': 'trending-down-outline',
  'trend-flat': 'remove-outline',
  // Fase 15: iconos de estado, acciones y navegación (sustituyen a los emojis)
  'check-circle': 'checkmark-circle-outline',
  alert: 'alert-circle-outline',
  info: 'information-circle-outline',
  'close-circle': 'close-circle-outline',
  'chevron-right': 'chevron-forward-outline',
  trash: 'trash-outline',
  edit: 'create-outline',
  refresh: 'refresh-outline',
  offline: 'cloud-offline-outline',
  walk: 'walk-outline',
  more: 'ellipsis-horizontal',
  list: 'list-outline',
  pulse: 'pulse-outline',
  today: 'today-outline',
  notifications: 'notifications-outline',
  download: 'download-outline',
  person: 'person-circle-outline',
} as const satisfies Record<string, React.ComponentProps<typeof Ionicons>['name']>;

export type AppIconName = keyof typeof ICONS;

interface IconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const Icon = ({ name, size = 24, color = tone.textMuted, style }: IconProps) => (
  <Ionicons name={ICONS[name]} size={size} color={color} style={style} />
);

export default Icon;
