import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Input, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, type } from '@/src/shared/theme/tokens';
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

  const field = (name: keyof CarbCalculatorValues, label: string, placeholder: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={errors[name]?.message}
          keyboardType="decimal-pad"
          maxLength={7}
        />
      )}
    />
  );

  return (
    <Screen
      keyboard
      header={<ScreenHeader title="Calculadora de carbohidratos" safeTop={false} />}
      contentStyle={styles.content}
    >
      <Card padding="large" style={styles.form}>
        {field('carbsPer100g', 'Carbohidratos por 100 g (del empaque)', 'Ej. 25')}
        {field('gramsEaten', 'Gramos que vas a comer', 'Ej. 80')}
      </Card>

      {result ? (
        <Card padding="large" style={styles.result} accessible accessibilityLiveRegion="polite">
          <Text style={styles.resultValue}>{result.totalCarbs} g</Text>
          <Text style={styles.resultLabel}>de carbohidratos en tu porción</Text>
          <Text style={styles.portions}>≈ {result.portions} raciones de 10 g</Text>
        </Card>
      ) : null}

      <Text style={styles.disclaimer}>
        Es solo un cálculo aproximado. No reemplaza las indicaciones de tu médico.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  form: { rowGap: space.md },
  result: { alignItems: 'center', rowGap: space.xs },
  resultValue: { ...type.hero, color: color.primary },
  resultLabel: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
  },
  portions: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
    marginTop: space.sm,
  },
  disclaimer: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default CarbCalculatorScreen;
