import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';

// --- CONFIGURACIÓN IMPORTANTE ---
// La dirección IP de tu PC en tu red local.
// En Windows: abre cmd y escribe `ipconfig`. Busca la dirección IPv4.
// En Mac/Linux: abre la terminal y escribe `ifconfig` o `ip a`. Busca 'inet'.
// ¡NUNCA uses 'localhost' desde un dispositivo físico!
const API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:3000/api/auth' 
  : 'http://192.168.1.9:3000/api/auth'; // <--- ¡REEMPLAZA ESTA IP POR LA TUYA!

const LoginScreen = () => {
  // Estados para almacenar los datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estado para gestionar el indicador de carga
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validación simple para que no se envíen campos vacíos
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true); // Mostrar el indicador de carga

    try {
      // Hacemos la petición POST a nuestro endpoint de login
      const response = await axios.post(`${API_URL}/login`, {
        email: email.trim(), // .trim() para quitar espacios en blanco
        password: password.trim(),
      });
      
      // Si el login es exitoso (código 200)
      setIsLoading(false); // Ocultar el indicador de carga
      
      const { user, token } = response.data.data;
      
      console.log('Token de sesión:', token); // Mostramos el token en la consola de Metro
      
      Alert.alert('¡Inicio de Sesión Exitoso!', `Bienvenido, ${user.firstName || user.email}!`);
      
      // Aquí, en el futuro, guardaríamos el token y navegaríamos a la pantalla principal
      // Ejemplo: await saveToken(token); navigation.navigate('Home');

    } catch (error: any) {
      setIsLoading(false); // Ocultar el indicador de carga
      
      console.error('Error en el login:', error.response?.data || error.message);
      
      // Mostramos un mensaje de error genérico al usuario
      Alert.alert('Error de Autenticación', 'Credenciales inválidas. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Oculta la contraseña
      />

      {/* Mostramos el botón o el indicador de carga */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Iniciar Sesión" onPress={handleLogin} />
      )}
    </View>
  );
};

// Estilos básicos para la pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});

export default LoginScreen;