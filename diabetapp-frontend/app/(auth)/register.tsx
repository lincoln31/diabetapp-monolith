import React, { useState } from 'react';
import { Link } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
} from 'react-native';

// Componentes UI reutilizables
import { Header, Card, Input, Button, Checkbox } from '../../src/components/ui';

// Sesión compartida por toda la app
import { useSession } from '../../src/session/AuthProvider';

// Utilidades
import { formatDateInput } from '../../src/utils/validation';

// Configuración
import { COLORS } from '../../src/constants/config';

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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { signUp, isSubmitting } = useSession();

  // Función para actualizar los campos del formulario
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    if (!acceptTerms) {
      Alert.alert('Términos y condiciones', 'Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    // El registro deja la sesión iniciada: el cambio de estado lleva solo
    // a la pantalla principal, sin poder volver atrás al formulario
    await signUp(formData);
  };

  // Función para formatear la fecha mientras se escribe
  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text);
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
        {/* Header */}
        <Header subtitle="Crea tu cuenta y comience tu viaje hacia una mejor salud" />

        {/* Mensaje motivacional */}
        <Card variant="motivation" style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            🌟 Únete a miles de personas que ya cuidan su diabetes con nosotros
          </Text>
        </Card>

        {/* Formulario de registro */}
        <Card variant="default" padding="large" style={styles.formContainer}>
          <Text style={styles.formTitle}>Crear Cuenta</Text>
          
          {/* Nombre */}
          <Input
            icon="user"
            placeholder="Nombre"
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            autoCapitalize="words"
          />

          {/* Apellido */}
          <Input
            icon="user"
            placeholder="Apellido"
            value={formData.lastName}
            onChangeText={(text) => updateField('lastName', text)}
            autoCapitalize="words"
          />

          {/* Email */}
          <Input
            icon="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Teléfono */}
          <Input
            icon="phone"
            placeholder="Teléfono (opcional)"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            keyboardType="phone-pad"
          />

          {/* Fecha de nacimiento */}
          <Input
            icon="calendar"
            placeholder="Fecha de nacimiento (DD/MM/YYYY)"
            value={formData.dateOfBirth}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* Contraseña */}
          <Input
            icon="lock"
            placeholder="Contraseña (8+ caracteres, mayúscula, minúscula y número)"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Confirmar contraseña */}
          <Input
            icon="lock"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            secureTextEntry={!showConfirmPassword}
            rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {/* Checkbox de términos y condiciones */}
          <Checkbox
            checked={acceptTerms}
            onPress={() => setAcceptTerms(!acceptTerms)}
            label={
              <>
                Acepto los{' '}
                <Text style={styles.linkTextInline}>términos y condiciones</Text>
                {' '}y la{' '}
                <Text style={styles.linkTextInline}>política de privacidad</Text>
              </>
            }
            containerStyle={styles.checkboxContainer}
          />

          {/* Botón de registro */}
          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={isSubmitting}
            loadingText="Creando cuenta..."
            style={styles.registerButton}
          />
        </Card>

        {/* Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
          <Link href="/login" style={styles.loginLink}>
            Inicia sesión aquí
          </Link>
        </View>

        {/* Información de seguridad */}
        <Card variant="security" style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Tus datos están seguros y protegidos con encriptación de grado militar
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  motivationCard: {
    marginBottom: 32,
  },
  motivationText: {
    color: COLORS.blue[700],
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 24,
    textAlign: 'center',
  },
  checkboxContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  linkTextInline: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: COLORS.gray[500],
    fontSize: 16,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    marginTop: 'auto',
  },
  securityText: {
    color: COLORS.green[700],
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default RegisterScreen;