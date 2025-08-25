import { Router } from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { 
  getAllGlucoseReadings, 
  getGlucoseReadingById, 
  createGlucoseReading, 
  updateGlucoseReading, 
  deleteGlucoseReading 
} from '../controllers/glucoseControllers';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas de glucosa
router.use(authenticateToken);

// Rutas protegidas (requieren autenticación)
router.get('/', getAllGlucoseReadings);           // GET /glucose - Obtener todas las lecturas del usuario
router.get('/:id', getGlucoseReadingById);       // GET /glucose/:id - Obtener lectura específica
router.post('/', createGlucoseReading);          // POST /glucose - Crear nueva lectura
router.put('/:id', updateGlucoseReading);        // PUT /glucose/:id - Actualizar lectura
router.delete('/:id', deleteGlucoseReading);     // DELETE /glucose/:id - Eliminar lectura

export default router;
