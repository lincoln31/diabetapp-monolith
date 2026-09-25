/**
 * Formatea DD/MM/YYYY mientras el usuario escribe, sin dejar barras sueltas
 * al final (escribir "15" muestra "15", no "15/").
 */
export const formatDateInput = (text: string): string => {
  const numbers = text.replace(/\D/g, '').slice(0, 8);

  return [numbers.slice(0, 2), numbers.slice(2, 4), numbers.slice(4, 8)]
    .filter((part) => part.length > 0)
    .join('/');
};

/** Convierte DD/MM/YYYY (ya validada) al formato ISO que espera el backend. */
export const dateOfBirthToISO = (dateOfBirth: string): string => {
  const [day, month, year] = dateOfBirth.split('/').map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

/** true si la fecha DD/MM/YYYY existe de verdad (rechaza 31/02). */
export const isRealDate = (dateOfBirth: string): boolean => {
  const match = dateOfBirth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
};

/** Edad en años cumplidos a partir de una fecha DD/MM/YYYY válida. */
export const ageFromDateOfBirth = (dateOfBirth: string): number => {
  const [day, month, year] = dateOfBirth.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasHadBirthday) age -= 1;

  return age;
};

/** Fecha DD/MM/YYYY en el futuro. */
export const isFutureDate = (dateOfBirth: string): boolean => {
  const [day, month, year] = dateOfBirth.split('/').map(Number);

  return new Date(year, month - 1, day) > new Date();
};
