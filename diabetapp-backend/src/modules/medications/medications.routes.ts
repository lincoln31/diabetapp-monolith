import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  archiveMedication,
  createMedication,
  getMedicationAdherence,
  listMedications,
  logMedicationIntake,
  updateMedication,
} from './medications.controller';
import {
  createMedicationSchema,
  logIntakeSchema,
  medicationIdParamsSchema,
  updateMedicationSchema,
} from './medications.schemas';

const router = Router();

router.use(authenticate);

router.get('/', listMedications);
// Antes de "/:id" (spec fase 11, D-11.3): si no, Express la trataría como un id.
router.get('/adherence', getMedicationAdherence);
router.post('/', validate({ body: createMedicationSchema }), createMedication);
router.put(
  '/:id',
  validate({ params: medicationIdParamsSchema, body: updateMedicationSchema }),
  updateMedication,
);
router.delete('/:id', validate({ params: medicationIdParamsSchema }), archiveMedication);
router.post(
  '/:id/intakes',
  validate({ params: medicationIdParamsSchema, body: logIntakeSchema }),
  logMedicationIntake,
);

export default router;
