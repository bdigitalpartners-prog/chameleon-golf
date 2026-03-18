/**
 * seed-nicklaus.ts
 * Ingests top Jack Nicklaus-designed golf courses into the golfEQ database.
 * 
 * Usage: npx tsx prisma/seed-nicklaus.ts
 * 
 * This script is idempotent — safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// ARCHITECT DATA
// =====================================================

const architects = [
  {
    name: 'Jack Nicklaus',
    slug: 'jack-nicklaus',
    bornYear: 1940,
    nationality: 'American',
    bio: 'Jack William Nicklaus, known as "The Golden Bear," is widely regarded as the greatest professional golfer of all time with a record 18 major championship victories and 73 PGA Tour wins. Born in Columbus, Ohio, Nicklaus turned his competitive genius toward golf course design in the late 1960s. His firm, Nicklaus Design, has created over 410 courses across 45 countries — more than 1% of all courses in the world. His designs are celebrated for their strategic depth, dramatic risk-reward decisions, and tournament-caliber challenge. Muirfield Village Golf Club in Dublin, Ohio, is considered his architectural masterpiece.',
    designPhilosophy: 'Nicklaus believes every hole should require thought and offer multiple strategic options. His courses reward precision and course management over raw power, featuring well-defended greens, strategic bunkering, and memorable risk-reward par 5s. He designs courses to be equally engaging for tour professionals and recreational golfers, with multiple tee positions that fundamentally change the challenge. His philosophy centers on "making a golfer think" — creating courses where the smartest route, not the longest drive, is rewarded.',
    era: 'Modern',
    totalCoursesDesigned: 410,
    firmName: 'Nicklaus Design',
    companyUrl: 'https://nicklausdesign.com',
    websiteUrl: 'https://nicklaus.com',
    signatureCourses: ['Muirfield Village Golf Club', 'Valhalla Golf Club', 'Harbour Town Golf Links', 'Sebonack Golf Club', 'Castle Pines Golf Club'],
    notableFeatures: ['Strategic risk-reward design', 'Tournament-caliber layouts', 'Multiple tee positions for all skill levels', 'Dramatic par 3s', 'Memorable finishing holes'],
  },
  {
    name: 'Pete Dye',
    slug: 'pete-dye',
    bornYear: 1925,
    diedYear: 2020,
    nationality: 'American',
    bio: 'Paul "Pete" Dye was one of the most influential golf course architects of the 20th century, known for his innovative and often intimidating designs. He collaborated with Jack Nicklaus on Harbour Town Golf Links, Nicklaus\'s first design credit.',
    designPhilosophy: 'Known for visual intimidation, railroad-tie bulkheads, island greens, and courses that appear harder than they play. Pioneered the "target golf" style.',
    era: 'Modern',
    totalCoursesDesigned: 100,
    firmName: 'Dye Designs',
    signatureCourses: ['TPC Sawgrass', 'Harbour Town Golf Links', 'Whistling Straits', 'Kiawah Island Ocean Course'],
    notableFeatures: ['Railroad-tie bulkheads', 'Island greens', 'Visual intimidation', 'Links-style design in America'],
  },
  {
    name: 'Tom Doak',
    slug: 'tom-doak',
    bornYear: 1961,
    nationality: 'American',
    bio: 'Tom Doak is one of the most respected minimalist golf course architects in the world. He co-designed Sebonack Golf Club with Jack Nicklaus, blending his naturalistic approach with Nicklaus\'s strategic vision.',
    designPhilosophy: 'Minimalist approach that works with the natural land. Believes the best courses look as if they were always there. Advocates for strategic design with multiple paths to the hole.',
    era: 'Modern',
    firmName: 'Renaissance Golf Design',
    signatureCourses: ['Pacific Dunes', 'Barnbougle Dunes', 'Sebonack Golf Club', 'Streamsong Blue'],
    notableFeatures: ['Minimalist earth-moving', 'Natural-looking bunkers', 'Width over length', 'Ground game options'],
  },
  {
    name: 'Desmond Muirhead',
    slug: 'desmond-muirhead',
    bornYear: 1923,
    diedYear: 2002,
    nationality: 'British-Canadian',
    bio: 'Desmond Muirhead was a visionary golf course architect and land planner who collaborated with Jack Nicklaus on Muirfield Village Golf Club, one of the most acclaimed courses in the world.',
    designPhilosophy: 'Combined artistic vision with strategic golf design. Known for conceptual and sometimes avant-garde course routing.',
    era: 'Modern',
    signatureCourses: ['Muirfield Village Golf Club', 'Mission Hills (World of Golf)'],
    notableFeatures: ['Artistic course routing', 'Integration of sculpture and landscape', 'Community-focused design'],
  },
  {
    name: 'Tony Jacklin',
    slug: 'tony-jacklin',
    bornYear: 1944,
    nationality: 'British',
    bio: 'Tony Jacklin CBE is a retired English professional golfer who won The Open Championship (1969) and the U.S. Open (1970). He co-designed The Concession Golf Club with Jack Nicklaus, named after Nicklaus\'s famous concession to Jacklin at the 1969 Ryder Cup.',
    era: 'Modern',
    signatureCourses: ['The Concession Golf Club'],
    notableFeatures: ['European tour legacy', 'Ryder Cup captain'],
  },
];

// =====================================================
// COURSE DATA - Top 75 Jack Nicklaus Courses
// =====================================================

interface CourseData {
  courseName: string;
  facilityName?: string;
  city: string;
  state: string;
  country: string;
  yearOpened?: number;
  accessType: string;
  par?: number;
  numHoles?: number;
  courseStyle?: string;
  courseType?: string;
  originalArchitect: string;
  coDesigner?: string;
  coDesignerRole?: string;
  designation?: string;
  description: string;
  greenFeeLow?: number;
  greenFeeHigh?: number;
  greenFeeCurrency?: string;
  championshipHistory?: any[];
  numListsAppeared?: number;
  websiteUrl?: string;
  onSiteLodging?: boolean;
  resortName?: string;
}

const topCourses: CourseData[] = [
  // === ELITE PRIVATE / MAJOR VENUES ===
  {
    courseName: "Muirfield Village Golf Club",
    city: "Dublin", state: "Ohio", country: "United States",
    yearOpened: 1974, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus / Desmond Muirhead",
    coDesigner: "Desmond Muirhead", coDesignerRole: "co-designer",
    designation: "Jack Nicklaus Signature",
    description: "Jack Nicklaus's masterpiece and legacy course, conceived with Desmond Muirhead on 220 acres of rolling Ohio terrain. Host to the Memorial Tournament since 1976, the 1987 Ryder Cup, 1998 Solheim Cup, and 2013 Presidents Cup. Considered the jewel of Nicklaus design — a beautiful, fair, and balanced test with compelling risk/reward par 5s and a terrific short par 4 at the 14th.",
    championshipHistory: [
      { event: "Memorial Tournament", years: "1976-present", type: "PGA Tour" },
      { event: "Ryder Cup", years: "1987", type: "Major Team Event" },
      { event: "Solheim Cup", years: "1998", type: "Major Team Event" },
      { event: "Presidents Cup", years: "2013", type: "Major Team Event" }
    ],
    numListsAppeared: 6,
    websiteUrl: "https://www.muirfieldvillage.com",
  },
  {
    courseName: "Sebonack Golf Club",
    city: "Southampton", state: "New York", country: "United States",
    yearOpened: 2006, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Links/Heathland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus / Tom Doak",
    coDesigner: "Tom Doak", coDesignerRole: "co-designer",
    designation: "Jack Nicklaus / Tom Doak Co-Design",
    description: "A dramatic collaboration between Jack Nicklaus and Tom Doak set across 300 acres in Southampton, near the legendary Shinnecock Hills and National Golf Links. Panoramic views of Great Peconic Bay and Cold Spring Pond frame rolling fairways, expansive bunkers, and undulating greens. Golf Digest's Best New Private Course of 2006 and host of the 2013 U.S. Women's Open.",
    championshipHistory: [
      { event: "U.S. Women's Open", years: "2013", type: "Major Championship" }
    ],
    numListsAppeared: 5,
  },
  {
    courseName: "Castle Pines Golf Club",
    city: "Castle Rock", state: "Colorado", country: "United States",
    yearOpened: 1981, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Set amid the foothills of the Rocky Mountains with 600 feet of elevation changes, dense woodlands, and panoramic mountain views. Crafted with meticulous attention to detail, Castle Pines seamlessly integrates with its stunning natural landscape. Home to The International tournament from 1986 to 2006.",
    championshipHistory: [
      { event: "The International", years: "1986-2006", type: "PGA Tour" }
    ],
    numListsAppeared: 5,
  },
  {
    courseName: "Valhalla Golf Club",
    city: "Louisville", state: "Kentucky", country: "United States",
    yearOpened: 1986, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Nicklaus declared this 486-acre site a 'golf designer's dream' when he began construction in 1984. A unique layout blending Scottish-links aesthetics with modern challenges, featuring an alternate fairway par 5, a par 4 with an island green, and the iconic horseshoe-shaped 18th green. One of the most prolific major championship venues in modern golf.",
    championshipHistory: [
      { event: "PGA Championship", years: "1996, 2000, 2014, 2024", type: "Major Championship" },
      { event: "Ryder Cup", years: "2008", type: "Major Team Event" },
      { event: "Senior PGA Championship", years: "2011", type: "Senior Major" }
    ],
    numListsAppeared: 5,
    websiteUrl: "https://www.valhalla.com",
  },
  {
    courseName: "Shoal Creek Golf and Country Club",
    city: "Birmingham", state: "Alabama", country: "United States",
    yearOpened: 1976, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "One of Nicklaus's earliest solo designs, opened in 1977 amid the Appalachian foothills of Alabama. A 7,197-yard par-72 layout with a storied major championship tradition. Host to two PGA Championships (1984 won by Lee Trevino, 1990), the U.S. Amateur, and the annual Regions Tradition on the Champions Tour.",
    championshipHistory: [
      { event: "PGA Championship", years: "1984, 1990", type: "Major Championship" },
      { event: "U.S. Amateur", years: "1986", type: "Amateur Major" },
      { event: "U.S. Junior Amateur", years: "2008", type: "Amateur" },
      { event: "Regions Tradition", years: "2011-present", type: "Champions Tour Major" }
    ],
    numListsAppeared: 4,
  },
  {
    courseName: "Whispering Pines Golf Club",
    city: "Trinity", state: "Texas", country: "United States",
    yearOpened: 2000, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Nicklaus Design",
    description: "A Nicklaus Design masterpiece set on 450 acres of pine and hardwood forest along the shores of Lake Livingston. Lead designer Chet Williams crafted a layout that showcases the natural beauty of East Texas, earning a spot on Golf Digest's America's 100 Greatest.",
    numListsAppeared: 3,
  },
  {
    courseName: "The Concession Golf Club",
    city: "Bradenton", state: "Florida", country: "United States",
    yearOpened: 2006, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus / Tony Jacklin",
    coDesigner: "Tony Jacklin", coDesignerRole: "co-designer",
    designation: "Jack Nicklaus Signature",
    description: "Named after Nicklaus's famous sportsmanship concession to Tony Jacklin at the 1969 Ryder Cup. This 520-acre layout weaves through wetlands, towering pines, and ancient oaks — ranked among Florida's toughest courses. Host of the 2021 WGC-Workday Championship.",
    championshipHistory: [
      { event: "WGC-Workday Championship", years: "2021", type: "WGC Event" }
    ],
    numListsAppeared: 4,
  },
  {
    courseName: "Mayacama Golf Club",
    city: "Santa Rosa", state: "California", country: "United States",
    yearOpened: 2001, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A walker-friendly gem tucked in the rolling foothills of Sonoma wine country. The 6,761-yard layout is entirely sand-capped for year-round playability, enhanced by century-old oaks that give the course a mature charm. Consistently ranked on Golf Digest's 100 Greatest.",
    numListsAppeared: 5,
  },
  {
    courseName: "Panther National Golf Club",
    city: "Palm Beach Gardens", state: "Florida", country: "United States",
    yearOpened: 2023, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "The newest elite Nicklaus design, nestled within a stunning wildlife preserve in South Florida. Developed by a Swiss businessman, Panther National melds luxury with natural beauty. Debuted at #5 on Golfweek's Best Residential Courses with a 7.70 rating — the highest-ranked Nicklaus residential layout in the country.",
    numListsAppeared: 2,
  },
  {
    courseName: "The Bear's Club",
    city: "Jupiter", state: "Florida", country: "United States",
    yearOpened: 2000, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Jack Nicklaus's personal home club in Jupiter, Florida — one of the most exclusive courses in the world. An ultra-private enclave where Nicklaus lives, plays, and continues to refine the course he considers his backyard masterpiece.",
    numListsAppeared: 2,
  },
  {
    courseName: "Desert Highlands",
    city: "Scottsdale", state: "Arizona", country: "United States",
    yearOpened: 1984, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Nestled in the captivating Sonoran Desert, Desert Highlands is hallowed ground where golf titans Palmer, Watson, Nicklaus, and Player competed in the original Skins Game. Earned top honors from Golf Digest for its strategic desert design.",
    numListsAppeared: 3,
  },
  {
    courseName: "Sycamore Hills Golf Club",
    city: "Fort Wayne", state: "Indiana", country: "United States",
    yearOpened: 1989, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Acclaimed as the Midwest's premier Nicklaus destination, Sycamore Hills features a magnificent layout and a picturesque clubhouse exuding distinctive character. A Golf Digest 100 Greatest mainstay.",
    numListsAppeared: 3,
  },
  {
    courseName: "Sherwood Country Club",
    city: "Thousand Oaks", state: "California", country: "United States",
    yearOpened: 1989, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "An iconic 7,025-yard masterpiece of natural harmony in the hills above Thousand Oaks. Crafted under Nicklaus's watchful eye to seamlessly integrate with its surroundings. Host of the PGA Tour's Zozo Championship.",
    championshipHistory: [
      { event: "Zozo Championship", years: "2020", type: "PGA Tour" }
    ],
    numListsAppeared: 2,
  },

  // === TOP RESORT / ACCESSIBLE COURSES ===
  {
    courseName: "Harbour Town Golf Links",
    city: "Hilton Head Island", state: "South Carolina", country: "United States",
    yearOpened: 1969, accessType: "Resort", par: 71, numHoles: 18,
    courseStyle: "Links/Lowcountry", courseType: "Championship",
    originalArchitect: "Jack Nicklaus / Pete Dye",
    coDesigner: "Pete Dye", coDesignerRole: "co-designer",
    designation: "Nicklaus / Dye Co-Design",
    description: "Jack Nicklaus's first-ever design credit, co-created with Pete Dye in 1969. A 7,101-yard par-71 test where the challenge lies not in length but in strategic precision amid live oaks and pines — a testament to classic Scottish courses. Ranked among ASGCA's top three American courses built after 1962 and Golf Magazine's top 30 globally. Home to the RBC Heritage since its debut.",
    greenFeeLow: 250, greenFeeHigh: 450,
    championshipHistory: [
      { event: "RBC Heritage (Heritage Classic)", years: "1969-present", type: "PGA Tour" }
    ],
    numListsAppeared: 7,
    websiteUrl: "https://www.seapines.com/golf/harbour-town-golf-links",
    onSiteLodging: true, resortName: "The Sea Pines Resort",
  },
  {
    courseName: "Punta Espada Golf Club",
    city: "Cap Cana", state: "Punta Cana", country: "Dominican Republic",
    yearOpened: 2006, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Oceanside", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Eight holes play along or over the turquoise Caribbean Sea, framed by white-sand waste areas and emerald fairways. Ranked the best course in the Caribbean and Mexico by Golfweek, and #1 Nicklaus course by GolfPass user ratings. One of three exclusive Nicklaus Signature layouts at the Cap Cana resort community.",
    greenFeeLow: 250, greenFeeHigh: 400,
    championshipHistory: [
      { event: "Champions Tour Cap Cana Championship", years: "2008-2010", type: "Champions Tour" }
    ],
    numListsAppeared: 5,
    onSiteLodging: true, resortName: "Cap Cana Resort",
  },
  {
    courseName: "Monte Rei Golf and Country Club",
    city: "Cacela", state: "Faro", country: "Portugal",
    yearOpened: 2007, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland/Mediterranean", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "The epitome of exclusivity with two Jack Nicklaus Signature courses sprawled across 1,000 acres in Portugal's Eastern Algarve. Nestled between the Serra do Caldeirão mountains and the Atlantic Ocean, with meticulously preserved natural landscapes and luxurious property options.",
    greenFeeLow: 150, greenFeeHigh: 280, greenFeeCurrency: "EUR",
    numListsAppeared: 2,
  },
  {
    courseName: "Quivira Golf Club",
    city: "Cabo San Lucas", state: "Baja California Sur", country: "Mexico",
    yearOpened: 2014, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Clifftop/Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Perched at Land's End on the Baja Peninsula, Quivira spans 1,850 acres of pristine beauty with dramatic cliff-edge holes, private beach clubs, and stunning Pacific Ocean views. One of the most visually spectacular Nicklaus designs in the world.",
    greenFeeLow: 300, greenFeeHigh: 500,
    numListsAppeared: 2,
    onSiteLodging: true, resortName: "Quivira Los Cabos",
  },
  {
    courseName: "Cabo del Sol Golf Club",
    facilityName: "Cabo del Sol (Ocean Course)",
    city: "Cabo San Lucas", state: "Baja California Sur", country: "Mexico",
    yearOpened: 1994, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Oceanside/Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Built on a site Nicklaus described as 'the best golf property I've ever seen.' Almost half the holes hug the coastline with craggy rock outcroppings, while giant cardon cacti guard the fairways. The 178-yard 17th tees off from a cliff over a beach to a green guarded by the Sea of Cortez.",
    greenFeeLow: 250, greenFeeHigh: 400,
    numListsAppeared: 3,
    onSiteLodging: true, resortName: "Cabo del Sol Resort",
  },
  {
    courseName: "Manele Golf Course",
    city: "Lanai City", state: "Hawaii", country: "United States",
    yearOpened: 1993, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Clifftop/Tropical", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Ocean views on all 18 holes with lush green fairways bordered by black lava. Three holes play alongside cliff edges, including the 202-yard 12th perched 150 feet above the Pacific. Your reward for the challenge is a stay at the luxurious Four Seasons Resort Lanai.",
    greenFeeLow: 375, greenFeeHigh: 450,
    numListsAppeared: 5,
    websiteUrl: "https://www.fourseasons.com/lanai/golf/",
    onSiteLodging: true, resortName: "Four Seasons Resort Lanai",
  },
  {
    courseName: "Hualalai Golf Club",
    city: "Kailua-Kona", state: "Hawaii", country: "United States",
    yearOpened: 1996, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Volcanic/Tropical", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Green fairways against dramatic black lava create more visual drama than a Tennessee Williams play. Strong par-three collection highlighted by the 167-yard 12th with a pot bunker mid-green and the 164-yard 17th overlooking the Pacific. Home to the Champions Tour season opener.",
    numListsAppeared: 4,
    websiteUrl: "https://www.fourseasons.com/hualalai/golf/",
    onSiteLodging: true, resortName: "Four Seasons Resort Hualalai",
  },
  {
    courseName: "Four Seasons Punta Mita Golf Club",
    facilityName: "Punta Mita (Pacifico Course)",
    city: "Punta Mita", state: "Nayarit", country: "Mexico",
    yearOpened: 1999, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Oceanside/Tropical", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Home to the world's only natural island green — the 194-yard 3B, where players walk to the putting surface during low tide and take an amphibious golf cart during high tide. Eight holes border the Pacific Ocean or Banderas Bay. Nicklaus returned to build a second course, Bahia.",
    greenFeeLow: 300, greenFeeHigh: 450,
    numListsAppeared: 3,
    onSiteLodging: true, resortName: "Four Seasons Resort Punta Mita",
  },
  {
    courseName: "PGA National Resort",
    facilityName: "PGA National Resort (Champion Course)",
    city: "Palm Beach Gardens", state: "Florida", country: "United States",
    yearOpened: 1990, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Redesign",
    description: "Originally designed by George and Tom Fazio, Nicklaus overhauled the Champion Course creating the infamous 'Bear Trap' — holes 15 through 17, a pair of par threes sandwiching a par four that bedevils Honda Classic competitors year after year. Site of the 1983 Ryder Cup and 1987 PGA Championship.",
    greenFeeLow: 250, greenFeeHigh: 400,
    championshipHistory: [
      { event: "Honda Classic", years: "2007-present", type: "PGA Tour" },
      { event: "Ryder Cup", years: "1983", type: "Major Team Event" },
      { event: "PGA Championship", years: "1987", type: "Major Championship" }
    ],
    numListsAppeared: 4,
    websiteUrl: "https://www.pgaresort.com",
    onSiteLodging: true, resortName: "PGA National Resort",
  },
  {
    courseName: "Great Waters at Reynolds Lake Oconee",
    facilityName: "Reynolds Lake Oconee (Great Waters)",
    city: "Greensboro", state: "Georgia", country: "United States",
    yearOpened: 1992, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Lakeside", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Set on the shores of Lake Oconee, Nicklaus routed the front nine through evergreen corridors while most back-nine holes front the lake with six greens set hard by the water. One of five courses at the Ritz-Carlton Reynolds resort.",
    greenFeeLow: 200, greenFeeHigh: 350,
    numListsAppeared: 5,
    websiteUrl: "https://www.reynoldslakeoconee.com",
    onSiteLodging: true, resortName: "The Ritz-Carlton Reynolds, Lake Oconee",
  },
  {
    courseName: "Vista Vallarta Golf Club",
    facilityName: "Vista Vallarta Golf Club (Nicklaus Course)",
    city: "Puerto Vallarta", state: "Jalisco", country: "Mexico",
    yearOpened: 2001, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Mountain/Tropical", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Located on rolling terrain at the highest point of the property, offering great views that meander over grassy hillsides, through thick forests of palms and ficus trees, and around creeks and arroyos. Risk-reward holes like the 381-yard 4th and the 536-yard 10th test your machismo.",
    greenFeeLow: 150, greenFeeHigh: 250,
    numListsAppeared: 3,
    onSiteLodging: true,
  },
  {
    courseName: "May River Golf Club",
    facilityName: "May River Golf Club at Palmetto Bluff",
    city: "Bluffton", state: "South Carolina", country: "United States",
    yearOpened: 2004, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Lowcountry", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A Lowcountry masterpiece at Montage Palmetto Bluff. Golf Digest named it among the Best Courses in Every State with a top spot in South Carolina. The 7,171-yard layout features pristine conditioning and natural coastal beauty.",
    numListsAppeared: 4,
    websiteUrl: "https://www.montage.com/palmettobluff/golf/",
    onSiteLodging: true, resortName: "Montage Palmetto Bluff",
  },
  {
    courseName: "Pronghorn Club",
    facilityName: "Pronghorn Club (Nicklaus Course)",
    city: "Bend", state: "Oregon", country: "United States",
    yearOpened: 2004, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Desert/Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "The first 'desert-style' course in the Pacific Northwest, spanning 7,460 yards with panoramic vistas of the Cascade Mountains, Smith Rock, and iconic buttes. Promises both challenge and delight across all skill levels.",
    greenFeeLow: 200, greenFeeHigh: 350,
    numListsAppeared: 4,
    onSiteLodging: true, resortName: "Juniper Preserve",
  },
  {
    courseName: "Grand Traverse Resort and Spa",
    facilityName: "Grand Traverse Resort (The Bear)",
    city: "Acme", state: "Michigan", country: "United States",
    yearOpened: 1984, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland/Forest", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Among Michigan's toughest layouts with dramatic elevation changes through northern Michigan forests. The Bear is the crown jewel of Grand Traverse's three-course resort offering.",
    greenFeeLow: 100, greenFeeHigh: 200,
    numListsAppeared: 3,
    websiteUrl: "https://www.grandtraverseresort.com",
    onSiteLodging: true, resortName: "Grand Traverse Resort",
  },
  {
    courseName: "Gleneagles Hotel",
    facilityName: "Gleneagles (PGA Centenary Course)",
    city: "Auchterarder", state: "Perthshire", country: "Scotland",
    yearOpened: 1993, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland/Moorland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Crafted by Nicklaus in the tranquil Perthshire countryside with handsome views of the Grampian Mountains. A spacious layout with roominess for galleries and challenge aplenty — designed specifically for Ryder Cup competition.",
    championshipHistory: [
      { event: "Ryder Cup", years: "2014", type: "Major Team Event" }
    ],
    numListsAppeared: 3,
    websiteUrl: "https://www.gleneagles.com",
    onSiteLodging: true, resortName: "Gleneagles Hotel",
  },

  // === TOP PUBLIC ACCESS COURSES ===
  {
    courseName: "The Bull at Pinehurst Farms",
    city: "Sheboygan Falls", state: "Wisconsin", country: "United States",
    yearOpened: 2003, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A premier public Nicklaus Signature course with a junior 'Kid Bull' short course. Part of the Wisconsin Golf Trail and consistently ranked among Golf Digest's 100 Greatest Public Courses.",
    greenFeeLow: 89, greenFeeHigh: 135,
    numListsAppeared: 4,
  },
  {
    courseName: "Pinehills Golf Club",
    facilityName: "Pinehills Golf Club (Nicklaus Course)",
    city: "Plymouth", state: "Massachusetts", country: "United States",
    yearOpened: 2002, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Two contrasting championship courses by Nicklaus and Rees Jones offer very different experiences. The Nicklaus course is ranked #4 in GolfPass's Golfers' Choice Top 50 and features Titleist range balls included with greens fees.",
    greenFeeLow: 130, greenFeeHigh: 150,
    numListsAppeared: 4,
  },
  {
    courseName: "Old Greenwood Golf Club",
    city: "Truckee", state: "California", country: "United States",
    yearOpened: 2004, accessType: "Semi-Private", par: 72, numHoles: 18,
    courseStyle: "Mountain/Forest", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A 5-acre practice facility, Keith Lyford Golf Academy, and stunning Lake Tahoe mountain setting. The 7,459-yard Nicklaus Signature course offers an alpine golf experience at the Tahoe Mountain Club.",
    greenFeeLow: 150, greenFeeHigh: 250,
    numListsAppeared: 2,
  },
  {
    courseName: "Old Works Golf Course",
    city: "Anaconda", state: "Montana", country: "United States",
    yearOpened: 1997, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "One of golf's most unique stories — built on a former Superfund copper smelting site, Nicklaus incorporated black slag sand in the bunkers as a signature feature. The 3-hole 'Little Bear' practice course and range balls included with greens fees make it one of the best values in Nicklaus golf.",
    greenFeeLow: 44, greenFeeHigh: 89,
    numListsAppeared: 3,
  },
  {
    courseName: "Coyote Springs Golf Club",
    city: "Coyote Springs", state: "Nevada", country: "United States",
    yearOpened: 2008, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A desert oasis Nicklaus Signature course managed by Troon Golf. Expansive practice facilities and a challenging 7,471-yard layout rising from the Nevada desert.",
    greenFeeLow: 60, greenFeeHigh: 150,
    numListsAppeared: 2,
  },
  {
    courseName: "Harbor Shores Golf Course",
    city: "Benton Harbor", state: "Michigan", country: "United States",
    yearOpened: 2010, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Links/Dunes", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A community revitalization project along the Lake Michigan shoreline that became a Senior PGA Championship venue. The 6,832-yard layout proves Nicklaus can create a championship test without excessive length.",
    greenFeeLow: 100, greenFeeHigh: 200,
    championshipHistory: [
      { event: "Senior PGA Championship", years: "2012, 2014, 2016, 2018", type: "Senior Major" }
    ],
    numListsAppeared: 3,
    onSiteLodging: true, resortName: "Harbor Shores Resort",
  },
  {
    courseName: "Old Corkscrew Golf Club",
    city: "Estero", state: "Florida", country: "United States",
    yearOpened: 2007, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A challenging 7,398-yard Nicklaus Signature layout winding through southwest Florida's natural terrain. One of the top-rated public Nicklaus courses in the Sunshine State.",
    greenFeeLow: 75, greenFeeHigh: 200,
    numListsAppeared: 2,
  },
  {
    courseName: "Bally's Golf Links at Ferry Point",
    city: "Bronx", state: "New York", country: "United States",
    yearOpened: 2015, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Links", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "A links-style course in New York City with views of Manhattan skyline and the Whitestone Bridge. Features the Michael Breed Golf Academy. One of the most dramatic public golf experiences in America — Golf Digest's 100 Greatest Public Courses.",
    greenFeeLow: 175, greenFeeHigh: 275,
    numListsAppeared: 3,
  },
  {
    courseName: "Achasta Golf Club",
    city: "Dahlonega", state: "Georgia", country: "United States",
    yearOpened: 2000, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "The #1 value Nicklaus course according to GolfPass, set in the foothills of the North Georgia mountains. At just $68-83 for a Nicklaus design, Achasta offers extraordinary quality for the price. Managed by Troon Golf.",
    greenFeeLow: 68, greenFeeHigh: 83,
    numListsAppeared: 3,
  },
  {
    courseName: "Grand Bear Golf Course",
    city: "Saucier", state: "Mississippi", country: "United States",
    yearOpened: 1999, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Forest", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Set within the De Soto National Forest, this 7,204-yard Nicklaus Signature course offers a peaceful escape with challenging golf. Connected to the Harrah's resort for convenient stay-and-play packages.",
    greenFeeLow: 85, greenFeeHigh: 105,
    numListsAppeared: 2,
    onSiteLodging: true, resortName: "Harrah's Gulf Coast",
  },
  {
    courseName: "Valley of the Eagles",
    city: "Elyria", state: "Ohio", country: "United States",
    yearOpened: 2018, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "One of Nicklaus's newest U.S. designs, featuring indoor simulators and a solid 7,200-yard test in northeast Ohio. A welcome addition to the public golf landscape.",
    greenFeeLow: 50, greenFeeHigh: 100,
    numListsAppeared: 1,
  },
  {
    courseName: "Breckenridge Golf Club",
    city: "Breckenridge", state: "Colorado", country: "United States",
    yearOpened: 1987, accessType: "Public", par: 72, numHoles: 27,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "The world's only municipally owned Jack Nicklaus golf course. 27 holes (Beaver/Bear/Elk) at 9,324 feet elevation in the heart of the Colorado Rockies. A bucket-list mountain golf experience.",
    greenFeeLow: 75, greenFeeHigh: 150,
    numListsAppeared: 2,
  },
  {
    courseName: "Potomac Shores Golf Club",
    city: "Potomac Shores", state: "Virginia", country: "United States",
    yearOpened: 2014, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Potomac River views and Troon Golf management make this a standout public Nicklaus Signature course in the DC metro area.",
    greenFeeLow: 75, greenFeeHigh: 150,
    numListsAppeared: 2,
  },
  {
    courseName: "Bear's Best Las Vegas",
    city: "Las Vegas", state: "Nevada", country: "United States",
    yearOpened: 2001, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "A unique concept — 18 replica holes chosen from Nicklaus's favorite designs worldwide, offering a 'greatest hits' tour of his architectural career in one round.",
    greenFeeLow: 75, greenFeeHigh: 175,
    numListsAppeared: 1,
  },
  {
    courseName: "The Reserve at Moonlight Basin",
    city: "Big Sky", state: "Montana", country: "United States",
    yearOpened: 2015, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "The highest USGA rating (78.5/153) of any Nicklaus course, set in the dramatic Big Sky mountain landscape. A truly bucket-list Nicklaus experience at 7,800 yards.",
    greenFeeLow: 150, greenFeeHigh: 275,
    numListsAppeared: 2,
    onSiteLodging: true,
  },
  {
    courseName: "American Dunes Golf Club",
    city: "Grand Haven", state: "Michigan", country: "United States",
    yearOpened: 2019, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Dunes/Links", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Formerly Grand Haven Golf Club, completely rebuilt by Nicklaus as a tribute to those who serve. All proceeds support the Folds of Honor Foundation for military families. A meaningful round of golf with outstanding design.",
    greenFeeLow: 100, greenFeeHigh: 200,
    numListsAppeared: 1,
  },
  {
    courseName: "Pawleys Plantation Golf and Country Club",
    city: "Pawleys Island", state: "South Carolina", country: "United States",
    yearOpened: 1988, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Lowcountry", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "A Hammock Coast Golf Trail gem nestled in the Lowcountry marshlands. The 7,026-yard layout showcases natural coastal Carolina beauty.",
    greenFeeLow: 75, greenFeeHigh: 150,
    numListsAppeared: 2,
  },
  {
    courseName: "The Idaho Club",
    city: "Sandpoint", state: "Idaho", country: "United States",
    yearOpened: 2008, accessType: "Semi-Private", par: 72, numHoles: 18,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A North Idaho mountain gem with range balls included in the greens fee. Set amid the natural beauty of the Idaho panhandle.",
    greenFeeLow: 100, greenFeeHigh: 200,
    numListsAppeared: 1,
  },
  {
    courseName: "Escena Golf Club",
    city: "Palm Springs", state: "California", country: "United States",
    yearOpened: 2005, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Desert", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A Coachella Valley desert setting with a challenging 7,171-yard Nicklaus Signature layout. Accessible public golf in one of golf's most popular destinations.",
    greenFeeLow: 75, greenFeeHigh: 150,
    numListsAppeared: 1,
  },
  {
    courseName: "Reunion Resort Golf Club",
    facilityName: "Reunion Resort (Nicklaus Course)",
    city: "Kissimmee", state: "Florida", country: "United States",
    yearOpened: 2007, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Three courses by Nicklaus, Watson, and Palmer at one Orlando-area resort. The Nicklaus course at 7,191 yards offers the most demanding test of the trio.",
    greenFeeLow: 100, greenFeeHigh: 200,
    numListsAppeared: 1,
    onSiteLodging: true, resortName: "Reunion Resort",
  },

  // === INTERNATIONAL HIGHLIGHTS ===
  {
    courseName: "Mount Juliet Golf Club",
    city: "Thomastown", state: "County Kilkenny", country: "Ireland",
    yearOpened: 1991, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A premier Irish resort course in pristine condition with a straightforward but rewarding design. Multiple-time host of the Irish Open.",
    greenFeeLow: 100, greenFeeHigh: 200, greenFeeCurrency: "EUR",
    championshipHistory: [
      { event: "Irish Open", years: "Multiple years", type: "European Tour" }
    ],
    numListsAppeared: 2,
    onSiteLodging: true, resortName: "Mount Juliet Estate",
  },
  {
    courseName: "Killeen Castle Golf Resort",
    city: "Dunshaughlin", state: "County Meath", country: "Ireland",
    yearOpened: 2008, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Every hole packs a challenge at this 7,500-yard Nicklaus Signature course in Ireland's historic midlands. Outstanding value for a world-class Nicklaus design. Host of the 2011 Solheim Cup.",
    greenFeeLow: 50, greenFeeHigh: 80, greenFeeCurrency: "EUR",
    championshipHistory: [
      { event: "Solheim Cup", years: "2011", type: "Major Team Event" }
    ],
    numListsAppeared: 3,
  },
  {
    courseName: "Jack Nicklaus Golf Club Korea",
    city: "Songdo", state: "Incheon", country: "South Korea",
    yearOpened: 2010, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "An 18-hole championship course extending over 7,400 yards, designed by Nicklaus Design and led by the Golden Bear himself. Adjacent to a Western-style community of 179 villas.",
    numListsAppeared: 2,
  },
  {
    courseName: "Jack Nicklaus Golf Club New Zealand",
    facilityName: "The Kinloch Club",
    city: "Kinloch", state: "Waikato", country: "New Zealand",
    yearOpened: 2007, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Volcanic/Links", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Set on the volcanic plateau near Lake Taupo, widely considered the finest golf course in New Zealand. A stunning combination of dramatic landscape and Nicklaus strategic design.",
    greenFeeLow: 150, greenFeeHigh: 300, greenFeeCurrency: "NZD",
    numListsAppeared: 1,
  },
  {
    courseName: "Glen Abbey Golf Course",
    city: "Oakville", state: "Ontario", country: "Canada",
    yearOpened: 1976, accessType: "Public", par: 72, numHoles: 18,
    courseStyle: "Parkland/Valley", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Perhaps the most famous golf course in Canada, carved through the Sixteen Mile Creek valley. Host of the Canadian Open approximately 30 times, featuring an iconic amphitheater finish. One of Nicklaus's earliest and most enduring designs.",
    greenFeeLow: 125, greenFeeHigh: 225, greenFeeCurrency: "CAD",
    championshipHistory: [
      { event: "Canadian Open", years: "~30 times (1977-2023)", type: "PGA Tour" }
    ],
    numListsAppeared: 2,
  },
  {
    courseName: "Riviera Cancun Golf and Resorts",
    city: "Cancun", state: "Quintana Roo", country: "Mexico",
    yearOpened: 2008, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Tropical/Jungle", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "The top-rated Yucatan course on GolfPass. A complete golf experience with exceptional layout, amenities, and service in the Riviera Maya.",
    greenFeeLow: 150, greenFeeHigh: 250,
    numListsAppeared: 2,
    onSiteLodging: true,
  },
  {
    courseName: "Puerto Los Cabos Golf Club",
    city: "San Jose del Cabo", state: "Baja California Sur", country: "Mexico",
    yearOpened: 2008, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Desert/Oceanside", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "Nicklaus designed 18 of the 27 holes at this Los Cabos gem that 'has everything' according to GolfPass reviews — stunning views, challenging design, and impeccable conditioning.",
    greenFeeLow: 200, greenFeeHigh: 350,
    numListsAppeared: 2,
    onSiteLodging: true,
  },
  {
    courseName: "Ocean Course at Hammock Beach Resort",
    city: "Palm Coast", state: "Florida", country: "United States",
    yearOpened: 2000, accessType: "Resort", par: 72, numHoles: 18,
    courseStyle: "Oceanside", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Atlantic Ocean holes and a resort setting on Florida's northeast coast. A Golf Digest 100 Greatest Public Course with a strong finishing stretch along the water.",
    greenFeeLow: 100, greenFeeHigh: 200,
    numListsAppeared: 4,
    websiteUrl: "https://www.hammockbeach.com",
    onSiteLodging: true, resortName: "Hammock Beach Resort",
  },

  // === ADDITIONAL NOTABLE PRIVATE ===
  {
    courseName: "Spring Creek Ranch Golf Club",
    city: "Collierville", state: "Tennessee", country: "United States",
    yearOpened: 1999, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Design",
    description: "A 330-acre Audubon Conservation Preserve member spanning woodlands, wetlands, and wildlife habitats. The 7,150-yard layout harmonizes with nature, featuring innovative soil plating for optimal drainage.",
    numListsAppeared: 2,
  },
  {
    courseName: "Colleton River Club",
    facilityName: "Colleton River Club (Nicklaus Course)",
    city: "Bluffton", state: "South Carolina", country: "United States",
    yearOpened: 1991, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Lowcountry", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A premier Lowcountry private club on the banks of the Colleton River with a Nicklaus Signature design in a beautiful residential community.",
    numListsAppeared: 2,
  },
  {
    courseName: "The Loxahatchee Club",
    city: "Jupiter", state: "Florida", country: "United States",
    yearOpened: 1984, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "An early Florida Nicklaus design near the Golden Bear's Jupiter home. One of the first elite private Nicklaus clubs in South Florida.",
    numListsAppeared: 2,
  },
  {
    courseName: "New Albany Country Club",
    city: "New Albany", state: "Ohio", country: "United States",
    yearOpened: 1992, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Parkland", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "A premier Columbus-area private club with impeccable conditioning. One of Nicklaus's most refined Ohio layouts outside of Muirfield Village.",
    numListsAppeared: 1,
  },
  {
    courseName: "Montreux Golf and Country Club",
    city: "Reno", state: "Nevada", country: "United States",
    yearOpened: 1997, accessType: "Private", par: 72, numHoles: 18,
    courseStyle: "Mountain", courseType: "Championship",
    originalArchitect: "Jack Nicklaus",
    designation: "Jack Nicklaus Signature",
    description: "Nestled in the Sierra Nevada mountains, this 7,472-yard layout has hosted the PGA Tour's Barracuda Championship. A dramatic mountain setting with elevation changes and long views.",
    championshipHistory: [
      { event: "Barracuda Championship", years: "1999-present", type: "PGA Tour" }
    ],
    numListsAppeared: 2,
  },
];

// =====================================================
// MAIN INGESTION FUNCTION
// =====================================================

async function main() {
  console.log('🐻 Starting Jack Nicklaus Course Ingestion...\n');

  // Step 1: Upsert Architects
  console.log('📐 Step 1: Upserting architects...');
  const architectMap: Record<string, number> = {};

  for (const arch of architects) {
    const result = await prisma.architect.upsert({
      where: { slug: arch.slug },
      update: {
        bio: arch.bio,
        designPhilosophy: arch.designPhilosophy || null,
        totalCoursesDesigned: arch.totalCoursesDesigned || null,
        firmName: arch.firmName || null,
        companyUrl: arch.companyUrl || null,
        websiteUrl: arch.websiteUrl || null,
        signatureCourses: arch.signatureCourses || [],
        notableFeatures: arch.notableFeatures || [],
        updatedAt: new Date(),
      },
      create: {
        name: arch.name,
        slug: arch.slug,
        bornYear: arch.bornYear || null,
        diedYear: (arch as any).diedYear || null,
        nationality: arch.nationality || null,
        bio: arch.bio || null,
        designPhilosophy: arch.designPhilosophy || null,
        era: arch.era || null,
        totalCoursesDesigned: arch.totalCoursesDesigned || null,
        firmName: arch.firmName || null,
        companyUrl: arch.companyUrl || null,
        websiteUrl: arch.websiteUrl || null,
        signatureCourses: arch.signatureCourses || [],
        notableFeatures: arch.notableFeatures || [],
      },
    });
    architectMap[arch.name] = result.id;
    console.log(`  ✅ ${arch.name} (ID: ${result.id})`);
  }

  // Step 2: Upsert Courses
  console.log('\n⛳ Step 2: Upserting courses...');
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const course of topCourses) {
    try {
      // Try to find existing course by name (case-insensitive partial match)
      const existing = await prisma.course.findFirst({
        where: {
          OR: [
            { courseName: { equals: course.courseName, mode: 'insensitive' } },
            ...(course.facilityName ? [{ courseName: { equals: course.facilityName, mode: 'insensitive' as const } }] : []),
            // Also try partial match
            { courseName: { contains: course.courseName.split(' ').slice(0, 2).join(' '), mode: 'insensitive' as const } },
          ],
        },
      });

      const courseData = {
        courseName: course.facilityName || course.courseName,
        facilityName: course.facilityName ? course.courseName : null,
        city: course.city,
        state: course.state,
        country: course.country,
        yearOpened: course.yearOpened || null,
        accessType: course.accessType,
        par: course.par || null,
        numHoles: course.numHoles || 18,
        courseStyle: course.courseStyle || null,
        courseType: course.courseType || null,
        originalArchitect: course.originalArchitect,
        description: course.description,
        greenFeeLow: course.greenFeeLow || null,
        greenFeeHigh: course.greenFeeHigh || null,
        greenFeeCurrency: course.greenFeeCurrency || 'USD',
        championshipHistory: course.championshipHistory || null,
        numListsAppeared: course.numListsAppeared || 0,
        websiteUrl: course.websiteUrl || null,
        onSiteLodging: course.onSiteLodging || null,
        resortName: course.resortName || null,
        isEnriched: true,
        architectId: architectMap['Jack Nicklaus'],
        updatedAt: new Date(),
      };

      let courseId: number;

      if (existing) {
        // Update existing course with enriched data
        const result = await prisma.course.update({
          where: { courseId: existing.courseId },
          data: {
            ...courseData,
            // Don't overwrite certain fields if they already have data
            courseName: existing.courseName, // Keep existing name
            latitude: existing.latitude, // Don't overwrite coordinates
            longitude: existing.longitude,
          },
        });
        courseId = result.courseId;
        updated++;
        console.log(`  📝 Updated: ${course.courseName} (ID: ${courseId})`);
      } else {
        // Create new course
        const result = await prisma.course.create({
          data: courseData,
        });
        courseId = result.courseId;
        created++;
        console.log(`  ✨ Created: ${course.courseName} (ID: ${courseId})`);
      }

      // Step 3: Link to architects via CourseArchitect junction
      // Always link Jack Nicklaus
      const nicklausId = architectMap['Jack Nicklaus'];
      const role = course.designation?.includes('Redesign') ? 'renovation' : 'original';

      await prisma.courseArchitect.upsert({
        where: {
          courseId_architectId_role: {
            courseId,
            architectId: nicklausId,
            role,
          },
        },
        update: { notes: course.designation || null },
        create: {
          courseId,
          architectId: nicklausId,
          role,
          year: course.yearOpened || null,
          notes: course.designation || null,
        },
      });

      // Link co-designer if applicable
      if (course.coDesigner && architectMap[course.coDesigner]) {
        await prisma.courseArchitect.upsert({
          where: {
            courseId_architectId_role: {
              courseId,
              architectId: architectMap[course.coDesigner],
              role: course.coDesignerRole || 'co-designer',
            },
          },
          update: {},
          create: {
            courseId,
            architectId: architectMap[course.coDesigner],
            role: course.coDesignerRole || 'co-designer',
            year: course.yearOpened || null,
          },
        });
      }

    } catch (err: any) {
      errors++;
      console.error(`  ❌ Error with ${course.courseName}: ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 INGESTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`  Architects upserted: ${architects.length}`);
  console.log(`  Courses created:     ${created}`);
  console.log(`  Courses updated:     ${updated}`);
  console.log(`  Errors:              ${errors}`);
  console.log(`  Total processed:     ${topCourses.length}`);
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  prisma.$disconnect();
  process.exit(1);
});
