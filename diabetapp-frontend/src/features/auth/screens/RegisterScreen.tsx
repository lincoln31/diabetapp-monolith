import React, { useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, FormError, Header, Input, Screen } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useSession } from '../AuthProvider';
import { RegisterFormValues, registerSchema } from '../schemas';

const FIELDS = ['firstName', 'email', 'password'] as const;

/**
 * Crear cuenta (spec fase 15, RF-15.11): cuatro datos. Teléfono, fecha de nacimiento y datos
 * médicos se completan después en el perfil.
 */
const RegisterScreen = () => {
  const { signUp } = useSession();
  const [showPassword, setShowPassword] = useState(false);
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
      email: '',
      password: '',
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
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Header
        title="Crea tu cuenta"
        subtitle="Solo necesitamos lo básico. El resto lo completas después en tu perfil."
      />

      <FormError message={formError} />

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nombre"
            icon="user"
            placeholder="Cómo te llamas"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.firstName?.message}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Correo electrónico"
            icon="email"
            placeholder="nombre@correo.com"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Contraseña"
            icon="lock"
            placeholder="Crea una contraseña"
            helper="Mínimo 8 caracteres, con mayúscula, minúscula y número."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            rightIconLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
        )}
      />

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field: { onChange, value } }) => (
          <View style={styles.terms}>
            <Checkbox
              checked={value === true}
              onPress={() => onChange(!value)}
              label="Tengo 13 años o más y acepto los términos y condiciones y la política de privacidad."
            />
            {errors.acceptTerms?.message ? (
              <Text style={styles.termsError}>{errors.acceptTerms.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Button
        title="Crear cuenta"
        onPress={onSubmit}
        loading={isSubmitting}
        loadingText="Creando cuenta…"
        disabled={isSubmitting}
      />

      <View style={styles.login}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
        <Link href="/login" asChild>
          <Button title="Iniciar sesión" variant="secondary" />
        </Link>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.xxl },
  terms: { marginBottom: space.lg },
  termsError: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    fontWeight: '600',
    color: color.danger,
    marginTop: space.xs,
  },
  login: { marginTop: space.xxl, rowGap: space.sm },
  loginText: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default RegisterScreen;
