import { PrismaClient } from '@prisma/client';

// Define a type for the global object with our prisma property
type GlobalWithPrisma = typeof globalThis & {
  prisma: PrismaClient | undefined;
};

// Cast the global object to our extended type
const globalForPrisma = global as unknown as GlobalWithPrisma;

// Initialize the Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, save the client instance to avoid multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}