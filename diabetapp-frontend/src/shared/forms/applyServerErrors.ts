import { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/errors';

/**
 * Coloca los errores de validación del backend bajo su campo (spec fase 3, RF-3.12).
 *
 * Devuelve el mensaje que debe mostrarse como error general del formulario:
 * los errores sin campo asociado y los que no son de validación.
 */
export const applyServerErrors = <T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
  /** Campos que el backend llama distinto, p. ej. { birthDate: 'dateOfBirth' }. */
  aliases: Record<string, string> = {},
): string | null => {
  if (error.code !== 'VALIDATION_ERROR' || !error.fields?.length) {
    return error.message;
  }

  const unmatched: string[] = [];

  for (const { field, message } of error.fields) {
    const formField = aliases[field] ?? field;

    if (formField && knownFields.includes(formField)) {
      setError(formField as Path<T>, { type: 'server', message });
    } else {
      unmatched.push(message);
    }
  }

  return unmatched.length > 0 ? unmatched.join(' ') : null;
};
