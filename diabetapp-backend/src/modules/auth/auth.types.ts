// types/auth.types.ts
export interface RegisterUserInput {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    typeOfDiabetes?: 'TYPE_1' | 'TYPE_2' | 'GESTACIONAL' | 'PREDIABETES';
    birthDate?: string; // ISO date string
  }
  
  // Nueva interface para login
export interface LoginUserInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    typeOfDiabetes?: string;
    onboardingCompleted: boolean;
    createdAt: Date;
  };
  token: string;
}