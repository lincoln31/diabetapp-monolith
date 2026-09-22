import React, { useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Checkbox, FormError, Header, Input } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { dateOfBirthToISO, formatDateInput } from '@/src/shared/utils/dates';
import { COLORS } from '@/src/shared/theme/colors';
import { useSession } from '../AuthProvider';
import { RegisterFormValues, registerSchema } from '../schemas';

const FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'password',
  'confirmPassword',
] as const;

const RegisterScreen = () => {
  const { signUp } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      // El registro deja la sesión iniciada: el cambio de estado lleva solo
      // a la pantalla principal, sin poder volver atrás al formulario
      await signUp({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone || undefined, // El teléfono es opcional
        birthDate: dateOfBirthToISO(values.dateOfBirth),
        password: values.password,
      });
    } catch (error) {
      // El backend llama `birthDate` a la fecha; en el formulario es `dateOfBirth`
      setFormError(
        applyServerErrors(toApiError(error), setError, FIELDS, { birthDate: 'dateOfBirth' }),
      );
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
        <Header subtitle="Crea tu cuenta y comienza tu viaje hacia una mejor salud" />

        <Card variant="motivation" style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            🌟 Únete a miles de personas que ya cuidan su diabetes con nosotros
          </Text>
        </Card>

        <Card variant="default" padding="large" style={styles.formContainer}>
          <Text style={styles.formTitle}>Crear Cuenta</Text>

          <FormError message={formError} />

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="user"
                placeholder="Nombre"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="user"
                placeholder="Apellido"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
                autoCapitalize="words"
              />
            )}
          />

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
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="phone"
                placeholder="Teléfono (opcional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="calendar"
                placeholder="Fecha de nacimiento (DD/MM/AAAA)"
                value={value}
                onChangeText={(text) => onChange(formatDateInput(text))}
                onBlur={onBlur}
                error={errors.dateOfBirth?.message}
                keyboardType="numeric"
                maxLength={10}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="lock"
                placeholder="Contraseña (8+ con mayúscula, minúscula y número)"
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                icon="lock"
                placeholder="Confirmar contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}
          />

          <Controller
            control={control}
            name="acceptTerms"
            render={({ field: { onChange, value } }) => (
              <>
                <Checkbox
                  checked={value === true}
                  onPress={() => onChange(!value)}
                  label={
                    <>
                      Acepto los <Text style={styles.linkTextInline}>términos y condiciones</Text> y
                      la <Text style={styles.linkTextInline}>política de privacidad</Text>
                    </>
                  }
                  containerStyle={styles.checkboxContainer}
                />
                {errors.acceptTerms?.message ? (
                  <Text style={styles.checkboxError}>{errors.acceptTerms.message}</Text>
                ) : null}
              </>
            )}
          />

          <Button
            title="Crear Cuenta"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            loadingText="Creando cuenta..."
            style={styles.registerButton}
          />
        </Card>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
          <Link href="/login" style={styles.loginLink}>
            Inicia sesión aquí
          </Link>
        </View>

        <Card variant="security" style={styles.securityInfo}>
          <Text style={styles.securityText}>🔒 Tus datos médicos están protegidos</Text>
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
    marginBottom: 8,
  },
  checkboxError: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 12,
  },
  linkTextInline: {
    color: COLORS.primary,
    fontWeight: '600',
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
