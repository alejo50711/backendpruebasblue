import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/User';

export interface TokenPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as TokenPayload;
}
