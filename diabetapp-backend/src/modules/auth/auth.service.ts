// Removed unused import of PrismaClient
import bcrypt from 'bcrypt';
import prisma from '../../config/db'; 
import { RegisterUserInput , LoginUserInput, AuthResponse } from './auth.types';
import jwt from 'jsonwebtoken';
import { string } from 'zod';


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

    async loginUser(credentials: LoginUserInput): Promise<AuthResponse> {
      try {
        // 1. Buscar usuario por email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            typeOfDiabetes: true,
            onboardingCompleted: true,
            password: true, // Necesario para comparar contraseñas
            createdAt: true
          }
        });
  
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }
  
        // 2. Verificar contraseña
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('INVALID_PASSWORD');
        }
  
        // 3. Generar token JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || 'default_secret', // Usar variable de entorno o valor por defecto
          { expiresIn: '1h' } // Expira en 1 hora
        );
  
        // 4. Preparar respuesta
        const authResponse: AuthResponse = {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            typeOfDiabetes: user.typeOfDiabetes ?? undefined,
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt
          },
          token
        };
  
        return authResponse;
  
      } catch (error: any) {
        // Si el usuario no se encuentra o la contraseña es incorrecta...
        if (error.message === 'USER_NOT_FOUND' || error.message === 'INVALID_PASSWORD') {
          // ...lanzamos un error específico y unificado.
          throw new Error('INVALID_CREDENTIALS');
        }
        
        // Para cualquier otro error inesperado (ej. fallo de la base de datos)
        console.error('Error inesperado durante el login:', error);
        // Lanzamos un error genérico que el controlador puede manejar.
        throw new Error('DATABASE_ERROR');
      }
    }
    
    async verifyToken(token: string) {
      try {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET_MISSING');
        }
  
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        
        // Verificar que el usuario aún existe y está activo
        const user = await prisma.user.findUnique({
          where: { 
            id: decoded.userId,
            isActive: true 
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            typeOfDiabetes: true,
            onboardingCompleted: true,
          }
        });
  
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }
  
        return { user, decoded };
  
      } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
          throw new Error('INVALID_TOKEN');
        }
        
        if (error.name === 'TokenExpiredError') {
          throw new Error('TOKEN_EXPIRED');
        }
        
        if (error.message === 'JWT_SECRET_MISSING') {
          throw error;
        }
        
        console.error('Error verifying token:', error);
        throw new Error('TOKEN_VERIFICATION_ERROR');
      }
    }

    
    
  }
  

  

  