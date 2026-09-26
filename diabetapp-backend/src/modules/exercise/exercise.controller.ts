import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedBody, validatedParams, validatedQuery } from '../../shared/middleware/validate';
import { CreateExerciseInput, ExerciseIdParams, ListExerciseQuery } from './exercise.schemas';
import { ExerciseService } from './exercise.service';

const exerciseService = new ExerciseService();

export const createExercise = async (req: Request, res: Response) => {
  const activity = await exerciseService.create(
    req.user!.id,
    validatedBody<CreateExerciseInput>(req),
  );

  return ok(res, activity, { status: 201 });
};

export const listExercise = async (req: Request, res: Response) => {
  const { activities, meta } = await exerciseService.list(
    req.user!.id,
    validatedQuery<ListExerciseQuery>(req),
  );

  return ok(res, activities, { meta });
};

export const getExerciseSummary = async (req: Request, res: Response) => {
  return ok(res, await exerciseService.getSummary(req.user!.id));
};

export const deleteExercise = async (req: Request, res: Response) => {
  const { id } = validatedParams<ExerciseIdParams>(req);
  await exerciseService.remove(id, req.user!.id);

  return ok(res, null);
};
