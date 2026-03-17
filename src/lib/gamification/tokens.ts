import prisma from '@/lib/prisma';
import { TokenSource, TokenTransactionType } from '@prisma/client';

/**
 * Award EQ Tokens to a user. Founders members receive a 2x multiplier.
 */
export async function earnTokens(
  userId: string,
  source: TokenSource,
  amount: number,
  description: string
): Promise<{ amount: number; isFounder: boolean }> {
  // Check if user is a Founders member for 2x rate
  const foundersMembership = await prisma.foundersMembership.findUnique({
    where: { userId },
  });

  const isFounder = foundersMembership?.status === 'ACTIVE';
  const multiplier = isFounder ? 2 : 1;
  const finalAmount = amount * multiplier;

  await prisma.eqTokenTransaction.create({
    data: {
      userId,
      amount: finalAmount,
      type: 'EARNED' as TokenTransactionType,
      source,
      description: isFounder ? `${description} (2x Founders bonus)` : description,
    },
  });

  return { amount: finalAmount, isFounder };
}

/**
 * Spend EQ Tokens from a user's balance. Returns false if insufficient balance.
 */
export async function spendTokens(
  userId: string,
  source: TokenSource,
  amount: number,
  description: string
): Promise<boolean> {
  const balance = await getTokenBalance(userId);
  if (balance < amount) return false;

  await prisma.eqTokenTransaction.create({
    data: {
      userId,
      amount,
      type: 'SPENT' as TokenTransactionType,
      source,
      description,
    },
  });
  return true;
}

/**
 * Get a user's current EQ Token balance (earned minus spent).
 */
export async function getTokenBalance(userId: string): Promise<number> {
  const earned = await prisma.eqTokenTransaction.aggregate({
    where: { userId, type: 'EARNED' as TokenTransactionType },
    _sum: { amount: true },
  });
  const spent = await prisma.eqTokenTransaction.aggregate({
    where: { userId, type: 'SPENT' as TokenTransactionType },
    _sum: { amount: true },
  });
  const expired = await prisma.eqTokenTransaction.aggregate({
    where: { userId, type: 'EXPIRED' as TokenTransactionType },
    _sum: { amount: true },
  });
  return (earned._sum.amount ?? 0) - (spent._sum.amount ?? 0) - (expired._sum.amount ?? 0);
}

/**
 * Get recent token transactions for a user.
 */
export async function getTokenHistory(userId: string, limit = 20) {
  return prisma.eqTokenTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Check if user is a Founders member with active status.
 */
export async function isFoundersMember(userId: string): Promise<boolean> {
  const membership = await prisma.foundersMembership.findUnique({
    where: { userId },
  });
  return membership?.status === 'ACTIVE';
}
