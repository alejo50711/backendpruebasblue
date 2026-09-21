import { Router } from 'express';
import { creditRequestRouter } from './creditRequest.routes';
import { authRouter } from './auth.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/credit-requests', creditRequestRouter);
