import prisma from "@/lib/prisma";

/** Tier hierarchy: free < pro < elite < founders */
const TIER_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  elite: 2,
  founders: 3,
};

/** Feature → minimum tier slug required */
export const FEATURE_GATES: Record<string, string> = {
  "course-fit": "pro",
  "ai-concierge-unlimited": "pro",
  "trip-ai-generation": "pro",
  "course-intelligence": "pro",
  "conditions-layer": "pro",
  "course-dna": "pro",
  "eq-wrapped": "pro",
  "walking-database": "pro",
  "creator-content": "pro",
  "comparisons-50": "pro",
  "betting-dfs": "elite",
  "satellite-analysis": "elite",
  "green-fee-alerts": "elite",
  "data-exports": "elite",
  "api-access": "elite",
  "unlimited-comparisons": "elite",
  "community-access": "founders",
  "private-events": "founders",
  "the-vault": "founders",
  "product-team-access": "founders",
};

/**
 * Get the active tier slug for a user. Returns "free" if no active membership.
 */
export async function getUserTier(userId: string): Promise<string> {
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: { in: ["active", "trial"] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: { tier: true },
    orderBy: { tier: { sortOrder: "desc" } },
  });
  return membership?.tier?.slug ?? "free";
}

/**
 * Check if a user has access to a specific feature based on their tier.
 */
export async function checkAccess(userId: string, feature: string): Promise<boolean> {
  const requiredTier = FEATURE_GATES[feature];
  if (!requiredTier) return true; // Unknown feature → not gated

  const userTier = await getUserTier(userId);
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

/**
 * Synchronous tier comparison — use when you already have the user's tier slug.
 */
export function hasAccess(userTierSlug: string, feature: string): boolean {
  const requiredTier = FEATURE_GATES[feature];
  if (!requiredTier) return true;
  return (TIER_RANK[userTierSlug] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

/**
 * Get the required tier label for a feature (for display purposes).
 */
export function getRequiredTierLabel(feature: string): string {
  const slug = FEATURE_GATES[feature];
  if (!slug) return "Free";
  const labels: Record<string, string> = {
    pro: "PRO",
    elite: "ELITE",
    founders: "FOUNDERS FLIGHT",
  };
  return labels[slug] ?? "PRO";
}
