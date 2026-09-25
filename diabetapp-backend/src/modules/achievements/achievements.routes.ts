import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { getAchievements } from './achievements.controller';

const router = Router();

// Siempre los logros del usuario de la sesión: no hay :id
router.use(authenticate);

router.get('/', getAchievements);

export default router;
