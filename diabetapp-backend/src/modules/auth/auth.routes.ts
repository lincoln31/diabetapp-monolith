// ./modules/auth/auth.routes.ts

import { Router } from 'express';
import {
    registerController,
    loginController,
    checkEmailController,
    verifyTokenController
} from './auth.controller';

const router = Router();

// --- Definiciones de Rutas de Autenticación ---

// POST /api/auth/register
router.post('/register', registerController);

// POST /api/auth/login
router.post('/login', loginController);

// GET /api/auth/check-email?email=some@email.com
router.get('/check-email', checkEmailController);

// GET /api/auth/verify-token (requiere header de Authorization)
router.get('/verify-token', verifyTokenController);

export default router;