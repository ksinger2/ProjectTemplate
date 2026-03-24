import { Router } from 'express';
import healthRouter from './health';
import mediaRouter from './media';
import adminRouter from './admin';
import streamRouter from './stream';
import subtitlesRouter from './subtitles';
import authRouter from './auth';
import usersRouter from './users';
import watchHistoryRouter from './watch-history';
import ratingsRouter from './ratings';
import friendsRouter from './friends';
import recommendationsRouter from './recommendations';
import sessionsRouter from './sessions';
import statsRouter from './stats';
import uploadRouter from './upload';
import commentsRouter from './comments';

const router = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(adminRouter);
router.use(streamRouter);
router.use(subtitlesRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(watchHistoryRouter);
router.use(ratingsRouter);
router.use(friendsRouter);
router.use(recommendationsRouter);
router.use(sessionsRouter);
router.use(statsRouter);
router.use(uploadRouter);
router.use(commentsRouter);

export default router;
