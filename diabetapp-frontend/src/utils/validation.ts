import { VALIDATION_CONFIG, APP_CONFIG } from '../constants/config';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'El correo electrónico es requerido' };
  }
  
  if (!VALIDATION_CONFIG.email.test(email)) {
    return { isValid: false, message: 'Por favor, ingresa un correo electrónico válido' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }
  
  if (password.length < APP_CONFIG.minPasswordLength) {
    return { 
      isValid: false, 
      message: `La contraseña debe tener al menos ${APP_CONFIG.minPasswordLength} caracteres` 
    };
  }
  
  return { isValid: true };
};

export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Confirma tu contraseña' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden' };
  }
  
  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${fieldName} es requerido` };
  }
  
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, message: 'El teléfono es requerido' };
  }
  
  const cleanPhone = phone.replace(/\s/g, '');
  if (!VALIDATION_CONFIG.phone.test(cleanPhone)) {
    return { isValid: false, message: 'Por favor, ingresa un número de teléfono válido' };
  }
  
  return { isValid: true };
};

export const validateDateOfBirth = (dateOfBirth: string): ValidationResult => {
  if (!dateOfBirth.trim()) {
    return { isValid: false, message: 'La fecha de nacimiento es requerida' };
  }
  
  if (!VALIDATION_CONFIG.date.test(dateOfBirth)) {
    return { isValid: false, message: 'Por favor, ingresa tu fecha de nacimiento en formato DD/MM/YYYY' };
  }
  
  const match = dateOfBirth.match(VALIDATION_CONFIG.date);
  if (!match) {
    return { isValid: false, message: 'Formato de fecha inválido' };
  }
  
  const [, day, month, year] = match;
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (age < APP_CONFIG.minAge) {
    return { 
      isValid: false, 
      message: `Debes tener al menos ${APP_CONFIG.minAge} años para registrarte` 
    };
  }
  
  return { isValid: true };
};

export const formatDateInput = (text: string): string => {
  // Remover caracteres no numéricos
  const numbers = text.replace(/\D/g, '');
  
  // Formatear automáticamente DD/MM/YYYY
  let formatted = numbers;
  if (numbers.length >= 2) {
    formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
  }
  if (numbers.length >= 4) {
    formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
  }
  
  return formatted;
};
