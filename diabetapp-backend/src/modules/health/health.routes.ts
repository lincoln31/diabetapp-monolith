import { Router, Request, Response } from 'express';
import { ok } from '../../shared/http/respond';

const router = Router();

/** Comprobación de vida del servicio (spec fase 1, RF-1.6). */
router.get('/', (_req: Request, res: Response) => ok(res, { status: 'ok' }));

export default router;
