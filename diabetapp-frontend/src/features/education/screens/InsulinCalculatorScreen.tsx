import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Input, ListRow, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useProfile } from '@/src/features/profile';
import { FoodItem, searchFood } from '../foodTable';
import { calculateInsulinDose } from '../insulinCalculator';
import { InsulinCalculatorValues, insulinCalculatorSchema, parseCalculatorValue } from '../schemas';

/** Calculadora de dosis de insulina (spec fase 17, RF-17.3 – RF-17.6). No guarda nada. */
const InsulinCalculatorScreen = () => {
  const router = useRouter();
  const { glucose } = useLocalSearchParams<{ glucose?: string }>();
  const { profile } = useProfile();
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const {
    control,
    setValue,
    formState: { errors },
  } = useForm<InsulinCalculatorValues>({
    resolver: zodResolver(insulinCalculatorSchema),
    defaultValues: { carbsGrams: '', currentGlucose: glucose ?? '' },
    mode: 'onChange',
  });
  const values = useWatch({ control });

  const pickFood = (food: FoodItem) => {
    setSelectedFood(food);
    setFoodQuery(food.name);
    setValue('carbsGrams', String(food.carbsGrams), { shouldValidate: true });
  };

  const clearFood = () => {
    setSelectedFood(null);
    setFoodQuery('');
  };

  const results = selectedFood ? [] : searchFood(foodQuery);

  const hasRatio = profile?.insulinCarbRatio != null;
  const hasFactor = profile?.insulinSensitivityFactor != null;
  const hasRange = profile?.targetGlucoseMin != null && profile?.targetGlucoseMax != null;
  const canCalculate = hasRatio && hasFactor && hasRange;

  const parsed = insulinCalculatorSchema.safeParse({
    carbsGrams: values.carbsGrams ?? '',
    currentGlucose: values.currentGlucose ?? '',
  });

  const result =
    canCalculate && parsed.success && profile
      ? calculateInsulinDose({
          carbsGrams: parseCalculatorValue(parsed.data.carbsGrams),
          currentGlucose: parseCalculatorValue(parsed.data.currentGlucose),
          targetGlucose: (profile.targetGlucoseMin! + profile.targetGlucoseMax!) / 2,
          carbRatio: profile.insulinCarbRatio!,
          sensitivityFactor: profile.insulinSensitivityFactor!,
        })
      : null;

  return (
    <Screen
      keyboard
      header={<ScreenHeader title="Calculadora de dosis de insulina" safeTop={false} />}
      contentStyle={styles.content}
    >
      {!canCalculate ? (
        <Card padding="large" style={styles.warning}>
          <Text style={styles.warningTitle}>Configura tu ratio y tu factor</Text>
          <Text style={styles.warningBody}>
            Para calcular tu dosis necesitamos el ratio de carbohidratos y el factor de sensibilidad
            que te dio tu médico o nutricionista, y tu rango de glucosa. Configúralos en tu perfil.
          </Text>
          <Button
            title="Ir a Mi perfil"
            variant="secondary"
            onPress={() => router.push('/profile')}
          />
        </Card>
      ) : null}

      <Card padding="large" style={styles.form}>
        <Text style={styles.label}>Alimento</Text>
        <Input
          placeholder="Busca un alimento, ej. arepa"
          value={foodQuery}
          onChangeText={(text) => {
            setFoodQuery(text);
            if (selectedFood) setSelectedFood(null);
          }}
        />
        {selectedFood ? (
          <Button
            title={`${selectedFood.name} · cambiar`}
            variant="tertiary"
            size="small"
            onPress={clearFood}
            style={styles.clearFood}
          />
        ) : null}

        {results.length > 0 ? (
          <View style={styles.results}>
            {results.map((food) => (
              <ListRow
                key={food.id}
                title={food.name}
                subtitle={`${food.portion} · ${food.carbsGrams} g de CHO`}
                onPress={() => pickFood(food)}
                hideChevron
              />
            ))}
          </View>
        ) : null}

        <Controller
          control={control}
          name="carbsGrams"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Carbohidratos de la comida (g)"
              placeholder="Ej. 45"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.carbsGrams?.message}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          )}
        />

        <Controller
          control={control}
          name="currentGlucose"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Glucosa actual (mg/dL)"
              placeholder="Ej. 150"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.currentGlucose?.message}
              keyboardType="number-pad"
              maxLength={3}
            />
          )}
        />
      </Card>

      {result ? (
        <Card padding="large" style={styles.result} accessible accessibilityLiveRegion="polite">
          <Text style={styles.resultValue}>{result.totalDose} u</Text>
          <Text style={styles.resultLabel}>dosis total sugerida</Text>
          <View style={styles.breakdown}>
            <Text style={styles.breakdownItem}>Por la comida: {result.mealDose} u</Text>
            <Text style={styles.breakdownItem}>Por corrección: {result.correctionDose} u</Text>
          </View>
        </Card>
      ) : null}

      <Text style={styles.disclaimer}>
        Es solo una referencia a partir de los valores que configuraste. No reemplaza las
        indicaciones de tu médico.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  warning: { rowGap: space.sm },
  warningTitle: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  warningBody: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.text,
  },
  form: { rowGap: space.md },
  label: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  clearFood: { alignSelf: 'flex-start' },
  results: { rowGap: space.xs },
  result: { alignItems: 'center', rowGap: space.xs },
  resultValue: { ...type.hero, color: color.primary },
  resultLabel: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.textMuted,
  },
  breakdown: { marginTop: space.sm, alignItems: 'center', rowGap: space.xs },
  breakdownItem: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  disclaimer: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default InsulinCalculatorScreen;
