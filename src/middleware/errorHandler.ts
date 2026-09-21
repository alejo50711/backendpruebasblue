import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrio un error inesperado en el servidor',
  });
}
