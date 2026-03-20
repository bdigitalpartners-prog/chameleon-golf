import { PrismaClient } from "@prisma/client";

// Fix BigInt serialization from raw SQL queries (COUNT, SUM, etc.)
// This must be set before any JSON.stringify calls
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
