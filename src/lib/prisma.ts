/**
 * @file prisma.ts
 * @description Cliente de Prisma Singleton configurado con el adaptador LibSQL.
 *
 * Características:
 *   - Compatible tanto con SQLite local (`dev.db`) como con Turso en la nube (`libsql://...`).
 *   - Compatible con ejecución en Server Components, API routes y empaquetado Next.js.
 *   - Patrón Singleton en desarrollo para evitar agotar las conexiones durante Hot Module Replacement (HMR).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
