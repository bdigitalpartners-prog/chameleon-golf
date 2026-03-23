/**
 * Seed Course DNA Fingerprint Data
 *
 * Usage:
 *   node scripts/seed-course-dna.js
 *
 * Requires DATABASE_URL environment variable (Postgres connection string).
 * Seeds 12-dimension DNA profiles for top golf courses.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Each dimension: 0-100 scale
// shot_variety, strategic_options, visual_drama, green_complexity,
// bunker_challenge, water_influence, elevation_change, wind_exposure,
// recovery_difficulty, length_challenge, walkability_score, conditioning_standard

const DNA_PROFILES = [
  {
    courseName: "Pine Valley Golf Club",
    shot_variety: 88, strategic_options: 82, visual_drama: 85, green_complexity: 78,
    bunker_challenge: 95, water_influence: 45, elevation_change: 55, wind_exposure: 40,
    recovery_difficulty: 95, length_challenge: 72, walkability_score: 45, conditioning_standard: 98,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.95,
  },
  {
    courseName: "Augusta National Golf Club",
    shot_variety: 90, strategic_options: 88, visual_drama: 95, green_complexity: 97,
    bunker_challenge: 72, water_influence: 60, elevation_change: 75, wind_exposure: 35,
    recovery_difficulty: 80, length_challenge: 78, walkability_score: 60, conditioning_standard: 100,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.98,
  },
  {
    courseName: "Pebble Beach Golf Links",
    shot_variety: 85, strategic_options: 78, visual_drama: 98, green_complexity: 70,
    bunker_challenge: 55, water_influence: 85, elevation_change: 65, wind_exposure: 88,
    recovery_difficulty: 72, length_challenge: 65, walkability_score: 55, conditioning_standard: 88,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.95,
  },
  {
    courseName: "St Andrews Links - Old Course",
    shot_variety: 82, strategic_options: 95, visual_drama: 80, green_complexity: 88,
    bunker_challenge: 85, water_influence: 20, elevation_change: 10, wind_exposure: 95,
    recovery_difficulty: 60, length_challenge: 70, walkability_score: 95, conditioning_standard: 82,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.95,
  },
  {
    courseName: "Cypress Point Club",
    shot_variety: 92, strategic_options: 85, visual_drama: 100, green_complexity: 72,
    bunker_challenge: 60, water_influence: 80, elevation_change: 50, wind_exposure: 85,
    recovery_difficulty: 70, length_challenge: 55, walkability_score: 70, conditioning_standard: 95,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.92,
  },
  {
    courseName: "Shinnecock Hills Golf Club",
    shot_variety: 80, strategic_options: 82, visual_drama: 72, green_complexity: 85,
    bunker_challenge: 70, water_influence: 25, elevation_change: 40, wind_exposure: 90,
    recovery_difficulty: 82, length_challenge: 78, walkability_score: 75, conditioning_standard: 92,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.90,
  },
  {
    courseName: "Oakmont Country Club",
    shot_variety: 75, strategic_options: 72, visual_drama: 55, green_complexity: 92,
    bunker_challenge: 95, water_influence: 15, elevation_change: 35, wind_exposure: 45,
    recovery_difficulty: 90, length_challenge: 85, walkability_score: 65, conditioning_standard: 95,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.92,
  },
  {
    courseName: "Merion Golf Club (East)",
    shot_variety: 88, strategic_options: 85, visual_drama: 65, green_complexity: 82,
    bunker_challenge: 75, water_influence: 30, elevation_change: 30, wind_exposure: 40,
    recovery_difficulty: 78, length_challenge: 50, walkability_score: 85, conditioning_standard: 95,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.88,
  },
  {
    courseName: "Winged Foot Golf Club (West)",
    shot_variety: 78, strategic_options: 72, visual_drama: 60, green_complexity: 88,
    bunker_challenge: 72, water_influence: 20, elevation_change: 45, wind_exposure: 35,
    recovery_difficulty: 88, length_challenge: 88, walkability_score: 60, conditioning_standard: 95,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.90,
  },
  {
    courseName: "TPC Sawgrass",
    shot_variety: 82, strategic_options: 80, visual_drama: 75, green_complexity: 72,
    bunker_challenge: 65, water_influence: 90, elevation_change: 10, wind_exposure: 50,
    recovery_difficulty: 82, length_challenge: 72, walkability_score: 70, conditioning_standard: 92,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.90,
  },
  {
    courseName: "Pinehurst Resort & Country Club (No. 2)",
    shot_variety: 85, strategic_options: 90, visual_drama: 65, green_complexity: 95,
    bunker_challenge: 78, water_influence: 10, elevation_change: 20, wind_exposure: 45,
    recovery_difficulty: 85, length_challenge: 75, walkability_score: 88, conditioning_standard: 90,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.93,
  },
  {
    courseName: "Royal County Down Golf Club",
    shot_variety: 88, strategic_options: 78, visual_drama: 95, green_complexity: 80,
    bunker_challenge: 82, water_influence: 25, elevation_change: 70, wind_exposure: 92,
    recovery_difficulty: 80, length_challenge: 78, walkability_score: 55, conditioning_standard: 85,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.88,
  },
  {
    courseName: "Royal Melbourne Golf Club (West)",
    shot_variety: 90, strategic_options: 92, visual_drama: 72, green_complexity: 85,
    bunker_challenge: 90, water_influence: 15, elevation_change: 30, wind_exposure: 60,
    recovery_difficulty: 75, length_challenge: 60, walkability_score: 80, conditioning_standard: 90,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.85,
  },
  {
    courseName: "Kiawah Island Golf Resort (Ocean Course)",
    shot_variety: 82, strategic_options: 75, visual_drama: 88, green_complexity: 68,
    bunker_challenge: 55, water_influence: 70, elevation_change: 10, wind_exposure: 95,
    recovery_difficulty: 78, length_challenge: 95, walkability_score: 45, conditioning_standard: 85,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.88,
  },
  {
    courseName: "Bethpage State Park - Black Course",
    shot_variety: 75, strategic_options: 68, visual_drama: 55, green_complexity: 72,
    bunker_challenge: 80, water_influence: 15, elevation_change: 60, wind_exposure: 40,
    recovery_difficulty: 85, length_challenge: 92, walkability_score: 35, conditioning_standard: 78,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.85,
  },
  {
    courseName: "Whistling Straits",
    shot_variety: 80, strategic_options: 75, visual_drama: 85, green_complexity: 72,
    bunker_challenge: 92, water_influence: 55, elevation_change: 45, wind_exposure: 88,
    recovery_difficulty: 78, length_challenge: 85, walkability_score: 40, conditioning_standard: 88,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.85,
  },
  {
    courseName: "Royal Portrush Golf Club",
    shot_variety: 85, strategic_options: 80, visual_drama: 92, green_complexity: 75,
    bunker_challenge: 72, water_influence: 30, elevation_change: 65, wind_exposure: 92,
    recovery_difficulty: 75, length_challenge: 80, walkability_score: 50, conditioning_standard: 88,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.88,
  },
  {
    courseName: "Torrey Pines Golf Course (South)",
    shot_variety: 72, strategic_options: 68, visual_drama: 82, green_complexity: 65,
    bunker_challenge: 55, water_influence: 20, elevation_change: 55, wind_exposure: 60,
    recovery_difficulty: 70, length_challenge: 85, walkability_score: 45, conditioning_standard: 80,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.82,
  },
  {
    courseName: "Bandon Dunes Golf Resort (Bandon Dunes)",
    shot_variety: 88, strategic_options: 82, visual_drama: 92, green_complexity: 78,
    bunker_challenge: 70, water_influence: 40, elevation_change: 45, wind_exposure: 95,
    recovery_difficulty: 72, length_challenge: 72, walkability_score: 80, conditioning_standard: 85,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.82,
  },
  {
    courseName: "Royal Troon Golf Club",
    shot_variety: 78, strategic_options: 80, visual_drama: 78, green_complexity: 72,
    bunker_challenge: 80, water_influence: 30, elevation_change: 15, wind_exposure: 92,
    recovery_difficulty: 72, length_challenge: 78, walkability_score: 82, conditioning_standard: 85,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.85,
  },
  {
    courseName: "Royal Liverpool Golf Club",
    shot_variety: 75, strategic_options: 78, visual_drama: 68, green_complexity: 72,
    bunker_challenge: 75, water_influence: 15, elevation_change: 10, wind_exposure: 88,
    recovery_difficulty: 68, length_challenge: 80, walkability_score: 90, conditioning_standard: 85,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.82,
  },
  {
    courseName: "Southern Hills Country Club",
    shot_variety: 78, strategic_options: 75, visual_drama: 60, green_complexity: 80,
    bunker_challenge: 72, water_influence: 25, elevation_change: 45, wind_exposure: 55,
    recovery_difficulty: 78, length_challenge: 82, walkability_score: 55, conditioning_standard: 90,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.82,
  },
  {
    courseName: "Valhalla Golf Club",
    shot_variety: 72, strategic_options: 68, visual_drama: 55, green_complexity: 68,
    bunker_challenge: 62, water_influence: 45, elevation_change: 40, wind_exposure: 35,
    recovery_difficulty: 65, length_challenge: 88, walkability_score: 50, conditioning_standard: 88,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.80,
  },
  {
    courseName: "Royal St George's Golf Club",
    shot_variety: 80, strategic_options: 78, visual_drama: 72, green_complexity: 70,
    bunker_challenge: 82, water_influence: 10, elevation_change: 40, wind_exposure: 90,
    recovery_difficulty: 72, length_challenge: 78, walkability_score: 70, conditioning_standard: 82,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.82,
  },
  {
    courseName: "The Olympic Club (Lake Course)",
    shot_variety: 72, strategic_options: 68, visual_drama: 65, green_complexity: 75,
    bunker_challenge: 60, water_influence: 15, elevation_change: 55, wind_exposure: 55,
    recovery_difficulty: 82, length_challenge: 78, walkability_score: 50, conditioning_standard: 88,
    data_sources: ["expert_rankings", "manual"], confidence_score: 0.80,
  },
];

async function seedDna() {
  console.log("🧬 Seeding Course DNA fingerprints...\n");

  const courses = await prisma.$queryRawUnsafe(
    `SELECT "courseId", "courseName" FROM courses`
  );
  const courseMap = new Map();
  for (const c of courses) {
    courseMap.set(c.courseName, c.courseId);
    courseMap.set(c.courseName.toLowerCase(), c.courseId);
  }

  let inserted = 0;
  let skipped = 0;

  for (const p of DNA_PROFILES) {
    let courseId = courseMap.get(p.courseName) || courseMap.get(p.courseName.toLowerCase());

    if (!courseId) {
      const partial = p.courseName.split(" ").slice(0, 2).join(" ").toLowerCase();
      for (const [name, id] of courseMap.entries()) {
        if (typeof name === "string" && name.toLowerCase().includes(partial)) {
          courseId = id;
          break;
        }
      }
    }

    if (!courseId) {
      console.log(`  ⚠️  Course not found: "${p.courseName}" — skipping`);
      skipped++;
      continue;
    }

    try {
      await prisma.$queryRawUnsafe(
        `INSERT INTO course_dna (
          course_id, shot_variety, strategic_options, visual_drama,
          green_complexity, bunker_challenge, water_influence, elevation_change,
          wind_exposure, recovery_difficulty, length_challenge, walkability_score,
          conditioning_standard, data_sources, confidence_score, last_calculated, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        ON CONFLICT (course_id) DO UPDATE SET
          shot_variety = EXCLUDED.shot_variety,
          strategic_options = EXCLUDED.strategic_options,
          visual_drama = EXCLUDED.visual_drama,
          green_complexity = EXCLUDED.green_complexity,
          bunker_challenge = EXCLUDED.bunker_challenge,
          water_influence = EXCLUDED.water_influence,
          elevation_change = EXCLUDED.elevation_change,
          wind_exposure = EXCLUDED.wind_exposure,
          recovery_difficulty = EXCLUDED.recovery_difficulty,
          length_challenge = EXCLUDED.length_challenge,
          walkability_score = EXCLUDED.walkability_score,
          conditioning_standard = EXCLUDED.conditioning_standard,
          data_sources = EXCLUDED.data_sources,
          confidence_score = EXCLUDED.confidence_score,
          last_calculated = NOW(),
          updated_at = NOW()`,
        courseId,
        p.shot_variety, p.strategic_options, p.visual_drama,
        p.green_complexity, p.bunker_challenge, p.water_influence, p.elevation_change,
        p.wind_exposure, p.recovery_difficulty, p.length_challenge, p.walkability_score,
        p.conditioning_standard,
        JSON.stringify(p.data_sources), p.confidence_score
      );
      inserted++;
      console.log(`  ✅ ${p.courseName} (ID: ${courseId})`);
    } catch (err) {
      console.error(`  ❌ Failed: ${p.courseName}:`, err.message);
      skipped++;
    }
  }

  console.log(`\n🏁 Done: ${inserted} inserted, ${skipped} skipped out of ${DNA_PROFILES.length} total.`);
  await prisma.$disconnect();
}

seedDna().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
