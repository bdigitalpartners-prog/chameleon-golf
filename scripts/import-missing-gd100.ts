/**
 * Script to import missing courses into the Golf Digest America's 100 Greatest Golf Courses list (listId: 6)
 * 
 * This script:
 * 1. Gets the current entries in list 6
 * 2. Compares against the full 100-course list from Golf Digest
 * 3. Finds matching courses in the database by name
 * 4. Creates ranking entries for the missing courses
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Complete Golf Digest America's 100 Greatest Golf Courses 2025-2026
const FULL_LIST = [
  { rank: 1, name: "Pine Valley Golf Club", city: "Pine Valley", state: "NJ" },
  { rank: 2, name: "Augusta National Golf Club", city: "Augusta", state: "GA" },
  { rank: 3, name: "Cypress Point Club", city: "Pebble Beach", state: "CA" },
  { rank: 4, name: "Shinnecock Hills Golf Club", city: "Southampton", state: "NY" },
  { rank: 5, name: "Oakmont Country Club", city: "Oakmont", state: "PA" },
  { rank: 6, name: "Merion Golf Club (East)", city: "Ardmore", state: "PA" },
  { rank: 7, name: "National Golf Links of America", city: "Southampton", state: "NY" },
  { rank: 8, name: "Sand Hills Golf Club", city: "Mullen", state: "NE" },
  { rank: 9, name: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA" },
  { rank: 10, name: "Fishers Island Club", city: "Fishers Island", state: "NY" },
  { rank: 11, name: "Chicago Golf Club", city: "Wheaton", state: "IL" },
  { rank: 12, name: "Seminole Golf Club", city: "Juno Beach", state: "FL" },
  { rank: 13, name: "Winged Foot Golf Club (West)", city: "Mamaroneck", state: "NY" },
  { rank: 14, name: "Friar's Head", city: "Riverhead", state: "NY" },
  { rank: 15, name: "Crystal Downs Country Club", city: "Frankfort", state: "MI" },
  { rank: 16, name: "Los Angeles Country Club (North)", city: "Los Angeles", state: "CA" },
  { rank: 17, name: "The Country Club (Clyde & Squirrel)", city: "Brookline", state: "MA" },
  { rank: 18, name: "Riviera Country Club", city: "Pacific Palisades", state: "CA" },
  { rank: 19, name: "Muirfield Village Golf Club", city: "Dublin", state: "OH" },
  { rank: 20, name: "Oakland Hills Country Club (South)", city: "Bloomfield Hills", state: "MI" },
  { rank: 21, name: "Oak Hill Country Club (East)", city: "Rochester", state: "NY" },
  { rank: 22, name: "Peachtree Golf Club", city: "Atlanta", state: "GA" },
  { rank: 23, name: "Pacific Dunes", city: "Bandon", state: "OR" },
  { rank: 24, name: "Shadow Creek Golf Course", city: "North Las Vegas", state: "NV" },
  { rank: 25, name: "Prairie Dunes Country Club", city: "Hutchinson", state: "KS" },
  { rank: 26, name: "Whistling Straits (Straits)", city: "Sheboygan", state: "WI" },
  { rank: 27, name: "Wade Hampton Golf Club", city: "Cashiers", state: "NC" },
  { rank: 28, name: "Southern Hills Country Club", city: "Tulsa", state: "OK" },
  { rank: 29, name: "The Honors Course", city: "Ooltewah", state: "TN" },
  { rank: 30, name: "Kiawah Island Golf Resort (Ocean Course)", city: "Kiawah Island", state: "SC" },
  { rank: 31, name: "Pikewood National Golf Club", city: "Morgantown", state: "WV" },
  { rank: 32, name: "Pinehurst No. 2", city: "Pinehurst", state: "NC" },
  { rank: 33, name: "San Francisco Golf Club", city: "San Francisco", state: "CA" },
  { rank: 34, name: "Ballyneal Golf Club", city: "Holyoke", state: "CO" },
  { rank: 35, name: "The Olympic Club (Lake)", city: "San Francisco", state: "CA" },
  { rank: 36, name: "Ohoopee Match Club", city: "Cobbtown", state: "GA" },
  { rank: 37, name: "The Alotian Club", city: "Roland", state: "AR" },
  { rank: 38, name: "Bethpage State Park (Black)", city: "Farmingdale", state: "NY" },
  { rank: 39, name: "Old Town Club", city: "Winston Salem", state: "NC" },
  { rank: 40, name: "Congaree Golf Club", city: "Ridgeland", state: "SC" },
  { rank: 41, name: "TPC Sawgrass (Stadium)", city: "Ponte Vedra Beach", state: "FL" },
  { rank: 42, name: "Baltusrol Golf Club (Lower)", city: "Springfield", state: "NJ" },
  { rank: 43, name: "Gozzer Ranch Golf and Lake Club", city: "Harrison", state: "ID" },
  { rank: 44, name: "Bandon Dunes", city: "Bandon", state: "OR" },
  { rank: 45, name: "Winged Foot Golf Club (East)", city: "Mamaroneck", state: "NY" },
  { rank: 46, name: "The Golf Club", city: "New Albany", state: "OH" },
  { rank: 47, name: "Shoreacres", city: "Lake Bluff", state: "IL" },
  { rank: 48, name: "Camargo Club", city: "Cincinnati", state: "OH" },
  { rank: 49, name: "Erin Hills Golf Course", city: "Hartford", state: "WI" },
  { rank: 50, name: "Castle Pines Golf Club", city: "Castle Rock", state: "CO" },
  { rank: 51, name: "Sebonack Golf Club", city: "Southampton", state: "NY" },
  { rank: 52, name: "Sleepy Hollow Country Club (Upper)", city: "Scarborough", state: "NY" },
  { rank: 53, name: "Maidstone Club", city: "East Hampton", state: "NY" },
  { rank: 54, name: "Myopia Hunt Club", city: "South Hamilton", state: "MA" },
  { rank: 55, name: "Monterey Peninsula Country Club (Shores)", city: "Pebble Beach", state: "CA" },
  { rank: 56, name: "Somerset Hills Country Club", city: "Bernardsville", state: "NJ" },
  { rank: 57, name: "California Golf Club", city: "South San Francisco", state: "CA" },
  { rank: 58, name: "Garden City Golf Club", city: "Garden City", state: "NY" },
  { rank: 59, name: "Nanea Golf Club", city: "Kailua Kona", state: "HI" },
  { rank: 60, name: "Victoria National Golf Club", city: "Newburgh", state: "IN" },
  { rank: 61, name: "Bandon Trails", city: "Bandon", state: "OR" },
  { rank: 62, name: "Inverness Club", city: "Toledo", state: "OH" },
  { rank: 63, name: "Cherry Hills Country Club", city: "Englewood", state: "CO" },
  { rank: 64, name: "Interlachen Country Club", city: "Edina", state: "MN" },
  { rank: 65, name: "Rock Creek Cattle Company", city: "Deer Lodge", state: "MT" },
  { rank: 66, name: "Whispering Pines Golf Club", city: "Trinity", state: "TX" },
  { rank: 67, name: "Congressional Country Club (Blue)", city: "Bethesda", state: "MD" },
  { rank: 68, name: "Calusa Pines Golf Club", city: "Naples", state: "FL" },
  { rank: 69, name: "The Lido Golf Club (Sand Valley)", city: "Nekoosa", state: "WI" },
  { rank: 70, name: "The Estancia Club", city: "Scottsdale", state: "AZ" },
  { rank: 71, name: "The Valley Club of Montecito", city: "Santa Barbara", state: "CA" },
  { rank: 72, name: "CapRock Ranch", city: "Valentine", state: "NE" },
  { rank: 73, name: "Old Sandwich Golf Club", city: "Plymouth", state: "MA" },
  { rank: 74, name: "Medinah Country Club (No. 3)", city: "Medinah", state: "IL" },
  { rank: 75, name: "Quaker Ridge Golf Club", city: "Scarsdale", state: "NY" },
  { rank: 76, name: "Spyglass Hill Golf Course", city: "Pebble Beach", state: "CA" },
  { rank: 77, name: "Monterey Peninsula Country Club (Dunes)", city: "Pebble Beach", state: "CA" },
  { rank: 78, name: "Essex County Club", city: "Manchester", state: "MA" },
  { rank: 79, name: "Kinloch Golf Club", city: "Manakin Sabot", state: "VA" },
  { rank: 80, name: "Oak Tree National", city: "Edmond", state: "OK" },
  { rank: 81, name: "Old Macdonald", city: "Bandon", state: "OR" },
  { rank: 82, name: "Scioto Country Club", city: "Columbus", state: "OH" },
  { rank: 83, name: "Ladera Golf Club", city: "Thermal", state: "CA" },
  { rank: 84, name: "Baltusrol Golf Club (Upper)", city: "Springfield", state: "NJ" },
  { rank: 85, name: "The Quarry at La Quinta", city: "La Quinta", state: "CA" },
  { rank: 86, name: "Canyata Golf Club", city: "Marshall", state: "IL" },
  { rank: 87, name: "Butler National Golf Club", city: "Oak Brook", state: "IL" },
  { rank: 88, name: "Hudson National Golf Club", city: "Croton On Hudson", state: "NY" },
  { rank: 89, name: "The Kittansett Club", city: "Marion", state: "MA" },
  { rank: 90, name: "Plainfield Country Club", city: "Edison", state: "NJ" },
  { rank: 91, name: "Boston Golf Club", city: "Hingham", state: "MA" },
  { rank: 92, name: "Pete Dye Golf Club", city: "Bridgeport", state: "WV" },
  { rank: 93, name: "Pasatiempo Golf Club", city: "Santa Cruz", state: "CA" },
  { rank: 94, name: "Valhalla Golf Club", city: "Louisville", state: "KY" },
  { rank: 95, name: "Diamond Creek", city: "Banner Elk", state: "NC" },
  { rank: 96, name: "Dallas National Golf Club", city: "Dallas", state: "TX" },
  { rank: 97, name: "Milwaukee Country Club", city: "River Hills", state: "WI" },
  { rank: 98, name: "Piping Rock Club", city: "Locust Valley", state: "NY" },
  { rank: 99, name: "Crooked Stick Golf Club", city: "Carmel", state: "IN" },
  { rank: 100, name: "Aronimink Golf Club", city: "Newtown Square", state: "PA" },
];

async function main() {
  const LIST_ID = 6;

  // 1. Get existing entries
  const existingEntries = await prisma.rankingEntry.findMany({
    where: { listId: LIST_ID },
    select: { rankPosition: true, courseId: true, course: { select: { courseName: true } } },
  });

  const existingRanks = new Set(existingEntries.map((e) => e.rankPosition));
  const existingCourseIds = new Set(existingEntries.map((e) => e.courseId));

  console.log(`\nExisting entries: ${existingEntries.length}`);
  console.log(`Existing rank positions: ${Array.from(existingRanks).sort((a, b) => (a ?? 0) - (b ?? 0)).join(", ")}`);

  // 2. Find missing rank positions
  const missingRanks = FULL_LIST.filter((c) => !existingRanks.has(c.rank));
  console.log(`\nMissing courses (${missingRanks.length}):`);

  let imported = 0;
  let notFound: typeof missingRanks = [];

  for (const missing of missingRanks) {
    // Try to find the course in the database by name (fuzzy match)
    const nameClean = missing.name
      .replace(/\s*\(.*?\)\s*/g, " ")
      .replace(/\s*:\s*/g, " ")
      .trim();

    // Try exact match first
    let course = await prisma.course.findFirst({
      where: {
        courseName: { equals: missing.name, mode: "insensitive" },
      },
      select: { courseId: true, courseName: true },
    });

    // Try partial match
    if (!course) {
      // Try the cleaned name
      course = await prisma.course.findFirst({
        where: {
          courseName: { contains: nameClean.split(" ").slice(0, 3).join(" "), mode: "insensitive" },
          state: { equals: missing.state, mode: "insensitive" },
        },
        select: { courseId: true, courseName: true },
      });
    }

    // Try even more aggressive matching
    if (!course) {
      // Extract the key part of the name (first 2-3 words)
      const keyWords = missing.name.split(/[\s(,:]+/).filter(Boolean).slice(0, 2).join(" ");
      course = await prisma.course.findFirst({
        where: {
          courseName: { contains: keyWords, mode: "insensitive" },
          state: { equals: missing.state, mode: "insensitive" },
        },
        select: { courseId: true, courseName: true },
      });
    }

    if (course) {
      // Check if this course is already in the list (maybe with a different rank)
      if (existingCourseIds.has(course.courseId)) {
        console.log(`  #${missing.rank} ${missing.name} → Already in list as ${course.courseName} (courseId: ${course.courseId}), skipping`);
        continue;
      }

      console.log(`  #${missing.rank} ${missing.name} → Found: ${course.courseName} (courseId: ${course.courseId})`);

      // Create the ranking entry
      await prisma.rankingEntry.create({
        data: {
          listId: LIST_ID,
          courseId: course.courseId,
          rankPosition: missing.rank,
          rankTied: false,
        },
      });
      imported++;
    } else {
      console.log(`  #${missing.rank} ${missing.name} → NOT FOUND in database`);
      notFound.push(missing);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Already in list: ${existingEntries.length}`);
  console.log(`Newly imported: ${imported}`);
  console.log(`Not found in DB: ${notFound.length}`);
  if (notFound.length > 0) {
    console.log(`\nCourses not found (need to be added to courses table first):`);
    notFound.forEach((c) => console.log(`  #${c.rank} ${c.name} — ${c.city}, ${c.state}`));
  }

  // Verify final count
  const finalCount = await prisma.rankingEntry.count({ where: { listId: LIST_ID } });
  console.log(`\nFinal entry count for list ${LIST_ID}: ${finalCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
