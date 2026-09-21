import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { AuthService } from '../services/auth.service';
import { loginSchema, registerSchema } from '../validators/auth.validators';
import { parseWithSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

const authService = new AuthService(AppDataSource.getRepository(User));

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseWithSchema(registerSchema, req.body);
    const result = await authService.register(input);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseWithSchema(loginSchema, req.body);
    const result = await authService.login(input);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      throw ApiError.unauthorized('Debes iniciar sesion');
    }
    res.status(200).json({ success: true, data: { id: user.sub, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}
