import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FormError, Input } from '@/src/shared/components/ui';
import { toApiError } from '@/src/shared/api/errors';
import { applyServerErrors } from '@/src/shared/forms/applyServerErrors';
import { COLORS } from '@/src/shared/theme/colors';
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
  'weight',
  'height',
] as const;

const ProfileForm = ({ profile }: { profile: Profile }) => {
  const router = useRouter();
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

      // Al volver, el dashboard recupera el foco y vuelve a pedir sus datos (spec fase 7, D-7.7)
      Alert.alert('¡Listo!', 'Tu perfil se guardó correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      setFormError(applyServerErrors(toApiError(error), setError, FIELDS));
    }
  });

  const numberInput = (
    name:
      | 'targetGlucoseMin'
      | 'targetGlucoseMax'
      | 'targetHba1c'
      | 'dailyGlucoseChecks'
      | 'weight'
      | 'height',
    label: string,
    keyboardType: 'numeric' | 'decimal-pad',
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors[name]?.message}
            keyboardType={keyboardType}
            maxLength={6}
          />
        )}
      />
    </View>
  );

  return (
    <Card style={styles.form}>
      <FormError message={formError} />

      <Text style={styles.section}>Mis metas</Text>
      {numberInput('targetGlucoseMin', 'Glucosa mínima (mg/dL)', 'numeric')}
      {numberInput('targetGlucoseMax', 'Glucosa máxima (mg/dL)', 'numeric')}
      {numberInput('targetHba1c', 'Meta de HbA1c (%)', 'decimal-pad')}
      {numberInput('dailyGlucoseChecks', 'Lecturas por día (meta diaria)', 'numeric')}

      <Text style={styles.section}>Mi perfil diabético</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de diabetes</Text>
        <View style={styles.pickerContainer}>
          <Controller
            control={control}
            name="typeOfDiabetes"
            render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                {DIABETES_TYPE_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            )}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nivel de actividad</Text>
        <View style={styles.pickerContainer}>
          <Controller
            control={control}
            name="activityLevel"
            render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            )}
          />
        </View>
      </View>

      {numberInput('weight', 'Peso (kg)', 'decimal-pad')}
      {numberInput('height', 'Altura (cm)', 'decimal-pad')}

      <Button
        title="Guardar perfil"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.saveButton}
      />
    </Card>
  );
};

/** Pantalla «Mi perfil» (spec fase 7, RF-7.7 – RF-7.10). */
const ProfileScreen = () => {
  const router = useRouter();
  const { status, profile, errorMessage, reload } = useProfile();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Button
            variant="outline"
            size="small"
            style={styles.closeButton}
            onPress={() => router.back()}
            title="✕"
          />
          <Text style={styles.title}>Mi perfil</Text>
        </View>

        {status === 'loading' && <ActivityIndicator size="large" color={COLORS.primary} />}

        {status === 'error' && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button title="Reintentar" variant="outline" onPress={reload} />
          </View>
        )}

        {status === 'success' && profile && <ProfileForm profile={profile} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingTop: 10 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 15,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[800], flex: 1 },
  form: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20 },
  section: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[800], marginBottom: 12 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[600], marginBottom: 8 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  picker: { height: 50 },
  saveButton: { marginTop: 8 },
  centered: { alignItems: 'center', paddingVertical: 32 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
});

export default ProfileScreen;
