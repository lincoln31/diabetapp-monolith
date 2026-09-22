import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { AuthService } from './auth.service';

const authService = new AuthService();

// Express 5 envía al errorHandler cualquier promesa rechazada: sin try/catch (RNF-1.1)

export const registerController = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.createUser(req.body);

  return ok(res, { user, accessToken, refreshToken, requiresOnboarding: true }, { status: 201 });
};

export const loginController = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  return ok(res, {
    user,
    accessToken,
    refreshToken,
    requiresOnboarding: !user.onboardingCompleted,
  });
};

export const refreshController = async (req: Request, res: Response) => {
  const tokens = await authService.refreshSession(req.body.refreshToken);

  return ok(res, tokens);
};

export const logoutController = async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);

  return ok(res, null);
};

export const meController = async (req: Request, res: Response) => {
  const user = await authService.getActiveUser(req.user!.id);

  return ok(res, { user });
};
