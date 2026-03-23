/**
 * Seed Trip Templates
 *
 * Usage: node scripts/seed-trip-templates.js
 *
 * Requires DATABASE_URL env var (PostgreSQL connection string).
 * Creates the trip_templates table and seeds 10 curated golf trip templates.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    slug: "bandon-dunes-dream",
    title: "Bandon Dunes Dream Trip",
    destination: "Bandon, Oregon",
    region: "Pacific Northwest",
    description:
      "Experience the remote, rugged beauty of Oregon's coast with four of America's finest links-style courses. Bandon Dunes is a bucket-list pilgrimage for serious golfers.",
    days: 4,
    estimated_cost_low: 1500,
    estimated_cost_high: 2500,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Bandon Dunes", day: 1, notes: "The original — pure links golf" },
      { name: "Pacific Dunes", day: 2, notes: "Tom Doak's masterpiece on the cliffs" },
      { name: "Old Macdonald", day: 3, notes: "Wide fairways, bold strategy" },
      { name: "Sheep Ranch", day: 4, notes: "Newest course, ocean on every hole" },
    ]),
    highlights: JSON.stringify([
      "4 world-class links courses",
      "Walking-only policy",
      "Remote coastal setting",
      "On-site lodging available",
    ]),
    style: "links",
  },
  {
    slug: "pinehurst-pilgrimage",
    title: "Pinehurst Golf Pilgrimage",
    destination: "Pinehurst, North Carolina",
    region: "Southeast",
    description:
      "Walk in the footsteps of champions at the Cradle of American Golf. Pinehurst Resort offers a complete golf vacation with nine courses, led by the legendary No. 2.",
    days: 5,
    estimated_cost_low: 1200,
    estimated_cost_high: 2800,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Pinehurst No. 2", day: 1, notes: "Donald Ross's crown jewel, site of US Opens" },
      { name: "Pinehurst No. 4", day: 2, notes: "Gil Hanse redesign, modern classic" },
      { name: "Pinehurst No. 8", day: 3, notes: "Tom Fazio design with elevation changes" },
      { name: "The Cradle", day: 4, notes: "Fun short course, great for an afternoon" },
      { name: "Tobacco Road", day: 5, notes: "Mike Strantz's wild masterpiece nearby" },
    ]),
    highlights: JSON.stringify([
      "Resort stay with multiple courses",
      "Walking encouraged on No. 2",
      "Historic championship venue",
      "Great dining and spa",
    ]),
    style: "parkland",
  },
  {
    slug: "scottish-links",
    title: "Scottish Links Pilgrimage",
    destination: "Scotland",
    region: "Scotland",
    description:
      "The ultimate golf pilgrimage to the birthplace of the game. Play the most historic and revered links courses in the world across Scotland's stunning coastline.",
    days: 7,
    estimated_cost_low: 3000,
    estimated_cost_high: 6000,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "St Andrews Old Course", day: 1, notes: "The Home of Golf" },
      { name: "Carnoustie Golf Links", day: 2, notes: "Championship Links, incredibly challenging" },
      { name: "Royal Dornoch Golf Club", day: 4, notes: "Tom Watson's favorite, worth the drive north" },
      { name: "Trump Turnberry (Ailsa Course)", day: 5, notes: "Iconic lighthouse backdrop" },
      { name: "Kingsbarns Golf Links", day: 6, notes: "Modern links perfection" },
      { name: "North Berwick Golf Club", day: 7, notes: "Charming, historic, the famous Redan hole" },
    ]),
    highlights: JSON.stringify([
      "Play the Home of Golf",
      "7 days of pure links golf",
      "Mix of historic and modern courses",
      "Scottish hospitality and whisky",
    ]),
    style: "links",
  },
  {
    slug: "monterey-peninsula",
    title: "Monterey Peninsula Experience",
    destination: "Monterey, California",
    region: "West Coast",
    description:
      "Play along one of the most beautiful stretches of coastline in the world. The Monterey Peninsula offers legendary courses with jaw-dropping Pacific Ocean views.",
    days: 3,
    estimated_cost_low: 2000,
    estimated_cost_high: 4000,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Pebble Beach Golf Links", day: 1, notes: "The crown jewel of public golf" },
      { name: "Spyglass Hill Golf Course", day: 2, notes: "Robert Trent Jones Sr. classic through pines and dunes" },
      { name: "Cypress Point Club", day: 3, notes: "Aspirational — ultra-private, guest access only" },
    ]),
    highlights: JSON.stringify([
      "Iconic 7th and 18th holes at Pebble",
      "Stunning Pacific coastline",
      "World-class dining in Carmel",
      "Luxury resort experience",
    ]),
    style: "links",
  },
  {
    slug: "myrtle-beach-buddies",
    title: "Myrtle Beach Buddies Trip",
    destination: "Myrtle Beach, South Carolina",
    region: "Southeast",
    description:
      "The ultimate golf buddies destination with 80+ courses, great nightlife, and unbeatable value. Myrtle Beach delivers top-tier golf without breaking the bank.",
    days: 4,
    estimated_cost_low: 600,
    estimated_cost_high: 1200,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Caledonia Golf & Fish Club", day: 1, notes: "Lowcountry beauty, tree-lined masterpiece" },
      { name: "True Blue Golf Club", day: 2, notes: "Bold Mike Strantz design" },
      { name: "Tidewater Golf Club", day: 3, notes: "Stunning Intracoastal Waterway views" },
      { name: "TPC Myrtle Beach", day: 4, notes: "Tour-quality conditioning" },
    ]),
    highlights: JSON.stringify([
      "Best value golf destination",
      "4 top-rated courses",
      "Great restaurants and nightlife",
      "Easy group logistics",
    ]),
    style: "parkland",
  },
  {
    slug: "arizona-desert-escape",
    title: "Arizona Desert Escape",
    destination: "Scottsdale, Arizona",
    region: "Southwest",
    description:
      "Experience dramatic desert golf in the Valley of the Sun. Cacti-lined fairways, mountain backdrops, and year-round sunshine make Scottsdale a premier winter golf destination.",
    days: 3,
    estimated_cost_low: 800,
    estimated_cost_high: 1800,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "TPC Scottsdale (Stadium Course)", day: 1, notes: "Home of the Waste Management Phoenix Open" },
      { name: "Troon North Golf Club (Monument)", day: 2, notes: "Tom Weiskopf's desert masterpiece" },
      { name: "We-Ko-Pa Golf Club (Saguaro)", day: 3, notes: "Coore & Crenshaw design in pristine desert" },
    ]),
    highlights: JSON.stringify([
      "Year-round sunshine",
      "Dramatic desert landscapes",
      "Great spa and dining scene",
      "Perfect winter escape",
    ]),
    style: "desert",
  },
  {
    slug: "kiawah-lowcountry",
    title: "Kiawah Island Lowcountry",
    destination: "Kiawah Island, South Carolina",
    region: "Southeast",
    description:
      "Play the legendary Ocean Course and explore the resort's five championship courses. Kiawah Island combines world-class golf with beach relaxation.",
    days: 4,
    estimated_cost_low: 1500,
    estimated_cost_high: 3000,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Kiawah Island (Ocean Course)", day: 1, notes: "2021 PGA Championship host, windswept and stunning" },
      { name: "Kiawah Island (Osprey Point)", day: 2, notes: "Tom Fazio design through marshes and lagoons" },
      { name: "Kiawah Island (Turtle Point)", day: 3, notes: "Jack Nicklaus design with ocean views" },
      { name: "Harbour Town Golf Links", day: 4, notes: "Day trip to Hilton Head's iconic Pete Dye classic" },
    ]),
    highlights: JSON.stringify([
      "Ocean Course — top 10 in the US",
      "Resort with beach access",
      "Multiple on-site courses",
      "Day trip to Harbour Town",
    ]),
    style: "links",
  },
  {
    slug: "northern-ireland-adventure",
    title: "Northern Ireland Golf Adventure",
    destination: "Northern Ireland",
    region: "Ireland",
    description:
      "Discover the extraordinary links golf of Northern Ireland, from the dramatic cliffs of Royal Portrush to the stunning beauty of Royal County Down.",
    days: 5,
    estimated_cost_low: 2000,
    estimated_cost_high: 4500,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Royal County Down Golf Club", day: 1, notes: "#1 in the world by many rankings" },
      { name: "Royal Portrush Golf Club (Dunluce)", day: 2, notes: "2019 Open Championship host" },
      { name: "Portstewart Golf Club (Strand)", day: 3, notes: "Spectacular opening nine along the dunes" },
      { name: "Castlerock Golf Club", day: 4, notes: "Hidden gem on the north coast" },
      { name: "Ardglass Golf Club", day: 5, notes: "Clifftop links with dramatic sea views" },
    ]),
    highlights: JSON.stringify([
      "Two of the world's top 10 courses",
      "Stunning coastal scenery",
      "Friendly local culture",
      "Giant's Causeway nearby",
    ]),
    style: "links",
  },
  {
    slug: "texas-hill-country",
    title: "Texas Hill Country Golf",
    destination: "Austin / San Antonio, Texas",
    region: "South Central",
    description:
      "Explore the rugged beauty of the Texas Hill Country with championship courses carved through limestone canyons and live oak forests.",
    days: 3,
    estimated_cost_low: 600,
    estimated_cost_high: 1400,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "Barton Creek (Fazio Foothills)", day: 1, notes: "Tom Fazio design through Hill Country terrain" },
      { name: "TPC San Antonio (Oaks Course)", day: 2, notes: "PGA Tour host, Greg Norman design" },
      { name: "Wolfdancer Golf Club", day: 3, notes: "Hyatt resort course with stunning canyon views" },
    ]),
    highlights: JSON.stringify([
      "Unique Hill Country terrain",
      "Great BBQ and live music",
      "Warm weather golf",
      "Value pricing vs. coastal destinations",
    ]),
    style: "parkland",
  },
  {
    slug: "palm-springs-retreat",
    title: "Palm Springs Desert Retreat",
    destination: "Palm Springs, California",
    region: "West Coast",
    description:
      "Relax and play in the Coachella Valley, home to over 100 golf courses. Mountain-framed fairways, mid-century modern style, and perfect winter weather.",
    days: 3,
    estimated_cost_low: 700,
    estimated_cost_high: 1600,
    image_url: null,
    courses_json: JSON.stringify([
      { name: "PGA West (Stadium Course)", day: 1, notes: "Pete Dye's fearsome desert design" },
      { name: "Indian Wells Golf Resort (Celebrity)", day: 2, notes: "Challenging and beautifully conditioned" },
      { name: "SilverRock Resort", day: 3, notes: "Arnold Palmer design at foot of the mountains" },
    ]),
    highlights: JSON.stringify([
      "100+ courses to choose from",
      "Perfect winter weather",
      "Mid-century modern vibe",
      "Great spa and dining",
    ]),
    style: "desert",
  },
];

async function main() {
  console.log("Creating trip_templates table...");

  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS trip_templates (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      region VARCHAR(100) NOT NULL,
      description TEXT,
      days INTEGER NOT NULL,
      estimated_cost_low INTEGER,
      estimated_cost_high INTEGER,
      image_url VARCHAR(500),
      courses_json TEXT NOT NULL DEFAULT '[]',
      highlights TEXT,
      style VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Seeding templates...");

  for (const t of TEMPLATES) {
    await prisma.$queryRawUnsafe(
      `
      INSERT INTO trip_templates (slug, title, destination, region, description, days, estimated_cost_low, estimated_cost_high, image_url, courses_json, highlights, style)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        destination = EXCLUDED.destination,
        region = EXCLUDED.region,
        description = EXCLUDED.description,
        days = EXCLUDED.days,
        estimated_cost_low = EXCLUDED.estimated_cost_low,
        estimated_cost_high = EXCLUDED.estimated_cost_high,
        courses_json = EXCLUDED.courses_json,
        highlights = EXCLUDED.highlights,
        style = EXCLUDED.style
      `,
      t.slug,
      t.title,
      t.destination,
      t.region,
      t.description,
      t.days,
      t.estimated_cost_low,
      t.estimated_cost_high,
      t.image_url,
      t.courses_json,
      t.highlights,
      t.style
    );
    console.log(`  ✓ ${t.title}`);
  }

  console.log(`\nDone! Seeded ${TEMPLATES.length} trip templates.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
