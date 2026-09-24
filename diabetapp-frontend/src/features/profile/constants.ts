import type { DiabetesType } from '@/src/features/auth';
import { ActivityLevel } from './types';

/** Los valores son los de los enums del backend; '' es «sin especificar». */
export const DIABETES_TYPE_OPTIONS: { label: string; value: DiabetesType | '' }[] = [
  { label: 'Sin especificar', value: '' },
  { label: 'Tipo 1', value: 'TYPE_1' },
  { label: 'Tipo 2', value: 'TYPE_2' },
  { label: 'Gestacional', value: 'GESTATIONAL' },
  { label: 'Prediabetes', value: 'PREDIABETES' },
];

export const ACTIVITY_LEVEL_OPTIONS: { label: string; value: ActivityLevel | '' }[] = [
  { label: 'Sin especificar', value: '' },
  { label: 'Sedentario', value: 'SEDENTARY' },
  { label: 'Ligero', value: 'LIGHT' },
  { label: 'Moderado', value: 'MODERATE' },
  { label: 'Activo', value: 'ACTIVE' },
];
