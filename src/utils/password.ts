import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Thin wrapper around bcryptjs so the salt round count lives in one
 * configurable place (env.BCRYPT_SALT_ROUNDS) instead of being a magic
 * number scattered across the codebase.
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
