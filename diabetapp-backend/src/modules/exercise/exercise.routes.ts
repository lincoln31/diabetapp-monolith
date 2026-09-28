import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  createExercise,
  deleteExercise,
  getExerciseSummary,
  listExercise,
} from './exercise.controller';
import {
  createExerciseSchema,
  exerciseIdParamsSchema,
  listExerciseQuerySchema,
} from './exercise.schemas';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listExerciseQuerySchema }), listExercise);
// Antes de "/:id" (spec fase 12, D-12.3): si no, Express la trataría como un id.
router.get('/summary', getExerciseSummary);
router.post('/', validate({ body: createExerciseSchema }), createExercise);
router.delete('/:id', validate({ params: exerciseIdParamsSchema }), deleteExercise);

export default router;
