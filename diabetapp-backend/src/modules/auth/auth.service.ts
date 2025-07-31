import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../../config/db'; 
import { RegisterUserInput } from './auth.types';


export class AuthService {
    async createUser(userData: RegisterUserInput) {
      try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email.toLowerCase() }, // Normalizar email
        });
  
        if (existingUser) {
          throw new Error('USER_ALREADY_EXISTS');
        }
  
        // 2. Hashear la contraseña (12 rounds para datos médicos)
        const hashedPassword = await bcrypt.hash(userData.password, 12);
  
        // 3. Preparar datos para creación
        const createData: any = {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          typeOfDiabetes: userData.typeOfDiabetes,
          onboardingCompleted: false, // Usuario nuevo necesita onboarding
          isActive: true,
          dataConsentAt: new Date(), // Registro implica consentimiento inicial
        };
  
        // Procesar fecha de nacimiento si viene
        if (userData.birthDate) {
          createData.birthDate = new Date(userData.birthDate);
        }
  
        // 4. Crear el nuevo usuario
        const newUser = await prisma.user.create({
          data: createData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            typeOfDiabetes: true,
            onboardingCompleted: true,
            createdAt: true,
            // Excluir password explícitamente
          }
        });
  
        return newUser;
  
      } catch (error: any) {
        // Re-lanzar errores conocidos
        if (error.message === 'USER_ALREADY_EXISTS') {
          throw error;
        }
        
        // Error inesperado de Prisma o base de datos
        console.error('Error creating user:', error);
        throw new Error('DATABASE_ERROR');
      }
    }
  
    async checkEmailAvailability(email: string) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true }
      });
      
      return !existingUser; // true si está disponible
    }
  }