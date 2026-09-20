import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import {
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
} from '../../shared/middleware/rateLimit';
import { validate } from '../../shared/middleware/validate';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from './auth.controller';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas';

const router = Router();

router.post('/register', registerRateLimit, validate({ body: registerSchema }), registerController);
router.post('/login', loginRateLimit, validate({ body: loginSchema }), loginController);
router.post('/refresh', refreshRateLimit, validate({ body: refreshSchema }), refreshController);
// logout no exige token de acceso: debe funcionar aunque haya expirado
router.post('/logout', validate({ body: refreshSchema }), logoutController);
router.get('/me', authenticate, meController);

export default router;
