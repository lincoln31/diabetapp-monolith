/**
 * Puente entre el cliente HTTP y el proveedor de sesión (spec fase 2, D-2.12).
 *
 * Evita que `apiClient` importe el AuthProvider (dependencia circular): el proveedor
 * registra aquí qué hacer cuando la renovación falla definitivamente.
 */
type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;

export const onSessionExpired = (fn: SessionExpiredHandler): (() => void) => {
  handler = fn;
  return () => {
    handler = null;
  };
};

export const notifySessionExpired = (): void => {
  handler?.();
};
