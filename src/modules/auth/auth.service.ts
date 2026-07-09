import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { ConflictError } from '../../errors/ConflictError';
import { UnauthorizedError } from '../../errors/UnauthorizedError';
import { NotFoundError } from '../../errors/NotFoundError';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './auth.validation';

// Fields safe to return to the client — password hash is never included.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  createdAt: true,
} as const;

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      phone: input.phone,
    },
    select: publicUserSelect,
  });

  const token = signToken({ id: user.id, role: user.role });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Deliberately identical message whether the email doesn't exist or the
  // password is wrong — avoids leaking which emails are registered.
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status === 'SUSPENDED') {
    throw new UnauthorizedError('Your account has been suspended. Contact support.');
  }

  const token = signToken({ id: user.id, role: user.role });

  const { password: _password, ...safeUser } = user;

  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  // Existence is implicitly guaranteed here — the caller is always an
  // authenticated request, and verifyTokenMiddleware already re-fetches
  // the user from the DB on every request, so a stale/deleted id can't
  // reach this function. update() still throws Prisma's P2025 (mapped to
  // a 404 by the global error handler) as a fallback if that ever changes.
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: publicUserSelect,
  });
};

export const changePassword = async (userId: string, input: ChangePasswordInput): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isCurrentPasswordValid = await comparePassword(input.currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const hashedPassword = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
