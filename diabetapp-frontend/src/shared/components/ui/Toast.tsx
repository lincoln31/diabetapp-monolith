import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, elevation, radius, space, type } from '../../theme/tokens';
import Icon, { AppIconName } from './Icon';

/**
 * Aviso no bloqueante para confirmar una acción (spec fase 15, RF-15.9): sustituye al `Alert`
 * de «¡Éxito!». Se anuncia a los lectores de pantalla (`accessibilityLiveRegion`) y
 * desaparece solo. `Alert` queda únicamente para confirmar acciones destructivas.
 */
export type ToastTone = 'success' | 'error' | 'info';

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

// Sin proveedor (p. ej. en tests) `show` no hace nada: nunca rompe una pantalla
const ToastContext = createContext<ToastApi>({ show: () => undefined });

export const useToast = (): ToastApi => useContext(ToastContext);

const TONES: Record<ToastTone, { bg: string; icon: AppIconName }> = {
  success: { bg: color.success, icon: 'check-circle' },
  error: { bg: color.danger, icon: 'alert' },
  info: { bg: color.primary, icon: 'info' },
};

const DURATION_MS = 3000;
const FADE_MS = 200;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() =>
      setToast(null),
    );
  }, [opacity]);

  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      if (timer.current) clearTimeout(timer.current);

      counter.current += 1;
      setToast({ id: counter.current, message, tone });
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, DURATION_MS);
    },
    [hide, opacity],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.wrapper, { bottom: insets.bottom + space.xxl, opacity }]}
        >
          <View
            style={[styles.toast, elevation.overlay, { backgroundColor: TONES[toast.tone].bg }]}
          >
            <Icon name={TONES[toast.tone].icon} size={20} color={color.onPrimary} />
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: space.sm,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    maxWidth: 480,
  },
  text: {
    flexShrink: 1,
    color: color.onPrimary,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
  },
});
