/** Tipos del contrato de actividad física (spec fase 12, D-12.3). */

export type ActivityType =
  'WALKING' | 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'GYM' | 'YOGA' | 'OTHER';

export interface ExerciseActivity {
  id: string;
  type: ActivityType;
  durationMinutes: number;
  startedAt: string;
  notes: string | null;
}

export interface CreateExerciseInput {
  type: ActivityType;
  durationMinutes: number;
  startedAt?: string;
  notes?: string;
}

export interface GroupStats {
  days: number;
  average: number | null;
}

export interface ExerciseCorrelation {
  sufficientData: boolean;
  withExercise: GroupStats;
  withoutExercise: GroupStats;
  difference: number | null;
}

export interface ExerciseSummary {
  todayMinutes: number;
  goalMinutes: number;
  last7DaysMinutes: number;
  correlation: ExerciseCorrelation;
}
