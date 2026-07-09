import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '../constants/roles.js';
import { env } from '../config/env';

export interface JwtPayload {
  id: string;
  role: Role;
}

/**
 * Signs a JWT containing only non-sensitive identifiers (id + role).
 * Never embed email, password hashes, or other PII in the token payload —
 * JWTs are base64, not encrypted, and are readable by anyone holding one.
 */
export const signToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
