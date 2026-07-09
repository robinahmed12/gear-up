import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';

/**
 * Prisma 7 removed the bundled Rust query engine — Prisma Client now runs
 * as a lightweight TypeScript/WASM library and requires an explicit driver
 * adapter for whichever database you're connecting to. Here that's
 * @prisma/adapter-pg wrapping the standard `pg` driver.
 *
 * A single shared PrismaClient instance is used for the whole app, cached
 * on `global` outside production so dev-server restarts (tsx watch) don't
 * spawn a new instance per reload and exhaust the connection pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
