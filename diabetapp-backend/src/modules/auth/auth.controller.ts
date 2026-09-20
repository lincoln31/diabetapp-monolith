import { Request, Response } from 'express';
import { ok } from '../../shared/http/respond';
import { validatedQuery } from '../../shared/middleware/validate';
import { AuthService } from './auth.service';
import { CheckEmailQuery } from './auth.schemas';

const authService = new AuthService();

// Express 5 envía al errorHandler cualquier promesa rechazada: sin try/catch (RNF-1.1)

export const registerController = async (req: Request, res: Response) => {
  const { user, token } = await authService.createUser(req.body);

  return ok(res, { user, token, requiresOnboarding: true }, { status: 201 });
};

export const loginController = async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);

  return ok(res, { user, token, requiresOnboarding: !user.onboardingCompleted });
};

export const checkEmailController = async (req: Request, res: Response) => {
  const { email } = validatedQuery<CheckEmailQuery>(req);
  const available = await authService.checkEmailAvailability(email);

  return ok(res, { email, available });
};

export const verifyTokenController = async (req: Request, res: Response) => {
  const user = await authService.getActiveUser(req.user!.id);

  return ok(res, { user });
};
