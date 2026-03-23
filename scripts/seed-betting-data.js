/**
 * Seed betting & DFS course intelligence data.
 * Run with: node scripts/seed-betting-data.js
 *
 * Requires DATABASE_URL env var to be set.
 * Uses raw pg queries since Prisma schema may be out of sync.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ─── Course DFS Profiles (30+ PGA Tour venues) ─── */
const dfsProfiles = [
  {
    courseName: "Augusta National Golf Club",
    courseType: "all_around",
    keyStat: "Iron Play",
    historicalCutLine: "-1 to +3",
    typicalWinningScore: "-12 to -18",
    correlations: ["Riviera CC", "Muirfield Village", "East Lake"],
    notes: "Requires elite iron play and scrambling. Par-5 scoring is key — eagles separate contenders. Second shots into greens are the ultimate differentiator.",
  },
  {
    courseName: "TPC Sawgrass (Stadium Course)",
    courseType: "iron_test",
    keyStat: "GIR%",
    historicalCutLine: "-1 to +2",
    typicalWinningScore: "-12 to -16",
    correlations: ["Harbour Town Golf Links", "Innisbrook (Copperhead)", "Bay Hill Club & Lodge"],
    notes: "Accuracy off the tee is paramount. Water comes into play on 6+ holes. GIR% is the #1 predictor of success.",
  },
  {
    courseName: "Torrey Pines (South Course)",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "E to +4",
    typicalWinningScore: "-10 to -15",
    correlations: ["Bethpage Black", "Winged Foot", "Oakmont"],
    notes: "Long hitters thrive. Marine layer affects morning rounds. Poa annua greens add randomness in putting.",
  },
  {
    courseName: "Harbour Town Golf Links",
    courseType: "iron_test",
    keyStat: "Accuracy",
    historicalCutLine: "-3 to +1",
    typicalWinningScore: "-10 to -15",
    correlations: ["TPC Sawgrass", "Colonial CC", "Sedgefield CC"],
    notes: "Smallest greens on Tour. Driving accuracy and approach precision are everything. Bombers need not apply.",
  },
  {
    courseName: "TPC Scottsdale (Stadium Course)",
    courseType: "birdie_fest",
    keyStat: "Putting",
    historicalCutLine: "-5 to -1",
    typicalWinningScore: "-18 to -24",
    correlations: ["La Quinta (Stadium)", "Waialae CC", "Silverado"],
    notes: "Putting and birdie-or-better percentage dominate. Short course favors hot putters over bombers.",
  },
  {
    courseName: "Pebble Beach Golf Links",
    courseType: "all_around",
    keyStat: "Scrambling",
    historicalCutLine: "-2 to +3",
    typicalWinningScore: "-12 to -19",
    correlations: ["Augusta National", "St Andrews", "Royal Melbourne"],
    notes: "Wind and coastal conditions make scrambling essential. Small greens require precision. The back nine is one of golf's great tests.",
  },
  {
    courseName: "Riviera Country Club",
    courseType: "iron_test",
    keyStat: "Approach Proximity",
    historicalCutLine: "-2 to +2",
    typicalWinningScore: "-12 to -17",
    correlations: ["Augusta National", "Muirfield Village", "Olympia Fields"],
    notes: "Kikuyu rough penalizes misses. Approach shot quality separates the field. Historic venue with small, tricky greens.",
  },
  {
    courseName: "Bay Hill Club & Lodge",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "-1 to +3",
    typicalWinningScore: "-10 to -16",
    correlations: ["Torrey Pines South", "TPC Sawgrass", "Quail Hollow"],
    notes: "Water on many holes but length off the tee is rewarded. Arnold Palmer's venue demands power and precision.",
  },
  {
    courseName: "Muirfield Village Golf Club",
    courseType: "all_around",
    keyStat: "Ball Striking",
    historicalCutLine: "-2 to +2",
    typicalWinningScore: "-12 to -18",
    correlations: ["Augusta National", "Riviera CC", "East Lake"],
    notes: "Jack Nicklaus design that tests every part of the game. Course knowledge matters — repeat winners common.",
  },
  {
    courseName: "Colonial Country Club",
    courseType: "iron_test",
    keyStat: "Driving Accuracy",
    historicalCutLine: "-3 to +1",
    typicalWinningScore: "-12 to -17",
    correlations: ["Harbour Town", "Sedgefield CC", "TPC Craig Ranch"],
    notes: "Tight, tree-lined fairways put a premium on accuracy. Known as 'Hogan's Alley' for its demand of precision.",
  },
  {
    courseName: "Quail Hollow Club",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "-1 to +3",
    typicalWinningScore: "-12 to -18",
    correlations: ["Bay Hill", "TPC Boston", "Bethpage Black"],
    notes: "Length helps enormously, especially on the 'Green Mile' finishing stretch. Par-5 scoring is critical.",
  },
  {
    courseName: "East Lake Golf Club",
    courseType: "all_around",
    keyStat: "Ball Striking",
    historicalCutLine: "N/A (Tour Championship)",
    typicalWinningScore: "-12 to -21",
    correlations: ["Augusta National", "Muirfield Village", "Riviera CC"],
    notes: "Tour Championship venue. Bermuda greens, tight fairways. Complete game required for season finale.",
  },
  {
    courseName: "Bethpage Black",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-6 to -12",
    correlations: ["Torrey Pines South", "Oakmont", "Winged Foot"],
    notes: "One of the toughest courses on any Tour rotation. Length and endurance are key. Public course that plays like a US Open venue.",
  },
  {
    courseName: "Waialae Country Club",
    courseType: "birdie_fest",
    keyStat: "Putting",
    historicalCutLine: "-5 to -1",
    typicalWinningScore: "-18 to -25",
    correlations: ["TPC Scottsdale", "Silverado", "La Quinta"],
    notes: "Short, scorable course where putting makes the difference. Bermuda greens, trade winds factor in.",
  },
  {
    courseName: "Sedgefield Country Club",
    courseType: "iron_test",
    keyStat: "GIR%",
    historicalCutLine: "-4 to E",
    typicalWinningScore: "-15 to -21",
    correlations: ["Colonial CC", "Harbour Town", "TPC Sawgrass"],
    notes: "Donald Ross design with small, crowned greens. GIR and proximity are the top predictors.",
  },
  {
    courseName: "TPC Southwind",
    courseType: "scramble_course",
    keyStat: "Scrambling",
    historicalCutLine: "-2 to +2",
    typicalWinningScore: "-10 to -16",
    correlations: ["TPC Sawgrass", "Muirfield Village", "Firestone"],
    notes: "Bermuda rough and firm conditions make scrambling vital. Short game wizards thrive here.",
  },
  {
    courseName: "Oakmont Country Club",
    courseType: "iron_test",
    keyStat: "Iron Play",
    historicalCutLine: "+3 to +7",
    typicalWinningScore: "-4 to -10",
    correlations: ["Bethpage Black", "Winged Foot", "Shinnecock Hills"],
    notes: "200+ bunkers, lightning-fast greens, church pew bunkers. One of the hardest courses in championship golf.",
  },
  {
    courseName: "Winged Foot Golf Club (West)",
    courseType: "iron_test",
    keyStat: "GIR%",
    historicalCutLine: "+3 to +7",
    typicalWinningScore: "-4 to -8",
    correlations: ["Oakmont", "Bethpage Black", "Shinnecock Hills"],
    notes: "A.W. Tillinghast masterpiece. Missing greens means bogey or worse. Precision is everything.",
  },
  {
    courseName: "Shinnecock Hills Golf Club",
    courseType: "all_around",
    keyStat: "Wind Management",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-4 to -10",
    correlations: ["Pebble Beach", "Royal St George's", "Kiawah Island (Ocean)"],
    notes: "Links-influenced with wind as the primary defense. Requires creative shot-making and mental toughness.",
  },
  {
    courseName: "Southern Hills Country Club",
    courseType: "all_around",
    keyStat: "Ball Striking",
    historicalCutLine: "+1 to +5",
    typicalWinningScore: "-6 to -13",
    correlations: ["Muirfield Village", "East Lake", "Valhalla"],
    notes: "Perry Maxwell greens with subtle slopes. Oklahoma heat and wind add to the challenge. Complete game required.",
  },
  {
    courseName: "Valhalla Golf Club",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "-1 to +3",
    typicalWinningScore: "-10 to -18",
    correlations: ["Quail Hollow", "Bay Hill", "Bethpage Black"],
    notes: "Nicklaus design that rewards power. Par-5s are reachable for long hitters. Has hosted multiple PGA Championships.",
  },
  {
    courseName: "Kiawah Island (Ocean Course)",
    courseType: "all_around",
    keyStat: "Wind Management",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-6 to -12",
    correlations: ["Shinnecock Hills", "Pebble Beach", "Whistling Straits"],
    notes: "Pete Dye's coastal masterpiece. Wind completely changes the course. Ocean views and ocean wind on every hole.",
  },
  {
    courseName: "Whistling Straits (Straits Course)",
    courseType: "all_around",
    keyStat: "Wind Management",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-8 to -15",
    correlations: ["Kiawah Island", "Shinnecock Hills", "St Andrews"],
    notes: "1,000+ bunkers along Lake Michigan. Wind off the lake is the great equalizer. Hosted memorable PGA Championships.",
  },
  {
    courseName: "TPC Harding Park",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "E to +4",
    typicalWinningScore: "-8 to -14",
    correlations: ["Torrey Pines South", "Bethpage Black", "Olympic Club"],
    notes: "San Francisco's public gem. Cypress trees frame tight fairways but length is rewarded. Fog can roll in.",
  },
  {
    courseName: "Innisbrook Resort (Copperhead)",
    courseType: "iron_test",
    keyStat: "GIR%",
    historicalCutLine: "-2 to +2",
    typicalWinningScore: "-10 to -15",
    correlations: ["TPC Sawgrass", "Bay Hill", "Harbour Town"],
    notes: "Tight, tree-lined with water on several holes. The 'Snake Pit' finish (16-18) decides the tournament.",
  },
  {
    courseName: "Silverado Resort (North Course)",
    courseType: "birdie_fest",
    keyStat: "Putting",
    historicalCutLine: "-6 to -2",
    typicalWinningScore: "-20 to -26",
    correlations: ["Waialae CC", "TPC Scottsdale", "La Quinta"],
    notes: "Napa Valley setting, short and scorable. Hot putters win here. Fall event with mild conditions.",
  },
  {
    courseName: "Torrey Pines (North Course)",
    courseType: "birdie_fest",
    keyStat: "Scrambling",
    historicalCutLine: "-4 to E",
    typicalWinningScore: "-14 to -20",
    correlations: ["Waialae CC", "Silverado", "TPC Scottsdale"],
    notes: "Easier sibling to the South. More birdie opportunities. Played in combination with South during Farmers Insurance Open.",
  },
  {
    courseName: "The Country Club (Brookline)",
    courseType: "iron_test",
    keyStat: "Approach Proximity",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-4 to -10",
    correlations: ["Winged Foot", "Oakmont", "Merion"],
    notes: "Historic venue. Small greens demand precision. 2022 US Open showed accuracy matters more than power.",
  },
  {
    courseName: "Los Angeles Country Club (North)",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "+1 to +5",
    typicalWinningScore: "-8 to -14",
    correlations: ["Riviera CC", "Olympic Club", "TPC Harding Park"],
    notes: "2023 US Open debut. George Thomas design with strategic bunkering. Power + precision needed.",
  },
  {
    courseName: "Pinehurst No. 2",
    courseType: "scramble_course",
    keyStat: "Scrambling",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-6 to -12",
    correlations: ["TPC Southwind", "Kiawah Island", "Augusta National"],
    notes: "Donald Ross masterpiece with turtle-back greens. Missing greens leads to impossible short-game tests. The ultimate scrambling course.",
  },
  {
    courseName: "Medinah Country Club (No. 3)",
    courseType: "bomber_paradise",
    keyStat: "Driving Distance",
    historicalCutLine: "+1 to +5",
    typicalWinningScore: "-8 to -14",
    correlations: ["Valhalla", "Bethpage Black", "Quail Hollow"],
    notes: "Long, demanding course that hosted Ryder Cups and PGA Championships. Lake Kadijah defines the finish.",
  },
  {
    courseName: "Olympic Club (Lake Course)",
    courseType: "iron_test",
    keyStat: "Driving Accuracy",
    historicalCutLine: "+2 to +6",
    typicalWinningScore: "-2 to -8",
    correlations: ["Winged Foot", "Riviera CC", "The Country Club"],
    notes: "Tight, tree-lined with small greens. Famous for upsets in US Opens. Fog and cool temps affect play.",
  },
];

/* ─── Historical stats data per course (recent years) ─── */
const statTypes = [
  "scoring_avg",
  "fairways_hit_pct",
  "gir_pct",
  "driving_distance_avg",
  "scrambling_pct",
  "putts_per_round",
];

function generateStatsForCourse(courseType, year) {
  const base = {
    bomber_paradise: { scoring_avg: 70.8, fairways_hit_pct: 58, gir_pct: 65, driving_distance_avg: 305, scrambling_pct: 57, putts_per_round: 29.2 },
    iron_test: { scoring_avg: 71.2, fairways_hit_pct: 64, gir_pct: 63, driving_distance_avg: 290, scrambling_pct: 55, putts_per_round: 29.0 },
    scramble_course: { scoring_avg: 71.5, fairways_hit_pct: 60, gir_pct: 61, driving_distance_avg: 295, scrambling_pct: 62, putts_per_round: 28.8 },
    birdie_fest: { scoring_avg: 68.5, fairways_hit_pct: 66, gir_pct: 70, driving_distance_avg: 298, scrambling_pct: 60, putts_per_round: 28.5 },
    all_around: { scoring_avg: 71.0, fairways_hit_pct: 61, gir_pct: 64, driving_distance_avg: 298, scrambling_pct: 58, putts_per_round: 29.1 },
    putter_friendly: { scoring_avg: 69.5, fairways_hit_pct: 65, gir_pct: 68, driving_distance_avg: 296, scrambling_pct: 59, putts_per_round: 28.3 },
  };

  const b = base[courseType] || base.all_around;
  const jitter = () => (Math.random() - 0.5) * 2;

  return statTypes.map((st) => ({
    stat_type: st,
    stat_value: +(b[st] + jitter()).toFixed(1),
    year,
    rounds_played: Math.floor(200 + Math.random() * 200),
  }));
}

/* ─── Main seed ─── */
async function main() {
  console.log("Seeding betting & DFS data...");

  // Ensure tables exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "course_betting_data" (
      "id" SERIAL PRIMARY KEY,
      "course_id" INTEGER NOT NULL,
      "tournament_id" INTEGER,
      "stat_type" TEXT NOT NULL,
      "stat_value" DOUBLE PRECISION NOT NULL,
      "tour" TEXT,
      "year" INTEGER,
      "rounds_played" INTEGER,
      "source" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "course_dfs_profile" (
      "id" SERIAL PRIMARY KEY,
      "course_id" INTEGER NOT NULL UNIQUE,
      "course_type" TEXT,
      "key_stat" TEXT,
      "historical_cut_line" TEXT,
      "typical_winning_score" TEXT,
      "course_correlation" TEXT,
      "notes" TEXT,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const profile of dfsProfiles) {
    // Find course by name
    const courses = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Course" WHERE name ILIKE $1 LIMIT 1`,
      `%${profile.courseName}%`
    );

    if (!courses || courses.length === 0) {
      console.log(`  [SKIP] Course not found: ${profile.courseName}`);
      continue;
    }

    const courseId = courses[0].id;

    // Upsert DFS profile
    await prisma.$executeRawUnsafe(
      `INSERT INTO "course_dfs_profile" (course_id, course_type, key_stat, historical_cut_line, typical_winning_score, course_correlation, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (course_id) DO UPDATE SET
         course_type = EXCLUDED.course_type,
         key_stat = EXCLUDED.key_stat,
         historical_cut_line = EXCLUDED.historical_cut_line,
         typical_winning_score = EXCLUDED.typical_winning_score,
         course_correlation = EXCLUDED.course_correlation,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP`,
      courseId,
      profile.courseType,
      profile.keyStat,
      profile.historicalCutLine,
      profile.typicalWinningScore,
      JSON.stringify(profile.correlations),
      profile.notes
    );

    // Insert historical stats for recent years
    for (const year of [2022, 2023, 2024, 2025]) {
      const stats = generateStatsForCourse(profile.courseType, year);
      for (const stat of stats) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "course_betting_data" (course_id, stat_type, stat_value, tour, year, rounds_played, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          courseId,
          stat.stat_type,
          stat.stat_value,
          "PGA Tour",
          stat.year,
          stat.rounds_played,
          "seed_data"
        );
      }
    }

    console.log(`  [OK] ${profile.courseName} (ID: ${courseId})`);
  }

  console.log("Done seeding betting & DFS data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
