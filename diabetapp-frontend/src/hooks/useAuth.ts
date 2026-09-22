import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { API_CONFIG, TOKEN_STORAGE_KEY } from '../constants/config';
import {
  validateEmail,
  validatePassword,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequired,
  validatePhone,
  validateDateOfBirth,
  dateOfBirthToISO,
  ValidationResult,
} from '../utils/validation';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

interface AuthResponse {
  user: any;
  token: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginData): Promise<AuthResponse | null> => {
    // Validaciones
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      Alert.alert('Error', emailValidation.message);
      return null;
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.message);
      return null;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post(API_CONFIG.endpoints.auth.login, {
        email: data.email.trim(),
        password: data.password.trim(),
      });

      const { user, token } = response.data.data;

      // Guardar el token para que apiClient lo envíe en las siguientes peticiones
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

      Alert.alert(
        '¡Bienvenido! 🎉',
        `Hola ${user.firstName || user.email}, estamos listos para ayudarte a cuidar tu salud.`,
        [{ text: 'Continuar', style: 'default' }]
      );

      return { user, token };
    } catch (error: any) {
      console.error('Error en el login:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        Alert.alert(
          'Credenciales incorrectas',
          'El correo o contraseña no son válidos. Verifica e intenta nuevamente.'
        );
      } else {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        );
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse | null> => {
    const phone = data.phone.replace(/\s/g, '');

    // Validaciones (se muestra el primer error encontrado)
    const validations: ValidationResult[] = [
      validateRequired(data.firstName, 'El nombre'),
      validateRequired(data.lastName, 'El apellido'),
      validateEmail(data.email),
      phone ? validatePhone(phone) : { isValid: true }, // El teléfono es opcional
      validateDateOfBirth(data.dateOfBirth.trim()),
      validateNewPassword(data.password.trim()),
      validatePasswordConfirmation(data.password.trim(), data.confirmPassword.trim()),
    ];
    const firstError = validations.find(v => !v.isValid);
    if (firstError) {
      Alert.alert('Error', firstError.message);
      return null;
    }

    setIsLoading(true);

    try {
      // Nombres de campos y formatos que espera el backend (registerSchema)
      const registrationData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: phone || undefined,
        birthDate: dateOfBirthToISO(data.dateOfBirth.trim()),
        password: data.password.trim(),
      };

      const response = await apiClient.post(API_CONFIG.endpoints.auth.register, registrationData);

      const { user, token } = response.data.data;

      // El backend inicia sesión al registrar: guardar el token como en el login
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

      Alert.alert(
        '¡Registro exitoso! 🎉',
        `¡Bienvenido a DiabetApp, ${user.firstName}! Tu cuenta ha sido creada exitosamente.`,
        [
          {
            text: 'Comenzar',
            style: 'default',
            onPress: () => {
              console.log('Navegando a la pantalla principal...');
            }
          }
        ]
      );

      return { user, token };
    } catch (error: any) {
      console.error('Error en el registro:', error.response?.data || error.message);

      if (error.response?.status === 409) {
        Alert.alert(
          'Email ya registrado',
          'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.'
        );
      } else if (error.response?.status === 400) {
        // Mostrar el primer error de campo que devuelve Zod, si existe
        const message =
          error.response.data?.errors?.[0]?.message ||
          error.response.data?.message ||
          'Datos inválidos. Revisa la información ingresada.';
        Alert.alert('Error en los datos', message);
      } else {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        );
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // El backend aún no expone /auth/logout (JWT sin estado): basta con borrar el token local
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      console.log('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
  };
};
