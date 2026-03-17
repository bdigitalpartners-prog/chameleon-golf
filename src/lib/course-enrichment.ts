/**
 * Course Data Enrichment Utilities
 *
 * Extracts structured data from course descriptions and location metadata.
 * No external API calls — purely rule-based extraction and generation.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface CourseData {
  courseId: number;
  courseName: string;
  description?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  par?: number | null;
  yearOpened?: number | null;
  originalArchitect?: string | null;
  courseType?: string | null;
  accessType?: string | null;
  courseStyle?: string | null;
  greenFeeLow?: number | null;
  greenFeeHigh?: number | null;
  walkingPolicy?: string | null;
  dressCode?: string | null;
  caddieAvailability?: string | null;
  practiceFacilities?: any;
  bestTimeToPlay?: string | null;
  bestMonths?: any;
  averageRoundTime?: string | null;
  golfSeason?: string | null;
  numHoles?: number | null;
  fairwayGrass?: string | null;
  greenGrass?: string | null;
}

export interface EnrichmentResult {
  courseId: number;
  fields: Record<string, any>;
  extractedFrom: string[];
}

// ─── Par Extraction ──────────────────────────────────────────────────

const PAR_PATTERNS = [
  /\bpar[\s-](\d{2})\b/i,
  /\b(\d{2})[\s-]par\b/i,
  /\bpar\s+of\s+(\d{2})\b/i,
  /\bplays\s+to\s+(?:a\s+)?par[\s-]?(\d{2})\b/i,
  /\b(\d{2})-par\b/i,
];

export function extractPar(description: string): number | null {
  for (const pat of PAR_PATTERNS) {
    const m = description.match(pat);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val >= 27 && val <= 73) return val;
    }
  }
  return null;
}

// ─── Yardage Extraction ──────────────────────────────────────────────

const YARDAGE_PATTERNS = [
  /(\d[,.]?\d{3})\s*yards/i,
  /(?:plays?|measures?|stretches?|tips?\s+at)\s+(\d[,.]?\d{3})/i,
  /(\d[,.]?\d{3})\s*from\s+the\s+(?:back|tips|championship)/i,
];

export function extractYardage(description: string): number | null {
  for (const pat of YARDAGE_PATTERNS) {
    const m = description.match(pat);
    if (m) {
      const val = parseInt(m[1].replace(/[,.]/, ""), 10);
      if (val >= 1000 && val <= 8500) return val;
    }
  }
  return null;
}

// ─── Year Opened Extraction ──────────────────────────────────────────

const YEAR_PATTERNS = [
  /(?:opened|built|established|founded|designed|constructed|created)\s+in\s+(\d{4})/i,
  /\b(?:since|circa)\s+(\d{4})\b/i,
  /\bopened\s+(\d{4})\b/i,
  /\bdating\s+(?:back\s+)?to\s+(\d{4})\b/i,
  /\b(\d{4})\s+(?:design|layout|opening)\b/i,
];

export function extractYearOpened(description: string): number | null {
  for (const pat of YEAR_PATTERNS) {
    const m = description.match(pat);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val >= 1800 && val <= 2026) return val;
    }
  }
  return null;
}

// ─── Architect Extraction ────────────────────────────────────────────

const FAMOUS_ARCHITECTS = [
  "Alister MacKenzie",
  "A.W. Tillinghast",
  "Ben Crenshaw",
  "Bill Coore",
  "Bobby Jones",
  "C.B. Macdonald",
  "Charles Blair Macdonald",
  "Coore & Crenshaw",
  "Coore and Crenshaw",
  "Donald Ross",
  "Dye Design",
  "Fazio",
  "Gil Hanse",
  "Jack Nicklaus",
  "Nicklaus Design",
  "Jones Jr",
  "Mike Strantz",
  "Old Tom Morris",
  "Pete Dye",
  "Rees Jones",
  "Robert Trent Jones",
  "Robert Trent Jones Jr",
  "Robert Trent Jones Sr",
  "Seth Raynor",
  "Tom Doak",
  "Tom Fazio",
  "Tom Watson",
  "Tom Weiskopf",
  "Arnold Palmer",
  "Palmer Design",
  "Arthur Hills",
  "Gary Player",
  "Greg Norman",
  "Jack Neville",
  "George Thomas",
  "William Flynn",
  "Hugh Wilson",
  "Perry Maxwell",
  "George Crump",
  "Henry Fownes",
  "Willie Park Jr",
  "Harry Colt",
];

const ARCHITECT_PATTERNS = [
  /(?:designed|created|built|crafted|laid out|routed)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/,
  /(?:architect|designer)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/i,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:designed|design|creation|layout|masterpiece)/,
];

export function extractArchitect(description: string): string | null {
  // Check for known architects first
  for (const architect of FAMOUS_ARCHITECTS) {
    if (description.includes(architect)) return architect;
    // Also check lowercase variations
    if (description.toLowerCase().includes(architect.toLowerCase())) return architect;
  }

  // Try patterns
  for (const pat of ARCHITECT_PATTERNS) {
    const m = description.match(pat);
    if (m) {
      const name = m[1].trim();
      // Validate: names should be 2-5 words, no common false positives
      const words = name.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        const stopWords = ["the", "this", "that", "with", "from", "course", "golf", "club", "hole"];
        if (!stopWords.includes(words[0].toLowerCase())) return name;
      }
    }
  }

  return null;
}

// ─── Course Style Extraction ─────────────────────────────────────────

const STYLE_KEYWORDS: Record<string, string[]> = {
  Links: ["links", "links-style", "linksland", "seaside links"],
  Parkland: ["parkland", "park-land", "tree-lined", "tree lined"],
  Desert: ["desert", "desert-style", "desert layout", "sonoran"],
  Mountain: ["mountain", "mountain-style", "mountainside", "alpine"],
  Heathland: ["heathland", "heath", "moorland"],
  Coastal: ["coastal", "oceanside", "ocean views", "seaside", "cliffside", "clifftop"],
  "Links-Parkland": ["links-parkland", "mix of links and parkland"],
  Tropical: ["tropical", "island", "caribbean"],
  Prairie: ["prairie", "plains"],
  Woodland: ["woodland", "forest", "wooded"],
};

export function extractCourseStyle(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return style;
    }
  }
  return null;
}

// ─── Access Type Classification ──────────────────────────────────────

const ACCESS_KEYWORDS: Record<string, string[]> = {
  Private: [
    "private club",
    "members only",
    "member-only",
    "private membership",
    "exclusively for members",
    "invitation only",
    "private course",
    "highly exclusive",
  ],
  Public: [
    "public course",
    "open to the public",
    "municipal",
    "city-owned",
    "county course",
    "public access",
    "daily fee",
    "daily-fee",
    "everyone is welcome",
  ],
  Resort: [
    "resort course",
    "resort guests",
    "hotel guests",
    "resort community",
    "destination golf",
    "stay and play",
    "resort-style",
  ],
  "Semi-Private": [
    "semi-private",
    "semi private",
    "limited public access",
    "members and public",
    "public welcome",
  ],
  Municipal: [
    "municipal",
    "city-owned",
    "county-owned",
    "publicly owned",
    "city course",
  ],
};

export function classifyAccessType(description: string, greenFeeLow?: number | null): string | null {
  const lower = description.toLowerCase();
  for (const [access, keywords] of Object.entries(ACCESS_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return access;
    }
  }

  // Fee-based heuristics as fallback
  if (greenFeeLow != null) {
    if (greenFeeLow < 30) return "Public";
    if (greenFeeLow > 500) return "Private";
  }

  return null;
}

// ─── Course Type Classification ──────────────────────────────────────

const COURSE_TYPE_KEYWORDS: Record<string, string[]> = {
  Championship: [
    "championship",
    "championship caliber",
    "championship course",
    "championship layout",
    "tournament",
    "pga tour",
    "us open",
  ],
  Executive: ["executive", "executive course", "par-3", "pitch and putt"],
  Regulation: ["regulation", "standard", "18-hole regulation"],
  "Resort Course": ["resort course", "resort layout"],
  "9-Hole": ["9-hole", "nine-hole", "nine hole"],
};

export function classifyCourseType(
  description: string,
  par?: number | null,
  numHoles?: number | null
): string | null {
  const lower = description.toLowerCase();
  for (const [type, keywords] of Object.entries(COURSE_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type;
    }
  }

  // Heuristics
  if (numHoles === 9) return "9-Hole";
  if (par && par <= 62) return "Executive";
  if (par && par >= 70 && par <= 73) return "Championship";

  return null;
}

// ─── Walking Policy Inference ────────────────────────────────────────

const WALKING_KEYWORDS: Record<string, string[]> = {
  "Walking Only": [
    "walking only",
    "walking course",
    "no carts",
    "caddies required",
    "must walk",
    "walkers only",
  ],
  "Walking Allowed": [
    "walking allowed",
    "walking permitted",
    "walkers welcome",
    "walk or ride",
    "walking encouraged",
  ],
  "Walking at Certain Times": [
    "walking at certain times",
    "restricted walking",
    "walking before",
    "walking after",
    "walking limited",
  ],
  "Cart Required": [
    "cart required",
    "mandatory cart",
    "carts required",
    "cart mandatory",
    "must ride",
  ],
  Unrestricted: [
    "unrestricted walking",
    "unrestricted",
  ],
};

export function inferWalkingPolicy(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [policy, keywords] of Object.entries(WALKING_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return policy;
    }
  }
  return null;
}

// ─── Dress Code Inference ────────────────────────────────────────────

export function inferDressCode(
  description: string,
  accessType?: string | null
): string | null {
  const lower = description.toLowerCase();

  if (lower.includes("no denim") || lower.includes("collared shirt required"))
    return "Collared shirt required, no denim";
  if (lower.includes("collared shirt") || lower.includes("proper golf attire"))
    return "Proper golf attire required";
  if (lower.includes("dress code") && lower.includes("strict"))
    return "Strict dress code — collared shirts, no denim or athletic wear";
  if (lower.includes("casual") || lower.includes("relaxed dress"))
    return "Casual — neat and clean attire";

  // Infer from access type
  if (accessType === "Private") return "Proper golf attire required";
  if (accessType === "Resort") return "Resort casual — collared shirts recommended";
  if (accessType === "Municipal" || accessType === "Public") return "Casual — neat and clean attire";

  return null;
}

// ─── Practice Facilities Inference ───────────────────────────────────

export function inferPracticeFacilities(description: string): Record<string, boolean> | null {
  const lower = description.toLowerCase();
  const facilities: Record<string, boolean> = {};
  let found = false;

  if (lower.includes("driving range") || lower.includes("practice range") || lower.includes("range")) {
    facilities.drivingRange = true;
    found = true;
  }
  if (lower.includes("putting green") || lower.includes("practice green")) {
    facilities.puttingGreen = true;
    found = true;
  }
  if (
    lower.includes("short game") ||
    lower.includes("chipping") ||
    lower.includes("pitching area")
  ) {
    facilities.shortGameArea = true;
    found = true;
  }
  if (lower.includes("bunker practice") || lower.includes("practice bunker")) {
    facilities.practiceBunker = true;
    found = true;
  }
  if (lower.includes("teaching") || lower.includes("lesson") || lower.includes("instruction") || lower.includes("academy")) {
    facilities.teachingCenter = true;
    found = true;
  }

  return found ? facilities : null;
}

// ─── Grass Type Extraction ───────────────────────────────────────────

const GRASS_TYPES: Record<string, string[]> = {
  Bentgrass: ["bentgrass", "bent grass", "creeping bent"],
  Bermuda: ["bermuda", "bermudagrass"],
  Zoysia: ["zoysia", "zoysiagrass"],
  "Poa annua": ["poa annua", "poa"],
  Paspalum: ["paspalum", "seashore paspalum"],
  Fescue: ["fescue"],
  Kikuyu: ["kikuyu"],
  "TifEagle": ["tifeagle", "tif-eagle"],
  "TifDwarf": ["tifdwarf"],
  "Champion Bermuda": ["champion bermuda", "champion dwarf"],
  "MiniVerde": ["miniverde"],
};

export function extractGrassType(description: string, which: "fairway" | "green"): string | null {
  const lower = description.toLowerCase();

  // Try to find context-specific mentions
  const contextPatterns =
    which === "fairway"
      ? [/fairways?\s+(?:are\s+)?(\w+(?:\s+\w+)?)\s+grass/i, /(\w+(?:\s+\w+)?)\s+fairways?/i]
      : [/greens?\s+(?:are\s+)?(\w+(?:\s+\w+)?)\s*/i, /(\w+(?:\s+\w+)?)\s+greens?/i];

  for (const [name, keywords] of Object.entries(GRASS_TYPES)) {
    for (const kw of keywords) {
      // Look for grass type near "fairway" or "green" context
      const contextWord = which === "fairway" ? "fairway" : "green";
      const idx = lower.indexOf(kw);
      if (idx >= 0) {
        const contextIdx = lower.indexOf(contextWord, Math.max(0, idx - 80));
        const contextIdx2 = lower.lastIndexOf(contextWord, idx + kw.length + 80);
        if (
          (contextIdx >= 0 && Math.abs(contextIdx - idx) < 80) ||
          (contextIdx2 >= 0 && Math.abs(contextIdx2 - idx) < 80)
        ) {
          return name;
        }
      }
    }
  }

  // Fallback: just check for grass types mentioned at all
  for (const [name, keywords] of Object.entries(GRASS_TYPES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return name;
    }
  }

  return null;
}

// ─── Best Months / Season by State ───────────────────────────────────

interface SeasonInfo {
  bestMonths: string[];
  golfSeason: string;
  bestTimeToPlay: string;
}

const STATE_SEASONS: Record<string, SeasonInfo> = {
  // Northeast
  ME: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions with warm weather and long days." },
  NH: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions with warm weather and long days." },
  VT: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers peak conditions. Fall brings spectacular foliage." },
  MA: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers excellent playing conditions. Fall foliage in September–October is spectacular." },
  CT: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers excellent conditions. September and October combine great weather with fewer crowds." },
  RI: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers the best conditions along the coast." },
  NY: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers excellent conditions. September and October are ideal with comfortable temperatures." },
  NJ: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers the best playing conditions. Spring and fall are ideal to avoid summer humidity." },
  PA: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], golfSeason: "April–November", bestTimeToPlay: "May through October offers the best conditions. Spring and fall provide comfortable temperatures." },

  // Mid-Atlantic
  MD: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "April through June and September through October offer ideal conditions, avoiding summer heat and humidity." },
  VA: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best conditions. April–May and September–October are ideal months." },
  DE: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "April through June and September through October offer the best conditions." },
  DC: { bestMonths: ["Apr", "May", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best conditions, avoiding the humid summer months." },
  WV: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September in the mountains offers comfortable temperatures and beautiful scenery." },

  // Southeast
  NC: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer ideal temperatures. The Pinehurst area is a year-round destination." },
  SC: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer the best conditions. Lowcountry golf is best in spring and fall." },
  GA: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer the best playing conditions. Spring azalea season is unforgettable." },
  FL: { bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"], golfSeason: "Year-round", bestTimeToPlay: "October through April offers the best conditions — lower humidity, comfortable temperatures. Summer brings afternoon thunderstorms." },
  AL: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer ideal conditions for the RTJ Trail and beyond." },
  MS: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "Spring and fall offer the best playing conditions, avoiding summer heat and humidity." },
  TN: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "April through June and September through October offer ideal golf weather." },
  KY: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "April through June and September through October offer the best conditions." },
  LA: { bestMonths: ["Oct", "Nov", "Dec", "Feb", "Mar", "Apr"], golfSeason: "Year-round", bestTimeToPlay: "October through April offers the best playing conditions. Summer heat and humidity can be extreme." },
  AR: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall are ideal. April through June and September through October offer the most comfortable conditions." },

  // Midwest
  OH: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best conditions. Late spring and early fall are ideal." },
  MI: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions. Northern Michigan summer golf is a bucket-list experience." },
  IN: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best playing conditions." },
  IL: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best conditions. Late spring and early fall are ideal." },
  WI: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions. Summer in Wisconsin offers long, beautiful days." },
  MN: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions with long summer days." },
  IA: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best conditions." },
  MO: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best conditions. April through June and September through October are ideal." },
  ND: { bestMonths: ["Jun", "Jul", "Aug"], golfSeason: "May–September", bestTimeToPlay: "June through August offers the best conditions with warm temperatures." },
  SD: { bestMonths: ["Jun", "Jul", "Aug"], golfSeason: "May–September", bestTimeToPlay: "June through August offers the best conditions." },
  NE: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best conditions. Sand Hills golf is best in summer." },
  KS: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best conditions. Wind is always a factor." },

  // Southwest / Mountain
  AZ: { bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"], golfSeason: "Year-round", bestTimeToPlay: "October through April offers ideal desert golf conditions. Summer temperatures can exceed 110°F — early morning rounds are essential." },
  NM: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best conditions. High desert elevation keeps summer temperatures manageable." },
  NV: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer ideal conditions. Summer is extremely hot in Las Vegas." },
  UT: { bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "May through September offers the best conditions. Southern Utah has a longer season." },
  CO: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best mountain golf. The ball flies farther at altitude." },
  WY: { bestMonths: ["Jun", "Jul", "Aug"], golfSeason: "May–September", bestTimeToPlay: "June through August offers the best conditions in the high country." },
  MT: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–September", bestTimeToPlay: "June through September offers the best conditions with spectacular mountain scenery." },
  ID: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "May–October", bestTimeToPlay: "June through September offers the best conditions." },

  // Pacific
  CA: { bestMonths: ["Mar", "Apr", "May", "Jun", "Sep", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "Year-round golf is possible. Spring and fall offer the best conditions on the coast. Inland courses are best October through May." },
  OR: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "June through September offers the driest conditions. Bandon Dunes is a year-round destination for links purists." },
  WA: { bestMonths: ["Jun", "Jul", "Aug", "Sep"], golfSeason: "April–October", bestTimeToPlay: "June through September offers the best conditions with long summer days." },
  HI: { bestMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], golfSeason: "Year-round", bestTimeToPlay: "Year-round destination. December through April offers slightly cooler, dryer conditions on leeward sides." },
  AK: { bestMonths: ["Jun", "Jul", "Aug"], golfSeason: "May–September", bestTimeToPlay: "June through August offers the best conditions with nearly 24 hours of daylight." },

  // South Central
  TX: { bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"], golfSeason: "Year-round", bestTimeToPlay: "March through May and October through November offer the best conditions. Summer heat can be extreme." },
  OK: { bestMonths: ["Apr", "May", "Jun", "Sep", "Oct"], golfSeason: "March–November", bestTimeToPlay: "Spring and fall offer the best playing conditions." },
};

// International fallback by latitude
function getSeasonByLatitude(lat: number): SeasonInfo {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) {
    return {
      bestMonths: ["Nov", "Dec", "Jan", "Feb", "Mar"],
      golfSeason: "Year-round",
      bestTimeToPlay: "Year-round destination. The dry season (November–March) offers the most comfortable conditions.",
    };
  }
  if (absLat < 35) {
    return {
      bestMonths: ["Mar", "Apr", "May", "Oct", "Nov"],
      golfSeason: "Year-round",
      bestTimeToPlay: "Spring and autumn offer the best conditions. Summer can be very hot.",
    };
  }
  if (absLat < 50) {
    return {
      bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"],
      golfSeason: "April–October",
      bestTimeToPlay: "May through September offers the best conditions.",
    };
  }
  return {
    bestMonths: ["Jun", "Jul", "Aug"],
    golfSeason: "May–September",
    bestTimeToPlay: "June through August offers the warmest conditions for golf.",
  };
}

export function getSeasonInfo(
  state: string | null | undefined,
  country: string | null | undefined,
  latitude: number | null | undefined
): SeasonInfo | null {
  // US state lookup
  if (state && STATE_SEASONS[state]) {
    return STATE_SEASONS[state];
  }

  // Try to match state abbreviation from full name
  if (state) {
    const abbr = stateToAbbr(state);
    if (abbr && STATE_SEASONS[abbr]) return STATE_SEASONS[abbr];
  }

  // International by latitude
  if (latitude != null) {
    return getSeasonByLatitude(latitude);
  }

  return null;
}

// ─── Average Round Time ──────────────────────────────────────────────

export function estimateRoundTime(
  numHoles: number | null | undefined,
  accessType: string | null | undefined,
  walkingPolicy: string | null | undefined
): string | null {
  const holes = numHoles || 18;
  if (holes === 9) {
    return "2 hours (9 holes)";
  }

  if (accessType === "Private") return "4 hours";
  if (walkingPolicy === "Walking Only" || walkingPolicy === "Unrestricted") return "4 hours 15 minutes";
  if (accessType === "Resort") return "4 hours 15 minutes";
  if (accessType === "Municipal") return "4 hours 30 minutes";

  return "4 hours 15 minutes";
}

// ─── State abbreviation helper ───────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

function stateToAbbr(state: string): string | null {
  if (state.length === 2) return state.toUpperCase();
  return STATE_NAMES[state] || null;
}

// ─── Main Enrichment Function ────────────────────────────────────────

export function enrichCourse(course: CourseData): EnrichmentResult {
  const fields: Record<string, any> = {};
  const extractedFrom: string[] = [];
  const desc = course.description || "";

  // 1. Par
  if (!course.par && desc) {
    const par = extractPar(desc);
    if (par) {
      fields.par = par;
      extractedFrom.push("par from description");
    }
  }

  // 2. Year opened
  if (!course.yearOpened && desc) {
    const year = extractYearOpened(desc);
    if (year) {
      fields.yearOpened = year;
      extractedFrom.push("yearOpened from description");
    }
  }

  // 3. Architect
  if (!course.originalArchitect && desc) {
    const architect = extractArchitect(desc);
    if (architect) {
      fields.originalArchitect = architect;
      extractedFrom.push("architect from description");
    }
  }

  // 4. Course style
  if (!course.courseStyle && desc) {
    const style = extractCourseStyle(desc);
    if (style) {
      fields.courseStyle = style;
      extractedFrom.push("courseStyle from description");
    }
  }

  // 5. Access type
  if (!course.accessType && desc) {
    const access = classifyAccessType(desc, course.greenFeeLow);
    if (access) {
      fields.accessType = access;
      extractedFrom.push("accessType from description");
    }
  }

  // 6. Course type
  if (!course.courseType && desc) {
    const type = classifyCourseType(desc, course.par || fields.par, course.numHoles);
    if (type) {
      fields.courseType = type;
      extractedFrom.push("courseType from description");
    }
  }

  // 7. Walking policy
  if (!course.walkingPolicy && desc) {
    const policy = inferWalkingPolicy(desc);
    if (policy) {
      fields.walkingPolicy = policy;
      extractedFrom.push("walkingPolicy from description");
    }
  }

  // 8. Dress code
  if (!course.dressCode) {
    const dressCode = inferDressCode(desc, course.accessType || fields.accessType);
    if (dressCode) {
      fields.dressCode = dressCode;
      extractedFrom.push("dressCode inferred");
    }
  }

  // 9. Practice facilities
  if (!course.practiceFacilities && desc) {
    const pf = inferPracticeFacilities(desc);
    if (pf) {
      fields.practiceFacilities = pf;
      extractedFrom.push("practiceFacilities from description");
    }
  }

  // 10. Best months / season / best time to play
  const seasonInfo = getSeasonInfo(course.state, course.country, course.latitude);
  if (seasonInfo) {
    if (!course.bestTimeToPlay) {
      fields.bestTimeToPlay = seasonInfo.bestTimeToPlay;
      extractedFrom.push("bestTimeToPlay from location");
    }
    if (!course.bestMonths) {
      fields.bestMonths = seasonInfo.bestMonths;
      extractedFrom.push("bestMonths from location");
    }
    if (!course.golfSeason) {
      fields.golfSeason = seasonInfo.golfSeason;
      extractedFrom.push("golfSeason from location");
    }
  }

  // 11. Average round time
  if (!course.averageRoundTime) {
    const roundTime = estimateRoundTime(
      course.numHoles,
      course.accessType || fields.accessType,
      course.walkingPolicy || fields.walkingPolicy
    );
    if (roundTime) {
      fields.averageRoundTime = roundTime;
      extractedFrom.push("averageRoundTime estimated");
    }
  }

  // 12. Grass types
  if (!course.fairwayGrass && desc) {
    const fw = extractGrassType(desc, "fairway");
    if (fw) {
      fields.fairwayGrass = fw;
      extractedFrom.push("fairwayGrass from description");
    }
  }
  if (!course.greenGrass && desc) {
    const gg = extractGrassType(desc, "green");
    if (gg) {
      fields.greenGrass = gg;
      extractedFrom.push("greenGrass from description");
    }
  }

  return { courseId: course.courseId, fields, extractedFrom };
}

// ─── Enrichment Completeness Calculation ─────────────────────────────

export const ENRICHMENT_FIELDS = [
  // Core info (high weight)
  { key: "description", label: "Description", weight: 3 },
  { key: "par", label: "Par", weight: 2 },
  { key: "originalArchitect", label: "Architect", weight: 2 },
  { key: "accessType", label: "Access Type", weight: 2 },
  { key: "yearOpened", label: "Year Opened", weight: 1 },
  { key: "courseType", label: "Course Type", weight: 1 },
  { key: "courseStyle", label: "Course Style", weight: 1 },
  { key: "tagline", label: "Tagline", weight: 1 },

  // Pricing
  { key: "greenFeeLow", label: "Green Fee (Low)", weight: 1 },
  { key: "greenFeeHigh", label: "Green Fee (High)", weight: 1 },
  { key: "priceTier", label: "Price Tier", weight: 1 },

  // Policies
  { key: "walkingPolicy", label: "Walking Policy", weight: 1 },
  { key: "dressCode", label: "Dress Code", weight: 1 },
  { key: "caddieAvailability", label: "Caddie Availability", weight: 1 },
  { key: "howToGetOn", label: "How to Get On", weight: 2 },
  { key: "guestPolicy", label: "Guest Policy", weight: 1 },

  // Course character & insider tips
  { key: "whatToExpect", label: "What to Expect", weight: 2 },
  { key: "courseStrategy", label: "Course Strategy", weight: 1 },
  { key: "insiderTips", label: "Insider Tips", weight: 2 },
  { key: "signatureHoleDescription", label: "Signature Hole", weight: 1 },
  { key: "bestPar3", label: "Best Par 3", weight: 1 },
  { key: "bestPar4", label: "Best Par 4", weight: 1 },
  { key: "bestPar5", label: "Best Par 5", weight: 1 },
  { key: "designPhilosophy", label: "Design Philosophy", weight: 1 },

  // Conditions
  { key: "fairwayGrass", label: "Fairway Grass", weight: 1 },
  { key: "greenGrass", label: "Green Grass", weight: 1 },
  { key: "greenSpeed", label: "Green Speed", weight: 1 },
  { key: "bestConditionMonths", label: "Best Condition Months", weight: 1 },
  { key: "practiceFacilities", label: "Practice Facilities", weight: 1 },

  // Season / timing
  { key: "bestTimeToPlay", label: "Best Time to Play", weight: 1 },
  { key: "bestMonths", label: "Best Months", weight: 1 },
  { key: "golfSeason", label: "Golf Season", weight: 1 },
  { key: "averageRoundTime", label: "Average Round Time", weight: 1 },

  // History
  { key: "championshipHistory", label: "Championship History", weight: 1 },
  { key: "famousMoments", label: "Famous Moments", weight: 1 },

  // Contact & location
  { key: "websiteUrl", label: "Website", weight: 1 },
  { key: "phone", label: "Phone", weight: 1 },
  { key: "latitude", label: "Coordinates", weight: 1 },
  { key: "streetAddress", label: "Address", weight: 1 },
] as const;

export function calculateEnrichmentPct(course: Record<string, any>): number {
  let totalWeight = 0;
  let filledWeight = 0;

  for (const f of ENRICHMENT_FIELDS) {
    totalWeight += f.weight;
    const val = course[f.key];
    if (val !== null && val !== undefined && val !== "") {
      filledWeight += f.weight;
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}
