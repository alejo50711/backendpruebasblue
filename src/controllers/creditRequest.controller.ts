import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { CreditRequest } from '../entities/CreditRequest';
import { CreditRequestService, RequestingUser } from '../services/creditRequest.service';
import {
  createCreditRequestSchema,
  listQuerySchema,
  updateStatusSchema,
} from '../validators/creditRequest.validators';
import { parseWithSchema } from '../utils/validation';
import { ApiError } from '../errors/ApiError';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const service = new CreditRequestService(AppDataSource.getRepository(CreditRequest));

function toResponseDto(entity: CreditRequest) {
  return {
    id: entity.id,
    amount: Number(entity.amount),
    termMonths: entity.termMonths,
    applicantId: entity.applicantId,
    status: entity.status,
    comment: entity.comment,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function requireRequester(req: AuthenticatedRequest): RequestingUser {
  if (!req.user) {
    throw ApiError.unauthorized('Debes iniciar sesion para acceder a este recurso');
  }
  return { userId: req.user.sub, role: req.user.role };
}

export async function createCreditRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requester = requireRequester(req);
    const input = parseWithSchema(createCreditRequestSchema, req.body);
    const created = await service.create(input, requester);
    res.status(201).json({ success: true, data: toResponseDto(created) });
  } catch (err) {
    next(err);
  }
}

export async function listCreditRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requester = requireRequester(req);
    const { status } = parseWithSchema(listQuerySchema, req.query);
    const requests = await service.list(status, requester);
    res.status(200).json({ success: true, data: requests.map(toResponseDto) });
  } catch (err) {
    next(err);
  }
}

export async function getCreditRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requester = requireRequester(req);
    const id = parseId(req.params.id);
    const found = await service.getById(id, requester);
    res.status(200).json({ success: true, data: toResponseDto(found) });
  } catch (err) {
    next(err);
  }
}

export async function updateCreditRequestStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requester = requireRequester(req);
    const id = parseId(req.params.id);
    const input = parseWithSchema(updateStatusSchema, req.body);
    const updated = await service.updateStatus(id, input, requester);
    res.status(200).json({ success: true, data: toResponseDto(updated) });
  } catch (err) {
    next(err);
  }
}

function parseId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`El id "${rawId}" no es valido`);
  }
  return id;
}
