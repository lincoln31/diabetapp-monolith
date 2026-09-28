import { ActivityType } from './types';

/** Los valores son los del enum `ActivityType` del backend (spec fase 12, D-12.1). */
export const ACTIVITY_TYPE_OPTIONS: { label: string; value: ActivityType }[] = [
  { label: 'Caminar', value: 'WALKING' },
  { label: 'Correr', value: 'RUNNING' },
  { label: 'Bicicleta', value: 'CYCLING' },
  { label: 'Natación', value: 'SWIMMING' },
  { label: 'Gimnasio', value: 'GYM' },
  { label: 'Yoga', value: 'YOGA' },
  { label: 'Otro', value: 'OTHER' },
];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ActivityType, string>;
