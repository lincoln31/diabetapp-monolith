import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedParams, validatedQuery } from '../../shared/middleware/validate';
import { GlucoseIdParams, ListGlucoseQuery } from './glucose.schemas';
import { GlucoseService } from './glucose.service';

const glucoseService = new GlucoseService();

export const listGlucoseReadings = async (req: Request, res: Response) => {
  const { readings, meta } = await glucoseService.list(
    req.user!.id,
    validatedQuery<ListGlucoseQuery>(req),
  );

  return ok(res, readings, { meta });
};

export const getGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);

  return ok(res, await glucoseService.getById(id, req.user!.id));
};

export const createGlucoseReading = async (req: Request, res: Response) => {
  const reading = await glucoseService.create(req.user!.id, req.body);

  return ok(res, reading, { status: 201 });
};

export const updateGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);

  return ok(res, await glucoseService.update(id, req.user!.id, req.body));
};

export const deleteGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);
  await glucoseService.remove(id, req.user!.id);

  return ok(res, null);
};
