import React, { useState } from 'react';
import { Link } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';

// Componentes UI reutilizables
import Header from '../../src/components/ui/Header';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

// Hook personalizado para autenticación
import { useSession } from '../../src/session/AuthProvider';

// Configuración
import { COLORS } from '../../src/constants/config';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, isSubmitting } = useSession();

  const handleLogin = async () => {
    // Al iniciar sesión, el cambio de estado lleva solo a la pantalla principal
    await signIn(email, password);
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
        <Header />

        {/* Mensaje motivacional */}
        <Card variant="motivation" style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            💪 Cada paso cuenta en tu camino hacia una mejor salud
          </Text>
        </Card>

        {/* Formulario de login */}
        <Card variant="default" padding="large" style={styles.formContainer}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          
          {/* Campo de email */}
          <Input
            icon="email"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Campo de contraseña */}
          <Input
            icon="lock"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Botón de login */}
          <Button 
            title="Iniciar Sesión" 
            onPress={handleLogin} 
            loading={isSubmitting} 
            style={styles.loginButton} />

          {/* Links adicionales */}
          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </View>
        </Card>

        {/* Registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta?</Text>
          <Link href="/register" style={styles.registerLink}>
            Regístrate aquí
          </Link>
        </View>

        {/* Información de seguridad */}
        <Card variant="security" style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Tus datos están seguros y protegidos
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
  loginButton: {
    marginTop: 8,
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: COLORS.primary,
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
    color: COLORS.gray[500],
    fontSize: 16,
  },
  registerLink: {
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

export default LoginScreen;