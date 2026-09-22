import { Alert } from 'react-native';
import { ApiError } from '../api/errors';

/**
 * Muestra un error en una acción que no es un formulario (spec fase 3, RF-3.9).
 * En los formularios los errores se pintan bajo el campo o en `FormError`.
 */
export const showError = (error: ApiError, title = 'Error'): void => {
  Alert.alert(title, error.firstFieldMessage ?? error.message);
};
