// src/api/apiClient.ts

import axios, { AxiosError } from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

// Creamos la instancia de Axios con la configuración centralizada
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});
// Interceptor para agregar automáticamente el token a las requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Obtener el token del almacenamiento local
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error al obtener el token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// 3. Implementar Interceptores para Manejo de Errores Global 
apiClient.interceptors.response.use(
  // (response) => response: Esta es la función para respuestas exitosas (status 2xx).
  // No hacemos nada y simplemente dejamos que la respuesta continúe su camino.
  (response) => response,

  // (error) => { ... }: Esta es la función que se dispara si hay un error.
  (error: AxiosError) => {
    // Primero, verificamos si el error es realmente un error de Axios.
    if (!axios.isAxiosError(error)) {
      // Si no es un error de Axios, es algo inesperado. Lo dejamos pasar.
      return Promise.reject(error);
    }

    // Si `error.response` no existe, significa que fue un error de red (sin conexión) o un timeout.
    if (!error.response) {
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.'
      );
      return Promise.reject(error);
    }

    // Si tenemos una respuesta, podemos manejar errores basados en el código de estado HTTP.
    const { status, data } = error.response;

    switch (status) {
      case 500:
        // Error interno del servidor.
        Alert.alert(
          'Error del Servidor',
          'Ha ocurrido un problema en nuestros sistemas. Por favor, intenta de nuevo más tarde.'
        );
        break;
      
      case 409: // Conflicto (ej. email ya existe en el registro)
        // Este error es específico (lo vimos en tu pantalla de registro).
        // Lo dejamos pasar para que la pantalla de registro pueda mostrar un mensaje personalizado.
        // No mostramos una alerta global aquí.
        break;

      case 401: // No autorizado (ej. login incorrecto)
        // Similar al 409, este error es mejor manejarlo en la pantalla de Login
        // para dar un mensaje específico como "Credenciales incorrectas".
        // No hacemos nada aquí para que el .catch() de la pantalla lo reciba.
        break;

      // Puedes añadir más casos genéricos aquí (ej. 404, 403).
    }

    // Es CRUCIAL devolver `Promise.reject(error)`.
    // Esto asegura que si una pantalla tiene su propio bloque .catch(),
    // todavía pueda recibir el error y ejecutar su lógica específica.
    return Promise.reject(error);
  }
);

export default apiClient;