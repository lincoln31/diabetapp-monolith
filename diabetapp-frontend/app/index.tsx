import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import axios from 'axios';

// Iconos simulados con texto (en tu proyecto real usarías react-native-vector-icons)
const HeartIcon = () => <Text style={styles.icon}>💙</Text>;
const EmailIcon = () => <Text style={styles.iconSmall}>📧</Text>;
const LockIcon = () => <Text style={styles.iconSmall}>🔒</Text>;
const EyeIcon = () => <Text style={styles.iconSmall}>👁️</Text>;
const EyeOffIcon = () => <Text style={styles.iconSmall}>🙈</Text>;

const { width } = Dimensions.get('window');

// Configuración de la API
const API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:3000/api/auth' 
  : 'http://192.168.1.9:3000/api/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Función de prueba de conexión
  const testConnection = async () => {
    try {
      console.log('🔍 Probando conexión básica...');
      const response = await axios.get(`${API_URL.replace('/api/auth', '')}/api/test`);
      console.log('✅ Conexión exitosa:', response.data);
      Alert.alert('Conexión OK', 'El servidor responde correctamente');
    } catch (error: any) {
      console.error('❌ Error de conexión:', error.message);
      Alert.alert('Error de conexión', `No se puede conectar al servidor: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor, ingresa tu correo y contraseña para continuar.');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    
    // Debug: mostrar la URL que se está usando
    console.log('Intentando conectar a:', `${API_URL}/login`);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      
      setIsLoading(false);
      
      const { user, token } = response.data.data;
      
      console.log('Token de sesión:', token);
      
      Alert.alert(
        '¡Bienvenido! 🎉', 
        `Hola ${user.firstName || user.email}, estamos listos para ayudarte a cuidar tu salud.`,
        [{ text: 'Continuar', style: 'default' }]
      );
      
      // Aquí navegarías a la pantalla principal
      // navigation.navigate('Home');

    } catch (error: any) {
      setIsLoading(false);
      
      console.error('Error en el login:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        Alert.alert('Credenciales incorrectas', 'El correo o contraseña no son válidos. Verifica e intenta nuevamente.');
      } else if (error.response?.status === 500) {
        Alert.alert('Error del servidor', 'Tenemos problemas técnicos. Intenta más tarde.');
      } else {
        Alert.alert('Error de conexión', 'Verifica tu conexión a internet e intenta nuevamente.');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con logo y título */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <HeartIcon />
          </View>
          <Text style={styles.appTitle}>DiabetApp</Text>
          <Text style={styles.appSubtitle}>Tu compañero para una mejor hemoglobina</Text>
        </View>

        {/* Mensaje motivacional */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            💪 Cada paso cuenta en tu camino hacia una mejor salud
          </Text>
        </View>

        {/* Formulario de login */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          
          {/* Campo de email */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
              <EmailIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Campo de contraseña */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
              <LockIcon />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de login */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Botón de prueba de conexión */}
         

          {/* Links adicionales */}
          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta?</Text>
          <TouchableOpacity>
            <Text style={styles.registerLink}> Regístrate aquí</Text>
          </TouchableOpacity>
        </View>

        {/* Información de seguridad */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Tus datos están seguros y protegidos
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#3B82F6',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  iconSmall: {
    fontSize: 18,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  motivationCard: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  motivationText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    marginRight: 8,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: '#6B7280',
    fontSize: 16,
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 'auto',
  },
  securityText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;