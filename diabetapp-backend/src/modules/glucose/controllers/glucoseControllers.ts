import { Request, Response } from 'express';
import { GlucoseService } from '../services/glucoseService';

const glucoseService = new GlucoseService();

// Controlador para obtener todas las lecturas de glucosa del usuario autenticado
export const getAllGlucoseReadings = async (req: Request, res: Response) => {
  try {
    // req.user.id está disponible gracias al middleware de autenticación
    const userId = req.user!.id;
    const readings = await glucoseService.getGlucoseReadingsByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: readings,
      count: readings.length
    });
  } catch (error: any) {
    console.error('Error obteniendo lecturas de glucosa:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error al obtener las lecturas de glucosa'
    });
  }
};

// Controlador para obtener una lectura específica por ID
export const getGlucoseReadingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const reading = await glucoseService.getGlucoseReadingById(id, userId);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'READING_NOT_FOUND',
        message: 'Lectura de glucosa no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: reading
    });
  } catch (error: any) {
    console.error('Error obteniendo lectura de glucosa:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error al obtener la lectura de glucosa'
    });
  }
};

// Controlador para crear una nueva lectura de glucosa
export const createGlucoseReading = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const readingData = { ...req.body, userId };
    
    const newReading = await glucoseService.createGlucoseReading(readingData);
    
    res.status(201).json({
      success: true,
      data: newReading,
      message: 'Lectura de glucosa creada exitosamente'
    });
  } catch (error: any) {
    console.error('Error creando lectura de glucosa:', error);
    
    if (error.message === 'INVALID_GLUCOSE_VALUE') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_GLUCOSE_VALUE',
        message: 'El valor de glucosa debe estar entre 20 y 600 mg/dL'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error al crear la lectura de glucosa'
    });
  }
};

// Controlador para actualizar una lectura de glucosa
export const updateGlucoseReading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;
    
    const updatedReading = await glucoseService.updateGlucoseReading(id, userId, updateData);
    
    if (!updatedReading) {
      return res.status(404).json({
        success: false,
        error: 'READING_NOT_FOUND',
        message: 'Lectura de glucosa no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedReading,
      message: 'Lectura de glucosa actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando lectura de glucosa:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No tienes permisos para modificar esta lectura'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error al actualizar la lectura de glucosa'
    });
  }
};

// Controlador para eliminar una lectura de glucosa
export const deleteGlucoseReading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const deleted = await glucoseService.deleteGlucoseReading(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'READING_NOT_FOUND',
        message: 'Lectura de glucosa no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lectura de glucosa eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error eliminando lectura de glucosa:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No tienes permisos para eliminar esta lectura'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error al eliminar la lectura de glucosa'
    });
  }
};
