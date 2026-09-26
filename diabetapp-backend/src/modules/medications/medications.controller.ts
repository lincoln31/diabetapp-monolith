import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedBody, validatedParams } from '../../shared/middleware/validate';
import {
  CreateMedicationInput,
  LogIntakeInput,
  MedicationIdParams,
  UpdateMedicationInput,
} from './medications.schemas';
import { MedicationsService } from './medications.service';

const medicationsService = new MedicationsService();

export const createMedication = async (req: Request, res: Response) => {
  const medication = await medicationsService.create(
    req.user!.id,
    validatedBody<CreateMedicationInput>(req),
  );

  return ok(res, medication, { status: 201 });
};

export const listMedications = async (req: Request, res: Response) => {
  return ok(res, { medications: await medicationsService.list(req.user!.id) });
};

export const updateMedication = async (req: Request, res: Response) => {
  const { id } = validatedParams<MedicationIdParams>(req);

  return ok(
    res,
    await medicationsService.update(id, req.user!.id, validatedBody<UpdateMedicationInput>(req)),
  );
};

export const archiveMedication = async (req: Request, res: Response) => {
  const { id } = validatedParams<MedicationIdParams>(req);
  await medicationsService.archive(id, req.user!.id);

  return ok(res, null);
};

export const logMedicationIntake = async (req: Request, res: Response) => {
  const { id } = validatedParams<MedicationIdParams>(req);
  const { takenAt } = validatedBody<LogIntakeInput>(req);

  return ok(res, await medicationsService.logIntake(id, req.user!.id, takenAt), { status: 201 });
};

export const getMedicationAdherence = async (req: Request, res: Response) => {
  return ok(res, await medicationsService.getAdherence(req.user!.id));
};
