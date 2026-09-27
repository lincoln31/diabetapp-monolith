import { color } from './tokens';

/**
 * ALIAS TEMPORAL (spec fase 15, D-15.7): las pantallas antiguas siguen importando `COLORS`.
 * Sus valores salen ahora de los tokens accesibles, así toda la app hereda el nuevo contraste
 * mientras se migra pantalla por pantalla. Se elimina al cerrar la etapa 15E.
 *
 * Nota: `gray[400]` (antes #9CA3AF, 2,54 : 1) y `green[500]` (antes #10B981, 2,54 : 1) se
 * remapearon a tonos que sí cumplen 4,5 : 1 porque se usaban como color de texto.
 */
export const COLORS = {
  primary: color.primary,
  primaryDark: '#1E3A8A',
  secondary: color.textMuted,
  success: color.success,
  warning: color.warning,
  error: color.danger,
  background: color.bg,
  white: color.surface,
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: color.borderStrong,
    500: color.borderStrong,
    600: color.textMuted,
    700: '#374151',
    800: '#1F2937',
    900: color.text,
  },
  blue: {
    50: color.primarySoft,
    100: '#DBEAFE',
    500: color.accent,
    600: '#1D4ED8',
    700: '#1E40AF',
  },
  green: {
    50: color.successBg,
    500: color.success,
    600: color.success,
    700: color.success,
  },
};
