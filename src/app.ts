import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Sin restriccion de origen: el frontend se prueba desde distintos puertos
  // locales y despliegues, y la API se autentica con JWT por header (no
  // cookies), asi que abrir CORS no habilita CSRF con la sesion de nadie.
  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
