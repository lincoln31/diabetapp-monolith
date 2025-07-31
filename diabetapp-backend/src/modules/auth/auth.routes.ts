import { Router } from 'express';
import { registerController, checkEmailController } from './auth.controller';

const router = Router();

// Definimos la ruta de registro
router.post('/register', registerController);

// Verificar disponibilidad de email (opcional, para UX)
router.get('/check-email', checkEmailController);

export default router;