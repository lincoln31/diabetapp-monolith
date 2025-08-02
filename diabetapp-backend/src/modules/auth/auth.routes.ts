import { Router } from 'express';
import { 
    registerController, 
    loginController, 
    checkEmailController,
    verifyTokenController 
  } from './auth.controller';
  

const router = Router();

// Definimos la ruta de registro
router.post('/register', registerController);

// Verificar disponibilidad de email (opcional, para UX)
router.get('/check-email', checkEmailController);

// Nuevas rutas
router.post('/login', loginController);
router.get('/verify-token', verifyTokenController);

export default router;