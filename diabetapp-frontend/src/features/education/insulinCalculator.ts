/** Cálculo de dosis de insulina (spec fase 17, D-17.5): solo aritmética, sin recomendar nada por sí sola. */
export interface InsulinDoseInput {
  /** Carbohidratos de la comida, en gramos. */
  carbsGrams: number;
  /** Glucosa actual del paciente, en mg/dL. */
  currentGlucose: number;
  /** Meta de corrección: punto medio del rango guardado en el perfil (RF-17.5). */
  targetGlucose: number;
  /** Gramos de carbohidratos que cubre 1 unidad. */
  carbRatio: number;
  /** mg/dL que baja la glucosa 1 unidad. */
  sensitivityFactor: number;
}

export interface InsulinDoseResult {
  mealDose: number;
  correctionDose: number;
  /** Suma redondeada al 0.5 de unidad más cercano, nunca negativa (RF-17.4, RNF-17.3). */
  totalDose: number;
}

const roundToHalf = (value: number): number => Math.round(value / 0.5) * 0.5;

export const calculateInsulinDose = ({
  carbsGrams,
  currentGlucose,
  targetGlucose,
  carbRatio,
  sensitivityFactor,
}: InsulinDoseInput): InsulinDoseResult => {
  const mealDose = carbsGrams / carbRatio;
  const correctionDose = Math.max(0, (currentGlucose - targetGlucose) / sensitivityFactor);
  const totalDose = Math.max(0, roundToHalf(mealDose + correctionDose));

  return {
    mealDose: Math.round(mealDose * 100) / 100,
    correctionDose: Math.round(correctionDose * 100) / 100,
    totalDose,
  };
};
