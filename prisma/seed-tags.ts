import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tags: { name: string; slug: string; category: string }[] = [
  // Skill level
  { name: "#ScratchGolfer", slug: "scratch-golfer", category: "skill" },
  { name: "#SingleDigit", slug: "single-digit", category: "skill" },
  { name: "#WeekendWarrior", slug: "weekend-warrior", category: "skill" },
  { name: "#BogeyFree", slug: "bogey-free", category: "skill" },
  { name: "#HighHandicapper", slug: "high-handicapper", category: "skill" },
  { name: "#MidHandicapper", slug: "mid-handicapper", category: "skill" },

  // Style
  { name: "#WalkOnly", slug: "walk-only", category: "style" },
  { name: "#RideOrDie", slug: "ride-or-die", category: "style" },
  { name: "#EarlyBird", slug: "early-bird", category: "style" },
  { name: "#TwilightGolfer", slug: "twilight-golfer", category: "style" },
  { name: "#PracticeRat", slug: "practice-rat", category: "style" },

  // Interests
  { name: "#CourseArchitect", slug: "course-architect", category: "interests" },
  { name: "#GolfTravel", slug: "golf-travel", category: "interests" },
  { name: "#GolfHistory", slug: "golf-history", category: "interests" },
  { name: "#Equipment", slug: "equipment", category: "interests" },
  { name: "#FitnessGolf", slug: "fitness-golf", category: "interests" },

  // Course types
  { name: "#LinksGolf", slug: "links-golf", category: "course_types" },
  { name: "#DesertGolf", slug: "desert-golf", category: "course_types" },
  { name: "#MountainGolf", slug: "mountain-golf", category: "course_types" },
  { name: "#PublicCourseWarrior", slug: "public-course-warrior", category: "course_types" },
  { name: "#TopHunter", slug: "top-hunter", category: "course_types" },
  { name: "#HiddenGems", slug: "hidden-gems", category: "course_types" },

  // Community
  { name: "#WomensGolf", slug: "womens-golf", category: "community" },
  { name: "#SeniorGolf", slug: "senior-golf", category: "community" },
  { name: "#JuniorGolf", slug: "junior-golf", category: "community" },
  { name: "#CollegeGolf", slug: "college-golf", category: "community" },
  { name: "#MilitaryGolf", slug: "military-golf", category: "community" },
];

async function main() {
  console.log("Seeding tags...");

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, category: tag.category },
      create: tag,
    });
  }

  console.log(`Seeded ${tags.length} tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
