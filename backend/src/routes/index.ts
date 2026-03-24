import { Router } from 'express';
import healthRouter from './health';
import mediaRouter from './media';
import adminRouter from './admin';

const router = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(adminRouter);

export default router;
