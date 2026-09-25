import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { getProfile, updateProfile } from './profile.controller';
import { updateProfileSchema } from './profile.schemas';

const router = Router();

// El perfil es siempre el del usuario de la sesión: no hay :id
router.use(authenticate);

router.get('/', getProfile);
router.put('/', validate({ body: updateProfileSchema }), updateProfile);

export default router;
