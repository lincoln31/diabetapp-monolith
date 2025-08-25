import prisma from '../../../config/db';

interface GlucoseReadingInput {
  value: number;
  timestamp: Date;
  momentOfDay?: 'BEFORE_BREAKFAST' | 'AFTER_BREAKFAST' | 'BEFORE_LUNCH' | 'AFTER_LUNCH' | 'BEFORE_DINNER' | 'AFTER_DINNER' | 'BEFORE_SLEEP' | 'OTHER';
  notes?: string;
  userId: string;
}

interface GlucoseReadingUpdate {
  value?: number;
  timestamp?: Date;
  momentOfDay?: 'BEFORE_BREAKFAST' | 'AFTER_BREAKFAST' | 'BEFORE_LUNCH' | 'AFTER_LUNCH' | 'BEFORE_DINNER' | 'AFTER_DINNER' | 'BEFORE_SLEEP' | 'OTHER';
  notes?: string;
}

export class GlucoseService {
  // Validar valor de glucosa
  private validateGlucoseValue(value: number): boolean {
    return value >= 20 && value <= 600; // Rango realista para lecturas de glucosa
  }

  // Obtener todas las lecturas de glucosa de un usuario
  async getGlucoseReadingsByUserId(userId: string) {
    try {
      const readings = await prisma.glucoseReading.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          value: true,
          timestamp: true,
          momentOfDay: true,
          notes: true,
          createdAt: true,
          
        }
      });
      
      return readings;
    } catch (error) {
      console.error('Error obteniendo lecturas de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // Obtener una lectura específica por ID
  async getGlucoseReadingById(id: string, userId: string) {
    try {
      const reading = await prisma.glucoseReading.findFirst({
        where: { 
          id,
          userId // Asegurar que solo el usuario propietario pueda acceder
        },
        select: {
          id: true,
          value: true,
          timestamp: true,
          momentOfDay: true,
          notes: true,
          createdAt: true,
        }
      });
      
      return reading;
    } catch (error) {
      console.error('Error obteniendo lectura de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // Crear una nueva lectura de glucosa
  async createGlucoseReading(data: GlucoseReadingInput) {
    try {
      // Validar valor de glucosa
      if (!this.validateGlucoseValue(data.value)) {
        throw new Error('INVALID_GLUCOSE_VALUE');
      }

      const newReading = await prisma.glucoseReading.create({
        data: {
          value: data.value,
          timestamp: data.timestamp,
          momentOfDay: data.momentOfDay || 'OTHER',
          notes: data.notes,
          userId: data.userId
        },
        select: {
          id: true,
          value: true,
          timestamp: true,
          momentOfDay: true,
          notes: true,
          createdAt: true,
        }
      });
      
      return newReading;
    } catch (error: any) {
      if (error.message === 'INVALID_GLUCOSE_VALUE') {
        throw error;
      }
      
      console.error('Error creando lectura de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // Actualizar una lectura de glucosa
  async updateGlucoseReading(id: string, userId: string, updateData: GlucoseReadingUpdate) {
    try {
      // Verificar que la lectura existe y pertenece al usuario
      const existingReading = await prisma.glucoseReading.findFirst({
        where: { id, userId }
      });

      if (!existingReading) {
        return null; // No se encontró la lectura
      }

      // Validar valor de glucosa si se está actualizando
      if (updateData.value && !this.validateGlucoseValue(updateData.value)) {
        throw new Error('INVALID_GLUCOSE_VALUE');
      }

      const updatedReading = await prisma.glucoseReading.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          value: true,
          timestamp: true,
          momentOfDay: true,
          notes: true,
          createdAt: true,
          
        }
      });
      
      return updatedReading;
    } catch (error: any) {
      if (error.message === 'INVALID_GLUCOSE_VALUE') {
        throw error;
      }
      
      console.error('Error actualizando lectura de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // Eliminar una lectura de glucosa
  async deleteGlucoseReading(id: string, userId: string) {
    try {
      // Verificar que la lectura existe y pertenece al usuario
      const existingReading = await prisma.glucoseReading.findFirst({
        where: { id, userId }
      });

      if (!existingReading) {
        return false; // No se encontró la lectura
      }

      await prisma.glucoseReading.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error('Error eliminando lectura de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // Obtener estadísticas de glucosa del usuario
  async getGlucoseStats(userId: string) {
    try {
      const stats = await prisma.glucoseReading.aggregate({
        where: { userId },
        _avg: {
          value: true
        },
        _min: {
          value: true
        },
        _max: {
          value: true
        },
        _count: {
          value: true
        }
      });

      return {
        average: stats._avg.value || 0,
        minimum: stats._min.value || 0,
        maximum: stats._max.value || 0,
        totalReadings: stats._count.value || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de glucosa:', error);
      throw new Error('DATABASE_ERROR');
    }
  }
}
