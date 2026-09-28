/** API pública de la funcionalidad de medicación (spec fase 11, D-11.5). */
export { medicationsApi } from './api';
export { useAdherence } from './hooks/useAdherence';
export { default as AdherenceCard } from './components/AdherenceCard';
export { default as MedicationsScreen } from './screens/MedicationsScreen';
export { default as MedicationFormScreen } from './screens/MedicationFormScreen';
export type { AdherenceStats, Medication } from './types';
