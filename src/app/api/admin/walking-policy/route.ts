import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — Admin bulk import walking policies
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { policies } = body;

    if (!Array.isArray(policies) || policies.length === 0) {
      return NextResponse.json(
        { error: "policies array is required" },
        { status: 400 }
      );
    }

    let imported = 0;
    let errors: string[] = [];

    for (const p of policies) {
      if (!p.courseId) {
        errors.push(`Missing courseId for entry`);
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO course_walking_policy
            (course_id, walking_allowed, walking_restrictions, cart_included,
             cart_fee, caddie_available, caddie_fee, caddie_required,
             pull_cart_allowed, push_cart_allowed, ada_accessible, ada_details,
             adaptive_golf_program, terrain_difficulty, estimated_walk_distance_miles, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (course_id) DO UPDATE SET
             walking_allowed = COALESCE(EXCLUDED.walking_allowed, course_walking_policy.walking_allowed),
             walking_restrictions = COALESCE(EXCLUDED.walking_restrictions, course_walking_policy.walking_restrictions),
             cart_included = COALESCE(EXCLUDED.cart_included, course_walking_policy.cart_included),
             cart_fee = COALESCE(EXCLUDED.cart_fee, course_walking_policy.cart_fee),
             caddie_available = COALESCE(EXCLUDED.caddie_available, course_walking_policy.caddie_available),
             caddie_fee = COALESCE(EXCLUDED.caddie_fee, course_walking_policy.caddie_fee),
             caddie_required = COALESCE(EXCLUDED.caddie_required, course_walking_policy.caddie_required),
             pull_cart_allowed = COALESCE(EXCLUDED.pull_cart_allowed, course_walking_policy.pull_cart_allowed),
             push_cart_allowed = COALESCE(EXCLUDED.push_cart_allowed, course_walking_policy.push_cart_allowed),
             ada_accessible = COALESCE(EXCLUDED.ada_accessible, course_walking_policy.ada_accessible),
             ada_details = COALESCE(EXCLUDED.ada_details, course_walking_policy.ada_details),
             adaptive_golf_program = COALESCE(EXCLUDED.adaptive_golf_program, course_walking_policy.adaptive_golf_program),
             terrain_difficulty = COALESCE(EXCLUDED.terrain_difficulty, course_walking_policy.terrain_difficulty),
             estimated_walk_distance_miles = COALESCE(EXCLUDED.estimated_walk_distance_miles, course_walking_policy.estimated_walk_distance_miles),
             source = COALESCE(EXCLUDED.source, course_walking_policy.source),
             updated_at = CURRENT_TIMESTAMP`,
          Number(p.courseId),
          p.walkingAllowed ?? null,
          p.walkingRestrictions ?? null,
          p.cartIncluded ?? null,
          p.cartFee ?? null,
          p.caddieAvailable ?? null,
          p.caddieFee ?? null,
          p.caddieRequired ?? null,
          p.pullCartAllowed ?? null,
          p.pushCartAllowed ?? null,
          p.adaAccessible ?? null,
          p.adaDetails ?? null,
          p.adaptiveGolfProgram ?? null,
          p.terrainDifficulty ?? null,
          p.estimatedWalkDistanceMiles ?? null,
          p.source ?? "admin_import"
        );
        imported++;
      } catch (err: any) {
        errors.push(`Course ${p.courseId}: ${err.message}`);
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (error) {
    console.error("POST /api/admin/walking-policy error:", error);
    return NextResponse.json(
      { error: "Failed to import walking policies" },
      { status: 500 }
    );
  }
}
