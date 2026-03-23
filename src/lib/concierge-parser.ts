/**
 * Concierge Natural Language Parser
 * Rule-based parsing of golf course queries — extracts filters from natural language.
 */

export interface ParsedFilters {
  style?: string[];
  accessType?: string[];
  priceMin?: number;
  priceMax?: number;
  states?: string[];
  regions?: string[];
  countries?: string[];
  walkable?: boolean;
  eqScoreMin?: number;
  eqScoreMax?: number;
  architect?: string;
  limit?: number;
}

const STYLE_PATTERNS: Record<string, RegExp> = {
  links: /\blinks\b/i,
  parkland: /\bparkland\b/i,
  desert: /\bdesert\b/i,
  mountain: /\bmountain\b/i,
  heathland: /\bheathland\b/i,
  moorland: /\bmoorland\b/i,
  clifftop: /\bclifftop\b/i,
  woodland: /\bwoodland\b/i,
  tropical: /\btropical\b/i,
};

const ACCESS_PATTERNS: Record<string, RegExp> = {
  "Open to Public": /\b(public|open to public|municipal|muni)\b/i,
  "Member Only": /\b(private|member only|members only|exclusive)\b/i,
  "Resort Guest": /\b(resort|stay.and.play)\b/i,
};

const STATE_MAP: Record<string, string> = {
  alabama: "Alabama", al: "Alabama",
  alaska: "Alaska", ak: "Alaska",
  arizona: "Arizona", az: "Arizona",
  arkansas: "Arkansas", ar: "Arkansas",
  california: "California", ca: "California",
  colorado: "Colorado", co: "Colorado",
  connecticut: "Connecticut", ct: "Connecticut",
  delaware: "Delaware", de: "Delaware",
  florida: "Florida", fl: "Florida",
  georgia: "Georgia", ga: "Georgia",
  hawaii: "Hawaii", hi: "Hawaii",
  idaho: "Idaho", id: "Idaho",
  illinois: "Illinois", il: "Illinois",
  indiana: "Indiana", "in": "Indiana",
  iowa: "Iowa", ia: "Iowa",
  kansas: "Kansas", ks: "Kansas",
  kentucky: "Kentucky", ky: "Kentucky",
  louisiana: "Louisiana", la: "Louisiana",
  maine: "Maine", me: "Maine",
  maryland: "Maryland", md: "Maryland",
  massachusetts: "Massachusetts", ma: "Massachusetts",
  michigan: "Michigan", mi: "Michigan",
  minnesota: "Minnesota", mn: "Minnesota",
  mississippi: "Mississippi", ms: "Mississippi",
  missouri: "Missouri", mo: "Missouri",
  montana: "Montana", mt: "Montana",
  nebraska: "Nebraska", ne: "Nebraska",
  nevada: "Nevada", nv: "Nevada",
  "new hampshire": "New Hampshire", nh: "New Hampshire",
  "new jersey": "New Jersey", nj: "New Jersey",
  "new mexico": "New Mexico", nm: "New Mexico",
  "new york": "New York", ny: "New York",
  "north carolina": "North Carolina", nc: "North Carolina",
  "north dakota": "North Dakota", nd: "North Dakota",
  ohio: "Ohio", oh: "Ohio",
  oklahoma: "Oklahoma", ok: "Oklahoma",
  oregon: "Oregon", or: "Oregon",
  pennsylvania: "Pennsylvania", pa: "Pennsylvania",
  "rhode island": "Rhode Island", ri: "Rhode Island",
  "south carolina": "South Carolina", sc: "South Carolina",
  "south dakota": "South Dakota", sd: "South Dakota",
  tennessee: "Tennessee", tn: "Tennessee",
  texas: "Texas", tx: "Texas",
  utah: "Utah", ut: "Utah",
  vermont: "Vermont", vt: "Vermont",
  virginia: "Virginia", va: "Virginia",
  washington: "Washington", wa: "Washington",
  "west virginia": "West Virginia", wv: "West Virginia",
  wisconsin: "Wisconsin", wi: "Wisconsin",
  wyoming: "Wyoming", wy: "Wyoming",
};

const REGION_MAP: Record<string, string[]> = {
  northeast: ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "New Jersey", "New York", "Pennsylvania", "Rhode Island", "Vermont"],
  southeast: ["Alabama", "Florida", "Georgia", "Kentucky", "Mississippi", "North Carolina", "South Carolina", "Tennessee", "Virginia", "West Virginia"],
  midwest: ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
  southwest: ["Arizona", "New Mexico", "Oklahoma", "Texas"],
  west: ["Alaska", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "Oregon", "Utah", "Washington", "Wyoming"],
  "pacific northwest": ["Oregon", "Washington"],
  "new england": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont"],
};

const COUNTRY_PATTERNS: Record<string, RegExp> = {
  "United Kingdom": /\b(uk|united kingdom|england|britain)\b/i,
  Scotland: /\bscotland\b/i,
  Ireland: /\bireland\b/i,
  Canada: /\bcanada\b/i,
  Australia: /\baustralia\b/i,
  "New Zealand": /\bnew zealand\b/i,
  Japan: /\bjapan\b/i,
  Spain: /\bspain\b/i,
  France: /\bfrance\b/i,
  Mexico: /\bmexico\b/i,
};

const ARCHITECT_PATTERNS = [
  { name: "Tom Doak", pattern: /\btom doak\b/i },
  { name: "Pete Dye", pattern: /\bpete dye\b/i },
  { name: "Jack Nicklaus", pattern: /\b(jack nicklaus|nicklaus)\b/i },
  { name: "Donald Ross", pattern: /\b(donald ross|ross)\b/i },
  { name: "Robert Trent Jones", pattern: /\b(robert trent jones|rtj)\b/i },
  { name: "Alister MacKenzie", pattern: /\b(alister mackenzie|mackenzie)\b/i },
  { name: "Tom Fazio", pattern: /\btom fazio\b/i },
  { name: "Gil Hanse", pattern: /\bgil hanse\b/i },
  { name: "Bill Coore", pattern: /\bbill coore\b/i },
  { name: "Coore & Crenshaw", pattern: /\bcoore.{0,5}crenshaw\b/i },
  { name: "Arnold Palmer", pattern: /\barnold palmer\b/i },
  { name: "C.B. Macdonald", pattern: /\b(cb macdonald|c\.b\. macdonald|macdonald)\b/i },
  { name: "Seth Raynor", pattern: /\bseth raynor\b/i },
  { name: "A.W. Tillinghast", pattern: /\b(tillinghast|a\.w\. tillinghast)\b/i },
];

export function parseQuery(query: string): ParsedFilters {
  const filters: ParsedFilters = {};
  const lower = query.toLowerCase();

  // Extract styles
  const styles: string[] = [];
  for (const [style, pattern] of Object.entries(STYLE_PATTERNS)) {
    if (pattern.test(query)) {
      styles.push(style.charAt(0).toUpperCase() + style.slice(1));
    }
  }
  if (styles.length > 0) filters.style = styles;

  // Extract access types
  const accessTypes: string[] = [];
  for (const [type, pattern] of Object.entries(ACCESS_PATTERNS)) {
    if (pattern.test(query)) accessTypes.push(type);
  }
  if (accessTypes.length > 0) filters.accessType = accessTypes;

  // Extract price range
  const priceUnder = lower.match(/under\s*\$?(\d+)/);
  const priceBelow = lower.match(/below\s*\$?(\d+)/);
  const priceLess = lower.match(/less than\s*\$?(\d+)/);
  const priceMax = lower.match(/max(?:imum)?\s*\$?(\d+)/);
  const priceOver = lower.match(/over\s*\$?(\d+)/);
  const priceAbove = lower.match(/above\s*\$?(\d+)/);
  const priceRange = lower.match(/\$(\d+)\s*(?:-|to)\s*\$?(\d+)/);
  const priceAround = lower.match(/around\s*\$?(\d+)/);

  if (priceRange) {
    filters.priceMin = parseInt(priceRange[1]);
    filters.priceMax = parseInt(priceRange[2]);
  } else if (priceUnder) {
    filters.priceMax = parseInt(priceUnder[1]);
  } else if (priceBelow) {
    filters.priceMax = parseInt(priceBelow[1]);
  } else if (priceLess) {
    filters.priceMax = parseInt(priceLess[1]);
  } else if (priceMax) {
    filters.priceMax = parseInt(priceMax[1]);
  } else if (priceOver) {
    filters.priceMin = parseInt(priceOver[1]);
  } else if (priceAbove) {
    filters.priceMin = parseInt(priceAbove[1]);
  } else if (priceAround) {
    const base = parseInt(priceAround[1]);
    filters.priceMin = Math.round(base * 0.7);
    filters.priceMax = Math.round(base * 1.3);
  }

  // Cheap/affordable/budget
  if (/\b(cheap|affordable|budget|bargain|inexpensive)\b/i.test(query)) {
    if (!filters.priceMax) filters.priceMax = 100;
  }
  if (/\b(luxury|premium|high.end|upscale|expensive|elite)\b/i.test(query)) {
    if (!filters.priceMin) filters.priceMin = 200;
  }

  // Extract states
  const states: string[] = [];
  for (const [key, val] of Object.entries(STATE_MAP)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(query) && !states.includes(val)) {
      states.push(val);
    }
  }
  if (states.length > 0) filters.states = states;

  // Extract regions
  const regions: string[] = [];
  for (const [region, regionStates] of Object.entries(REGION_MAP)) {
    const escaped = region.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(lower)) {
      regions.push(region);
      if (!filters.states) filters.states = [];
      for (const s of regionStates) {
        if (!filters.states.includes(s)) filters.states.push(s);
      }
    }
  }
  if (regions.length > 0) filters.regions = regions;

  // Extract countries
  const countries: string[] = [];
  for (const [country, pattern] of Object.entries(COUNTRY_PATTERNS)) {
    if (pattern.test(query)) countries.push(country);
  }
  if (countries.length > 0) filters.countries = countries;

  // Walkability
  if (/\b(walkable|walking|walk)\b/i.test(query)) {
    filters.walkable = true;
  }

  // EQ score
  const eqMin = lower.match(/(?:eq|equalizer|rating|score)\s*(?:above|over|>=?)\s*(\d+)/);
  const eqRange = lower.match(/(?:eq|equalizer|rating|score)\s*(\d+)\s*(?:-|to)\s*(\d+)/);
  if (eqRange) {
    filters.eqScoreMin = parseInt(eqRange[1]);
    filters.eqScoreMax = parseInt(eqRange[2]);
  } else if (eqMin) {
    filters.eqScoreMin = parseInt(eqMin[1]);
  }
  if (/\b(top.rated|best|highest.rated|top courses)\b/i.test(query)) {
    if (!filters.eqScoreMin) filters.eqScoreMin = 80;
  }

  // Architect
  for (const { name, pattern } of ARCHITECT_PATTERNS) {
    if (pattern.test(query)) {
      filters.architect = name;
      break;
    }
  }

  // Limit
  const limitMatch = lower.match(/(?:show|find|give|top)\s*(?:me\s+)?(\d+)/);
  if (limitMatch) {
    const num = parseInt(limitMatch[1]);
    if (num >= 1 && num <= 100) filters.limit = num;
  }

  return filters;
}

export function buildWhereClause(filters: ParsedFilters): { where: string; params: any[] } {
  const conditions: string[] = ["1=1"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters.style && filters.style.length > 0) {
    const styleConds = filters.style.map((s) => {
      params.push(`%${s}%`);
      return `c."courseStyle" ILIKE $${paramIdx++}`;
    });
    conditions.push(`(${styleConds.join(" OR ")})`);
  }

  if (filters.accessType && filters.accessType.length > 0) {
    const placeholders = filters.accessType.map((a) => {
      params.push(a);
      return `$${paramIdx++}`;
    });
    conditions.push(`c."accessType" IN (${placeholders.join(", ")})`);
  }

  if (filters.priceMax !== undefined) {
    params.push(filters.priceMax);
    conditions.push(`(c."greenFeeLow" IS NOT NULL AND c."greenFeeLow" <= $${paramIdx++})`);
  }

  if (filters.priceMin !== undefined) {
    params.push(filters.priceMin);
    conditions.push(`(c."greenFeeHigh" IS NOT NULL AND c."greenFeeHigh" >= $${paramIdx++})`);
  }

  if (filters.states && filters.states.length > 0) {
    const placeholders = filters.states.map((s) => {
      params.push(s);
      return `$${paramIdx++}`;
    });
    conditions.push(`c."state" IN (${placeholders.join(", ")})`);
  }

  if (filters.countries && filters.countries.length > 0) {
    const placeholders = filters.countries.map((c) => {
      params.push(c);
      return `$${paramIdx++}`;
    });
    conditions.push(`c."country" IN (${placeholders.join(", ")})`);
  }

  if (filters.walkable) {
    conditions.push(`(c."walkingPolicy" IS NOT NULL AND c."walkingPolicy" NOT ILIKE '%not allowed%' AND c."walkingPolicy" NOT ILIKE '%cart required%')`);
  }

  if (filters.architect) {
    params.push(`%${filters.architect}%`);
    conditions.push(`(c."originalArchitect" ILIKE $${paramIdx++} OR c."renovationArchitect" ILIKE $${paramIdx - 1})`);
  }

  return { where: conditions.join(" AND "), params };
}

export function generateResponse(
  courses: any[],
  filters: ParsedFilters,
  query: string
): { message: string; suggestions: string[] } {
  const count = courses.length;

  let message = "";
  if (count === 0) {
    message = "I couldn't find any courses matching those criteria. Try broadening your search — maybe a different region or a higher price range?";
  } else if (count === 1) {
    message = `I found one course that matches your search perfectly. Take a look:`;
  } else if (count <= 5) {
    message = `Great news! I found ${count} courses that match what you're looking for. Here are my recommendations:`;
  } else if (count <= 15) {
    message = `I found ${count} courses matching your criteria. Here are the top picks:`;
  } else {
    message = `There are ${count} courses that match — here are the best ones to consider:`;
  }

  // Add context about filters
  const parts: string[] = [];
  if (filters.style?.length) parts.push(filters.style.join("/") + " style");
  if (filters.states?.length && filters.states.length <= 3) parts.push(`in ${filters.states.join(", ")}`);
  if (filters.countries?.length) parts.push(`in ${filters.countries.join(", ")}`);
  if (filters.priceMax) parts.push(`under $${filters.priceMax}`);
  if (filters.priceMin) parts.push(`over $${filters.priceMin}`);
  if (filters.walkable) parts.push("walkable");
  if (filters.architect) parts.push(`designed by ${filters.architect}`);

  if (parts.length > 0) {
    message += ` Looking for ${parts.join(", ")}.`;
  }

  // Generate follow-up suggestions
  const suggestions: string[] = [];
  if (filters.style?.length) {
    suggestions.push(`Show me similar courses in a different region`);
  }
  if (!filters.countries?.length && !filters.states?.length) {
    suggestions.push(`What about courses in Scotland?`);
  }
  if (!filters.style?.length) {
    suggestions.push(`Show me the best links courses`);
  }
  if (!filters.priceMax) {
    suggestions.push(`Which of these are under $150?`);
  }
  if (!filters.walkable) {
    suggestions.push(`Which courses are walkable?`);
  }
  if (filters.architect) {
    suggestions.push(`What other architects have a similar style?`);
  }
  suggestions.push(`Tell me more about the top pick`);

  return { message, suggestions: suggestions.slice(0, 4) };
}
