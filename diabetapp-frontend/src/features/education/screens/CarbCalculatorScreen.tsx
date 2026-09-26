import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Input } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { COLORS } from '@/src/shared/theme/colors';
import { calculateCarbs } from '../carbCalculator';
import { CarbCalculatorValues, carbCalculatorSchema, parseCalculatorValue } from '../schemas';

/** Calculadora de carbohidratos (spec fase 10, RF-10.3, RF-10.4). No guarda nada. */
const CarbCalculatorScreen = () => {
  const {
    control,
    formState: { errors },
  } = useForm<CarbCalculatorValues>({
    resolver: zodResolver(carbCalculatorSchema),
    defaultValues: { carbsPer100g: '', gramsEaten: '' },
    mode: 'onChange',
  });
  const values = useWatch({ control });

  // El resultado solo aparece con ambos campos válidos (CA-10.5, CA-10.6).
  const parsed = carbCalculatorSchema.safeParse({
    carbsPer100g: values.carbsPer100g ?? '',
    gramsEaten: values.gramsEaten ?? '',
  });
  const result = parsed.success
    ? calculateCarbs(
        parseCalculatorValue(parsed.data.carbsPer100g),
        parseCalculatorValue(parsed.data.gramsEaten),
      )
    : null;

  const field = (name: keyof CarbCalculatorValues, label: string) => (
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
            keyboardType="decimal-pad"
            maxLength={7}
          />
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calculadora de carbohidratos" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card padding="large">
          {field('carbsPer100g', 'Carbohidratos por 100 g (del empaque)')}
          {field('gramsEaten', 'Gramos que vas a comer')}
        </Card>

        {result && (
          <Card padding="large" style={styles.result}>
            <Text style={styles.resultValue}>{result.totalCarbs} g</Text>
            <Text style={styles.resultLabel}>de carbohidratos en tu porción</Text>
            <Text style={styles.portions}>≈ {result.portions} raciones de 10 g</Text>
          </Card>
        )}

        <Text style={styles.disclaimer}>
          Es solo un cálculo aproximado. No reemplaza las indicaciones de tu médico.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 4 },
  inputGroup: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 6 },
  result: { marginTop: 16, alignItems: 'center', backgroundColor: COLORS.white },
  resultValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  resultLabel: { fontSize: 14, color: COLORS.gray[600], marginTop: 2 },
  portions: { fontSize: 16, fontWeight: '600', color: COLORS.gray[800], marginTop: 10 },
  disclaimer: { fontSize: 12, color: COLORS.gray[500], textAlign: 'center', marginTop: 16 },
});

export default CarbCalculatorScreen;
