/**
 * Seed script for Green Fee Intelligence data
 * Run with: node scripts/seed-green-fees.js
 *
 * Requires DATABASE_URL environment variable or .env file
 * Uses fetch to hit the admin API endpoint
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "golfEQ-admin-2026-secure";

// Realistic sample course data with green fee history
const SAMPLE_COURSES = [
  // California
  { id: 1, name: "Pebble Beach Golf Links", state: "CA", fees: { standard: 595, peak: 625, twilight: 295, offPeak: 575 }, trend: "rising", yoy: 5.2 },
  { id: 2, name: "Torrey Pines South", state: "CA", fees: { standard: 202, peak: 232, twilight: 102, offPeak: 172 }, trend: "stable", yoy: 1.5 },
  { id: 3, name: "Pasatiempo Golf Club", state: "CA", fees: { standard: 295, peak: 315, twilight: 150, offPeak: 265 }, trend: "rising", yoy: 4.0 },
  { id: 4, name: "Spanish Bay", state: "CA", fees: { standard: 310, peak: 340, twilight: 155, offPeak: 280 }, trend: "stable", yoy: 2.0 },
  { id: 5, name: "Spyglass Hill", state: "CA", fees: { standard: 425, peak: 445, twilight: 210, offPeak: 395 }, trend: "rising", yoy: 3.5 },

  // Florida
  { id: 6, name: "TPC Sawgrass Stadium", state: "FL", fees: { standard: 575, peak: 600, twilight: 288, offPeak: 375 }, trend: "rising", yoy: 6.0 },
  { id: 7, name: "Streamsong Red", state: "FL", fees: { standard: 265, peak: 295, twilight: 135, offPeak: 195 }, trend: "stable", yoy: 2.5 },
  { id: 8, name: "Streamsong Blue", state: "FL", fees: { standard: 265, peak: 295, twilight: 135, offPeak: 195 }, trend: "stable", yoy: 2.5 },
  { id: 9, name: "Streamsong Black", state: "FL", fees: { standard: 285, peak: 315, twilight: 145, offPeak: 215 }, trend: "rising", yoy: 3.0 },
  { id: 10, name: "World Golf Village King & Bear", state: "FL", fees: { standard: 159, peak: 189, twilight: 79, offPeak: 119 }, trend: "declining", yoy: -2.0 },

  // Oregon
  { id: 11, name: "Bandon Dunes", state: "OR", fees: { standard: 395, peak: 425, twilight: 198, offPeak: 295 }, trend: "rising", yoy: 4.5 },
  { id: 12, name: "Pacific Dunes", state: "OR", fees: { standard: 395, peak: 425, twilight: 198, offPeak: 295 }, trend: "rising", yoy: 4.5 },
  { id: 13, name: "Old Macdonald", state: "OR", fees: { standard: 395, peak: 425, twilight: 198, offPeak: 295 }, trend: "rising", yoy: 4.5 },
  { id: 14, name: "Sheep Ranch", state: "OR", fees: { standard: 395, peak: 425, twilight: 198, offPeak: 295 }, trend: "rising", yoy: 5.0 },

  // North Carolina
  { id: 15, name: "Pinehurst No. 2", state: "NC", fees: { standard: 495, peak: 595, twilight: 248, offPeak: 395 }, trend: "rising", yoy: 7.0 },
  { id: 16, name: "Pinehurst No. 4", state: "NC", fees: { standard: 345, peak: 395, twilight: 175, offPeak: 275 }, trend: "stable", yoy: 2.0 },
  { id: 17, name: "Tobacco Road", state: "NC", fees: { standard: 135, peak: 155, twilight: 68, offPeak: 95 }, trend: "stable", yoy: 1.0 },

  // South Carolina
  { id: 18, name: "Kiawah Ocean Course", state: "SC", fees: { standard: 443, peak: 479, twilight: 222, offPeak: 339 }, trend: "rising", yoy: 5.5 },
  { id: 19, name: "Harbour Town", state: "SC", fees: { standard: 362, peak: 399, twilight: 181, offPeak: 289 }, trend: "rising", yoy: 4.0 },

  // Arizona
  { id: 20, name: "TPC Scottsdale Stadium", state: "AZ", fees: { standard: 285, peak: 385, twilight: 143, offPeak: 165 }, trend: "stable", yoy: 1.5 },
  { id: 21, name: "Troon North Monument", state: "AZ", fees: { standard: 275, peak: 375, twilight: 138, offPeak: 155 }, trend: "declining", yoy: -1.0 },
  { id: 22, name: "We-Ko-Pa Saguaro", state: "AZ", fees: { standard: 215, peak: 295, twilight: 108, offPeak: 135 }, trend: "stable", yoy: 0.5 },

  // Texas
  { id: 23, name: "Whispering Pines", state: "TX", fees: { standard: 285, peak: 310, twilight: 143, offPeak: 225 }, trend: "stable", yoy: 2.0 },

  // Michigan
  { id: 24, name: "Arcadia Bluffs", state: "MI", fees: { standard: 225, peak: 275, twilight: 113, offPeak: 165 }, trend: "rising", yoy: 3.0 },
  { id: 25, name: "Forest Dunes", state: "MI", fees: { standard: 200, peak: 250, twilight: 100, offPeak: 150 }, trend: "rising", yoy: 4.0 },

  // New York
  { id: 26, name: "Bethpage Black", state: "NY", fees: { standard: 150, peak: 150, twilight: 75, offPeak: 100 }, trend: "stable", yoy: 0.0 },
  { id: 27, name: "Montauk Downs", state: "NY", fees: { standard: 52, peak: 67, twilight: 32, offPeak: 42 }, trend: "stable", yoy: 1.0 },

  // New Jersey
  { id: 28, name: "Pine Valley Golf Club", state: "NJ", fees: { standard: 0, peak: 0, twilight: 0, offPeak: 0 }, trend: "stable", yoy: 0.0 },

  // Hawaii
  { id: 29, name: "Mauna Kea", state: "HI", fees: { standard: 325, peak: 365, twilight: 165, offPeak: 275 }, trend: "rising", yoy: 3.5 },
  { id: 30, name: "Kapalua Plantation", state: "HI", fees: { standard: 369, peak: 399, twilight: 185, offPeak: 319 }, trend: "rising", yoy: 4.0 },

  // Wisconsin
  { id: 31, name: "Whistling Straits Straits", state: "WI", fees: { standard: 430, peak: 480, twilight: 215, offPeak: 330 }, trend: "rising", yoy: 6.0 },
  { id: 32, name: "Erin Hills", state: "WI", fees: { standard: 295, peak: 345, twilight: 148, offPeak: 225 }, trend: "stable", yoy: 2.0 },
  { id: 33, name: "Sand Valley", state: "WI", fees: { standard: 280, peak: 320, twilight: 140, offPeak: 210 }, trend: "rising", yoy: 5.0 },

  // Virginia
  { id: 34, name: "Cascades at The Homestead", state: "VA", fees: { standard: 195, peak: 235, twilight: 98, offPeak: 155 }, trend: "stable", yoy: 1.5 },

  // Colorado
  { id: 35, name: "The Broadmoor East", state: "CO", fees: { standard: 250, peak: 300, twilight: 125, offPeak: 195 }, trend: "stable", yoy: 2.0 },

  // Washington
  { id: 36, name: "Chambers Bay", state: "WA", fees: { standard: 250, peak: 299, twilight: 125, offPeak: 189 }, trend: "rising", yoy: 3.5 },

  // Nevada
  { id: 37, name: "Shadow Creek", state: "NV", fees: { standard: 600, peak: 600, twilight: 300, offPeak: 500 }, trend: "stable", yoy: 0.0 },

  // Pennsylvania
  { id: 38, name: "Oakmont Country Club", state: "PA", fees: { standard: 0, peak: 0, twilight: 0, offPeak: 0 }, trend: "stable", yoy: 0.0 },

  // Georgia
  { id: 39, name: "Reynolds Oconee", state: "GA", fees: { standard: 225, peak: 265, twilight: 113, offPeak: 175 }, trend: "stable", yoy: 2.5 },

  // Oklahoma
  { id: 40, name: "Southern Hills CC", state: "OK", fees: { standard: 0, peak: 0, twilight: 0, offPeak: 0 }, trend: "stable", yoy: 0.0 },

  // Nebraska
  { id: 41, name: "Sand Hills Golf Club", state: "NE", fees: { standard: 350, peak: 375, twilight: 175, offPeak: 300 }, trend: "rising", yoy: 4.0 },

  // Indiana
  { id: 42, name: "French Lick Dye Course", state: "IN", fees: { standard: 175, peak: 225, twilight: 88, offPeak: 125 }, trend: "stable", yoy: 1.0 },

  // Idaho
  { id: 43, name: "Circling Raven", state: "ID", fees: { standard: 135, peak: 175, twilight: 68, offPeak: 95 }, trend: "stable", yoy: 2.0 },

  // Montana
  { id: 44, name: "Old Works", state: "MT", fees: { standard: 68, peak: 89, twilight: 45, offPeak: 55 }, trend: "stable", yoy: 1.5 },

  // Maine
  { id: 45, name: "Sugarloaf Golf Club", state: "ME", fees: { standard: 115, peak: 145, twilight: 58, offPeak: 85 }, trend: "stable", yoy: 2.0 },

  // Massachusetts
  { id: 46, name: "Cape Cod National", state: "MA", fees: { standard: 115, peak: 135, twilight: 58, offPeak: 85 }, trend: "stable", yoy: 1.5 },

  // Connecticut
  { id: 47, name: "Lake of Isles North", state: "CT", fees: { standard: 175, peak: 215, twilight: 88, offPeak: 135 }, trend: "stable", yoy: 2.0 },

  // Minnesota
  { id: 48, name: "Giants Ridge Legend", state: "MN", fees: { standard: 89, peak: 109, twilight: 55, offPeak: 69 }, trend: "stable", yoy: 1.0 },

  // Alabama
  { id: 49, name: "RTJ Capitol Hill Senator", state: "AL", fees: { standard: 69, peak: 79, twilight: 45, offPeak: 55 }, trend: "stable", yoy: 0.5 },
  { id: 50, name: "RTJ Capitol Hill Judge", state: "AL", fees: { standard: 69, peak: 79, twilight: 45, offPeak: 55 }, trend: "stable", yoy: 0.5 },
];

function generateFeeHistory(course) {
  const fees = [];
  const seasons = ["peak", "shoulder", "off_season"];
  const feeTypes = [
    { type: "standard_18", amount: course.fees.standard },
    { type: "weekend_18", amount: Math.round(course.fees.peak * 1.05) },
    { type: "twilight", amount: course.fees.twilight },
  ];

  // Generate 2 years of quarterly data
  for (let year = 2024; year <= 2026; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      if (year === 2026 && quarter > 1) break;
      const month = (quarter - 1) * 3 + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-01`;
      const season = quarter === 2 || quarter === 3 ? "peak" : quarter === 1 || quarter === 4 ? "shoulder" : "off_season";

      for (const ft of feeTypes) {
        if (ft.amount === 0) continue; // Skip private clubs

        // Add some variation
        const yearFactor = 1 + (course.yoy / 100) * (year - 2024);
        const seasonFactor = season === "peak" ? 1.1 : season === "off_season" ? 0.85 : 1.0;
        const noise = 0.95 + Math.random() * 0.1;

        fees.push({
          course_id: course.id,
          fee_type: ft.type,
          amount: Math.round(ft.amount * yearFactor * seasonFactor * noise),
          currency: "USD",
          season,
          effective_date: date,
          source: "seed_data",
        });
      }
    }
  }

  return fees;
}

async function seed() {
  console.log("Seeding green fee data for", SAMPLE_COURSES.length, "courses...");

  const allFees = [];
  for (const course of SAMPLE_COURSES) {
    if (course.fees.standard === 0) continue; // Skip private clubs
    const fees = generateFeeHistory(course);
    allFees.push(...fees);
  }

  console.log(`Generated ${allFees.length} fee records`);

  // Send in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < allFees.length; i += BATCH_SIZE) {
    const batch = allFees.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/green-fees/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ fees: batch }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, err);
      } else {
        const data = await res.json();
        console.log(`Batch ${i / BATCH_SIZE + 1}: imported ${data.imported} fees, recalculated ${data.recalculated} indexes`);
      }
    } catch (err) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, err.message);
    }
  }

  console.log("Done seeding green fee data!");
}

seed().catch(console.error);
