import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { AchievementsService } from './achievements.service';

const achievementsService = new AchievementsService();

export const getAchievements = async (req: Request, res: Response) => {
  return ok(res, await achievementsService.get(req.user!.id));
};
