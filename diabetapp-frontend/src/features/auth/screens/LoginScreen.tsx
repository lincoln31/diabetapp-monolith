import React, { useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FormError, Header, Input } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { COLORS } from '@/src/shared/theme/colors';
import { useSession } from '../AuthProvider';
import { LoginFormValues, loginSchema } from '../schemas';

const FIELDS = ['email', 'password'] as const;

const LoginScreen = () => {
  const { signIn } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);

    try {
      // Al iniciar sesión, el cambio de estado lleva solo a la pantalla principal
      await signIn(email, password);
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

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
        <Header />

        <Card variant="motivation" style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            💪 Cada paso cuenta en tu camino hacia una mejor salud
          </Text>
        </Card>

        <Card variant="default" padding="large" style={styles.formContainer}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          <FormError message={formError} />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="email"
                placeholder="Correo electrónico"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="lock"
                placeholder="Contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            )}
          />

          <Button
            title="Iniciar Sesión"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.loginButton}
          />

          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </View>
        </Card>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta?</Text>
          <Link href="/register" style={styles.registerLink}>
            Regístrate aquí
          </Link>
        </View>

        <Card variant="security" style={styles.securityInfo}>
          <Text style={styles.securityText}>🔒 Tus datos están seguros y protegidos</Text>
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
