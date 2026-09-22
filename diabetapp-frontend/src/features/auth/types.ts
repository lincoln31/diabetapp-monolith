/** Tipos del contrato de autenticación (specs/fase-1 y fase-2). */

export type DiabetesType = 'TYPE_1' | 'TYPE_2' | 'GESTATIONAL' | 'PREDIABETES';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  typeOfDiabetes: DiabetesType | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
  requiresOnboarding: boolean;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate: string; // ISO
  password: string;
}
