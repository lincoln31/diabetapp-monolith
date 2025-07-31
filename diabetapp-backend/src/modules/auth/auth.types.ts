// types/auth.types.ts
export interface RegisterUserInput {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    typeOfDiabetes?: 'TYPE_1' | 'TYPE_2' | 'GESTACIONAL' | 'PREDIABETES';
    birthDate?: string; // ISO date string
  }
  