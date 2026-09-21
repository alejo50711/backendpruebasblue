import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import { UserRole } from '../entities/User';
import { TokenPayload, verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Debes iniciar sesion para acceder a este recurso'));
    return;
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    next(ApiError.unauthorized('El token es invalido o expiro'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      next(ApiError.forbidden('No tienes permisos para realizar esta accion'));
      return;
    }
    next();
  };
}
