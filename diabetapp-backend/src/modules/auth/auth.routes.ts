import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  checkEmailController,
  loginController,
  registerController,
  verifyTokenController,
} from './auth.controller';
import { checkEmailSchema, loginSchema, registerSchema } from './auth.schemas';

const router = Router();

router.post('/register', validate({ body: registerSchema }), registerController);
router.post('/login', validate({ body: loginSchema }), loginController);
router.get('/check-email', validate({ query: checkEmailSchema }), checkEmailController);
router.get('/verify-token', authenticate, verifyTokenController);

export default router;
