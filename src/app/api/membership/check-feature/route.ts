import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess, FEATURE_GATES, getRequiredTierLabel } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const feature = req.nextUrl.searchParams.get("feature");
    if (!feature) {
      return NextResponse.json({ error: "feature param required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const required = FEATURE_GATES[feature];
      return NextResponse.json({
        hasAccess: !required,
        requiredTier: required ? getRequiredTierLabel(feature) : null,
      });
    }

    const userId = (session.user as any).id;
    const has = await checkAccess(userId, feature);

    return NextResponse.json({
      hasAccess: has,
      requiredTier: has ? null : getRequiredTierLabel(feature),
    });
  } catch (error) {
    console.error("Failed to check feature:", error);
    return NextResponse.json({ error: "Failed to check feature" }, { status: 500 });
  }
}
