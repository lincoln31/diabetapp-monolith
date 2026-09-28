import React, { useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormError, Header, Input, Screen } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useSession } from '../AuthProvider';
import { LoginFormValues, loginSchema } from '../schemas';

const FIELDS = ['email', 'password'] as const;

/**
 * Acceso (spec fase 15, RF-15.11, RF-15.12): logo, dos campos y una acción principal.
 * Sin tarjetas decorativas ni textos con aspecto de enlace que no lo sean.
 */
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
    <Screen keyboard contentStyle={styles.content}>
      <Header />

      <FormError message={formError} />

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
            placeholder="Tu contraseña"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry={!showPassword}
            autoComplete="password"
            textContentType="password"
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            rightIconLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
        )}
      />

      <Button
        title="Iniciar sesión"
        onPress={onSubmit}
        loading={isSubmitting}
        loadingText="Entrando…"
        disabled={isSubmitting}
      />

      <View style={styles.register}>
        <Text style={styles.registerText}>¿Aún no tienes cuenta?</Text>
        <Link href="/register" asChild>
          <Button title="Crear cuenta" variant="secondary" />
        </Link>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.xxl },
  register: { marginTop: space.xxl, rowGap: space.sm },
  registerText: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default LoginScreen;
