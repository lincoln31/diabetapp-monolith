import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  Chips,
  ErrorView,
  FormError,
  Input,
  LoadingView,
  Screen,
  useToast,
} from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { color, space, type } from '@/src/shared/theme/tokens';
import { formatDateInput } from '@/src/shared/utils/dates';
import { profileApi } from '../api';
import { ACTIVITY_LEVEL_OPTIONS, DIABETES_TYPE_OPTIONS } from '../constants';
import {
  ProfileFormValues,
  formValuesToInput,
  profileFormSchema,
  profileToFormValues,
} from '../schemas';
import { useProfile } from '../hooks/useProfile';
import { Profile } from '../types';

const FIELDS = [
  'typeOfDiabetes',
  'activityLevel',
  'targetGlucoseMin',
  'targetGlucoseMax',
  'targetHba1c',
  'dailyGlucoseChecks',
  'exerciseGoalMinutes',
  'phone',
  'birthDate',
  'weight',
  'height',
  'insulinCarbRatio',
  'insulinSensitivityFactor',
] as const;

type NumberField =
  | 'targetGlucoseMin'
  | 'targetGlucoseMax'
  | 'targetHba1c'
  | 'dailyGlucoseChecks'
  | 'exerciseGoalMinutes'
  | 'weight'
  | 'height'
  | 'insulinCarbRatio'
  | 'insulinSensitivityFactor';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card padding="large" style={styles.section}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    {children}
  </Card>
);

const ProfileForm = ({ profile }: { profile: Profile }) => {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToFormValues(profile),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await profileApi.update(formValuesToInput(values));

      // Al volver, la pantalla anterior recupera el foco y vuelve a pedir sus datos (spec fase 7, D-7.7)
      toast.show('Perfil guardado');
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  const numberInput = (
    name: NumberField,
    label: string,
    keyboardType: 'numeric' | 'decimal-pad',
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={errors[name]?.message}
          keyboardType={keyboardType}
          maxLength={6}
        />
      )}
    />
  );

  return (
    <Screen
      keyboard
      header={<ScreenHeader title="Mi perfil" safeTop={false} />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Guardar perfil"
          size="large"
          onPress={onSubmit}
          loading={isSubmitting}
          loadingText="Guardando…"
          disabled={isSubmitting}
        />
      }
    >
      <FormError message={formError} />

      <Section title="Mis metas">
        {numberInput('targetGlucoseMin', 'Glucosa mínima (mg/dL)', 'numeric')}
        {numberInput('targetGlucoseMax', 'Glucosa máxima (mg/dL)', 'numeric')}
        {numberInput('targetHba1c', 'Meta de HbA1c (%)', 'decimal-pad')}
        {numberInput('dailyGlucoseChecks', 'Lecturas por día (meta diaria)', 'numeric')}
        {numberInput('exerciseGoalMinutes', 'Meta de ejercicio (min por día)', 'numeric')}
      </Section>

      <Section title="Mi salud">
        <Text style={styles.label}>Tipo de diabetes</Text>
        <Controller
          control={control}
          name="typeOfDiabetes"
          render={({ field: { onChange, value } }) => (
            <Chips
              label="Tipo de diabetes"
              options={DIABETES_TYPE_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Text style={styles.label}>Nivel de actividad</Text>
        <Controller
          control={control}
          name="activityLevel"
          render={({ field: { onChange, value } }) => (
            <Chips
              label="Nivel de actividad"
              options={ACTIVITY_LEVEL_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {numberInput('weight', 'Peso (kg)', 'decimal-pad')}
        {numberInput('height', 'Altura (cm)', 'decimal-pad')}
      </Section>

      <Section title="Mis datos">
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Fecha de nacimiento (opcional)"
              placeholder="DD/MM/AAAA"
              value={value}
              onChangeText={(text) => onChange(formatDateInput(text))}
              onBlur={onBlur}
              error={errors.birthDate?.message}
              keyboardType="numeric"
              maxLength={10}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Teléfono (opcional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              keyboardType="phone-pad"
              maxLength={20}
            />
          )}
        />
      </Section>

      <Section title="Insulina">
        <Text style={styles.helper}>
          Los valores que te dio tu médico o nutricionista, para calcular tu dosis en la calculadora
          de insulina.
        </Text>
        {numberInput('insulinCarbRatio', 'Ratio (g de carbohidratos por unidad)', 'decimal-pad')}
        {numberInput(
          'insulinSensitivityFactor',
          'Factor de sensibilidad (mg/dL que baja 1 unidad)',
          'decimal-pad',
        )}
      </Section>
    </Screen>
  );
};

/** Pantalla «Mi perfil» (spec fase 7, RF-7.7 – RF-7.10; agrupada por secciones en la fase 15). */
const ProfileScreen = () => {
  const { status, profile, errorMessage, offline, reload } = useProfile();

  if (status === 'success' && profile) return <ProfileForm profile={profile} />;

  return (
    <Screen header={<ScreenHeader title="Mi perfil" safeTop={false} />}>
      {status === 'loading' ? <LoadingView /> : null}
      {status === 'error' ? (
        <ErrorView message={errorMessage ?? ''} offline={offline} onRetry={reload} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.lg },
  section: { rowGap: space.md },
  sectionTitle: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  helper: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
  },
});

export default ProfileScreen;
