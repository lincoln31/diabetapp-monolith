import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedBody, validatedParams, validatedQuery } from '../../shared/middleware/validate';
import {
  CreateGlucoseInput,
  GlucoseIdParams,
  ListGlucoseQuery,
  UpdateGlucoseInput,
} from './glucose.schemas';
import { GlucoseService } from './glucose.service';

const glucoseService = new GlucoseService();

export const listGlucoseReadings = async (req: Request, res: Response) => {
  const { readings, meta } = await glucoseService.list(
    req.user!.id,
    validatedQuery<ListGlucoseQuery>(req),
  );

  return ok(res, readings, { meta });
};

export const getGlucoseStats = async (req: Request, res: Response) => {
  return ok(res, await glucoseService.getStats(req.user!.id));
};

export const getGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);

  return ok(res, await glucoseService.getById(id, req.user!.id));
};

export const createGlucoseReading = async (req: Request, res: Response) => {
  const reading = await glucoseService.create(req.user!.id, validatedBody<CreateGlucoseInput>(req));

  return ok(res, reading, { status: 201 });
};

export const updateGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);

  return ok(
    res,
    await glucoseService.update(id, req.user!.id, validatedBody<UpdateGlucoseInput>(req)),
  );
};

export const deleteGlucoseReading = async (req: Request, res: Response) => {
  const { id } = validatedParams<GlucoseIdParams>(req);
  await glucoseService.remove(id, req.user!.id);

  return ok(res, null);
};
