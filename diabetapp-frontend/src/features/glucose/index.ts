/** API pública de la funcionalidad de glucosa (spec fase 3, RF-3.1; ampliada en la fase 15). */
export { glucoseApi } from './api';
export { MOMENT_OF_DAY_OPTIONS } from './constants';
export { getRangeStatus } from './rangeStatus';
export type { RangeStatus } from './rangeStatus';
export { formatWhen } from './history';
export { default as StatusBadge } from './components/StatusBadge';
export { default as GlucoseFormScreen } from './screens/GlucoseFormScreen';
export { default as GlucoseEditScreen } from './screens/GlucoseEditScreen';
export { default as GlucoseHistoryScreen } from './screens/GlucoseHistoryScreen';
export type { GlucoseReading, MomentOfDay, CreateGlucoseInput } from './types';
