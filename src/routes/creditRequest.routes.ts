import { Router } from 'express';
import {
  createCreditRequest,
  getCreditRequest,
  listCreditRequests,
  updateCreditRequestStatus,
} from '../controllers/creditRequest.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';

export const creditRequestRouter = Router();

creditRequestRouter.use(authenticate);

// Solo un cliente crea solicitudes (para si mismo).
creditRequestRouter.post('/', authorize(UserRole.CLIENT), createCreditRequest);

// Un cliente ve las propias, un trabajador las ve todas (logica en el servicio).
creditRequestRouter.get('/', listCreditRequests);
creditRequestRouter.get('/:id', getCreditRequest);

// Solo un trabajador aprueba/rechaza.
creditRequestRouter.patch('/:id/status', authorize(UserRole.WORKER), updateCreditRequestStatus);
