import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedBody } from '../../shared/middleware/validate';
import { UpdateProfileInput } from './profile.schemas';
import { ProfileService } from './profile.service';

const profileService = new ProfileService();

export const getProfile = async (req: Request, res: Response) => {
  return ok(res, await profileService.get(req.user!.id));
};

export const updateProfile = async (req: Request, res: Response) => {
  return ok(res, await profileService.update(req.user!.id, validatedBody<UpdateProfileInput>(req)));
};
