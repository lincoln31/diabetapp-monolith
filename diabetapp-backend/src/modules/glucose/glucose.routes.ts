import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  createGlucoseReading,
  deleteGlucoseReading,
  getGlucoseReading,
  getGlucoseStats,
  listGlucoseReadings,
  updateGlucoseReading,
} from './glucose.controller';
import {
  createGlucoseSchema,
  glucoseIdParamsSchema,
  listGlucoseQuerySchema,
  updateGlucoseSchema,
} from './glucose.schemas';

const router = Router();

// Todas las lecturas pertenecen a un usuario: siempre hace falta sesión
router.use(authenticate);

router.get('/', validate({ query: listGlucoseQuerySchema }), listGlucoseReadings);
// Antes de "/:id" (spec fase 5, D-5.4): si no, Express trata "stats" como un id.
router.get('/stats', getGlucoseStats);
router.get('/:id', validate({ params: glucoseIdParamsSchema }), getGlucoseReading);
router.post('/', validate({ body: createGlucoseSchema }), createGlucoseReading);
router.put(
  '/:id',
  validate({ params: glucoseIdParamsSchema, body: updateGlucoseSchema }),
  updateGlucoseReading,
);
router.delete('/:id', validate({ params: glucoseIdParamsSchema }), deleteGlucoseReading);

export default router;
