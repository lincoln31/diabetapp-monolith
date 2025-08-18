import { Platform } from 'react-native';

// Configuración de la API
export const API_CONFIG = {
  baseURL: Platform.OS === 'ios' 
    ? 'http://localhost:3000/api' 
    : 'http://192.168.1.9:3000/api',
  timeout: 10000,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
    },
    user: {
      profile: '/user/profile',
      update: '/user/update',
    },
    glucose: {
      readings: '/glucose/readings',
      add: '/glucose/add',
    }
  }
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'DiabetApp',
  version: '1.0.0',
  description: 'Tu compañero para una mejor hemoglobina',
  minPasswordLength: 6,
  minAge: 13,
};

// Configuración de validación
export const VALIDATION_CONFIG = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9+\-\s()]{10,}$/,
  date: /^(\d{2})\/(\d{2})\/(\d{4})$/,
};

// Colores de la aplicación
export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  green: {
    50: '#F0FDF4',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  }
};
