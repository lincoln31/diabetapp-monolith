/**
 * Tokens de diseño (spec fase 15, D-15.7). Única fuente de color, tipografía, espaciado,
 * radio y tamaños táctiles: ninguna pantalla define valores propios.
 *
 * Contrastes verificados sobre su fondo (referencia WCAG: 4,5 : 1 para texto):
 *   primary / blanco 6,70 · text / bg 16,96 · textMuted / blanco 7,56 ·
 *   success / blanco 5,48 · warning / blanco 5,02 · danger / blanco 6,47 ·
 *   borderStrong / blanco 4,83 (los bordes de controles piden 3 : 1).
 */
export const color = {
  // Marca
  primary: '#1D4ED8', // texto, botones y enlaces
  primarySoft: '#EFF6FF', // fondos suaves de información
  accent: '#3B82F6', // solo elementos NO textuales (barras, iconos): 3,68 : 1

  // Superficies y texto
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#4B5563',
  onPrimary: '#FFFFFF',

  // Bordes
  border: '#D1D5DB', // decorativo (divisores)
  borderStrong: '#6B7280', // bordes de controles interactivos

  // Estado: siempre con icono y texto, nunca solo color
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#B45309',
  warningBg: '#FFFBEB',
  danger: '#B91C1C',
  dangerBg: '#FEF2F2',
  info: '#1D4ED8',
  infoBg: '#EFF6FF',

  // Deshabilitado (exento de contraste, pero legible)
  disabledBg: '#E5E7EB',
  disabledText: '#6B7280',
} as const;

/** Escala de espaciado: 4 · 8 · 12 · 16 · 24 · 32 · 48. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const radius = {
  control: 8,
  card: 12,
  pill: 999,
} as const;

/** Seis tamaños de texto corriente y dos «cifras grandes»; nada por debajo de 13. */
export const type = {
  // Cifras protagonistas (última medición, cronómetro)
  hero: { fontSize: 48, lineHeight: 56, fontWeight: '700' },
  timer: { fontSize: 64, lineHeight: 72, fontWeight: '700' },
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

/** Áreas táctiles (dp): 48 como mínimo (RNF-15.2). */
export const touch = {
  min: 48,
  compact: 40, // con `hitSlop` que completa hasta 48
  hitSlop: { top: 4, bottom: 4, left: 4, right: 4 },
} as const;

/** Elevación solo para elementos que flotan (toast, menús); tarjetas y botones usan borde. */
export const elevation = {
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

/** Margen lateral de las pantallas. */
export const gutter = space.lg;
