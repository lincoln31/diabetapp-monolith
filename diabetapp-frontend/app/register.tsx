import React, { useState } from 'react';
import { Link } from 'expo-router';

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
const UserIcon = () => <Text style={styles.iconSmall}>👤</Text>;
const EmailIcon = () => <Text style={styles.iconSmall}>📧</Text>;
const LockIcon = () => <Text style={styles.iconSmall}>🔒</Text>;
const PhoneIcon = () => <Text style={styles.iconSmall}>📱</Text>;
const CalendarIcon = () => <Text style={styles.iconSmall}>📅</Text>;
const EyeIcon = () => <Text style={styles.iconSmall}>👁️</Text>;
const EyeOffIcon = () => <Text style={styles.iconSmall}>🙈</Text>;

const { width } = Dimensions.get('window');

// Configuración de la API
const API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:3000/api/auth' 
  : 'http://192.168.1.9:3000/api/auth';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Función para actualizar los campos del formulario
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validaciones
  const validateForm = () => {
    const { firstName, lastName, email, phone, dateOfBirth, password, confirmPassword } = formData;

    if (!firstName.trim()) {
      Alert.alert('Campo requerido', 'Por favor, ingresa tu nombre.');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Campo requerido', 'Por favor, ingresa tu apellido.');
      return false;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Por favor, ingresa un correo electrónico válido.');
      return false;
    }

    // Validación de teléfono (formato básico)
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Teléfono inválido', 'Por favor, ingresa un número de teléfono válido.');
      return false;
    }

    // Validación de fecha de nacimiento (formato DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert('Fecha inválida', 'Por favor, ingresa tu fecha de nacimiento en formato DD/MM/YYYY.');
      return false;
    }

    // Validar que la fecha sea válida y el usuario sea mayor de edad
    const match = dateOfBirth.match(dateRegex);
    if (!match) {
      Alert.alert('Fecha inválida', 'Por favor, ingresa tu fecha de nacimiento en formato DD/MM/YYYY.');
      return false;
    }
    const [ , day, month, year] = match;
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      Alert.alert('Edad mínima', 'Debes tener al menos 13 años para registrarte.');
      return false;
    }

    // Validación de contraseña
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
      return false;
    }

    if (!acceptTerms) {
      Alert.alert('Términos y condiciones', 'Debes aceptar los términos y condiciones para continuar.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    console.log('Intentando registrar en:', `${API_URL}/register`);

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        password: formData.password.trim(),
      };

      const response = await axios.post(`${API_URL}/register`, registrationData);
      
      setIsLoading(false);
      
      const { user, token } = response.data.data;
      
      console.log('Usuario registrado exitosamente:', user);
      console.log('Token de sesión:', token);
      
      Alert.alert(
        '¡Registro exitoso! 🎉', 
        `¡Bienvenido a DiabetApp, ${user.firstName}! Tu cuenta ha sido creada exitosamente.`,
        [
          { 
            text: 'Comenzar', 
            style: 'default',
            onPress: () => {
              // Aquí navegarías a la pantalla principal o tutorial
              // navigation.navigate('Home') o navigation.navigate('Onboarding')
              console.log('Navegando a la pantalla principal...');
            }
          }
        ]
      );

    } catch (error) {
      setIsLoading(false);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error en el registro:', error.response.data || error.message);
        
        if (error.response.status === 409) {
          Alert.alert('Email ya registrado', 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.');
        } else if (error.response.status === 400) {
          const message = error.response.data?.message || 'Datos inválidos. Revisa la información ingresada.';
          Alert.alert('Error en los datos', message);
        } else if (error.response.status === 500) {
          Alert.alert('Error del servidor', 'Tenemos problemas técnicos. Intenta más tarde.');
        } else {
          Alert.alert('Error de conexión', 'Verifica tu conexión a internet e intenta nuevamente.');
        }
      } else {
        console.error('Error desconocido:', error);
        Alert.alert('Error desconocido', 'Ocurrió un error inesperado. Intenta nuevamente.');
      }
    }
  };

  // Función para formatear la fecha mientras se escribe
  const handleDateChange = (text: string) => {
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
    
    updateField('dateOfBirth', formatted);
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
          <Text style={styles.appSubtitle}>Crea tu cuenta y comience tu viaje hacia una mejor salud</Text>
        </View>

        {/* Mensaje motivacional */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            🌟 Únete a miles de personas que ya cuidan su diabetes con nosotros
          </Text>
        </View>

        {/* Formulario de registro */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Crear Cuenta</Text>
          
          {/* Nombre */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'firstName' && styles.inputFocused]}>
              <UserIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                autoCapitalize="words"
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          {/* Apellido */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'lastName' && styles.inputFocused]}>
              <UserIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                autoCapitalize="words"
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
              <EmailIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputFocused]}>
              <PhoneIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Teléfono"
                placeholderTextColor="#9CA3AF"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          {/* Fecha de nacimiento */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'dateOfBirth' && styles.inputFocused]}>
              <CalendarIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Fecha de nacimiento (DD/MM/YYYY)"
                placeholderTextColor="#9CA3AF"
                value={formData.dateOfBirth}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocusedField('dateOfBirth')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
              <LockIcon />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused]}>
              <LockIcon />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkbox de términos y condiciones */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              Acepto los{' '}
              <Text style={styles.linkTextInline}>términos y condiciones</Text>
              {' '}y la{' '}
              <Text style={styles.linkTextInline}>política de privacidad</Text>
            </Text>
          </TouchableOpacity>

          {/* Botón de registro */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Creando cuenta...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login */}
        <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
          <Link href="./login" style={styles.loginLink}>
             Inicia sesión aquí
          </Link>
         
        </View>

        {/* Información de seguridad */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Tus datos están seguros y protegidos con encriptación de grado militar
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  linkTextInline: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 16,
  },
  loginLink: {
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

export default RegisterScreen;