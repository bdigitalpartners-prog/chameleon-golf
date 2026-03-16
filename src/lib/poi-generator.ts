/**
 * POI Generation Engine
 *
 * Generates plausible nearby Points of Interest for golf courses based on
 * location data (city, state, lat/lon). For famous courses, generates
 * specific known establishments. For others, generates category-appropriate
 * plausible entries.
 */

interface CourseInput {
  courseId: number;
  courseName: string;
  facilityName?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  courseType?: string | null;
  accessType?: string | null;
  onSiteLodging?: boolean | null;
  resortNameField?: string | null;
  priceTier?: string | null;
}

interface DiningPOI {
  name: string;
  cuisineType: string;
  priceLevel: string;
  rating: number;
  distanceMiles: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  isOnSite: boolean;
  sortOrder: number;
}

interface LodgingPOI {
  name: string;
  lodgingType: string;
  priceTier: string;
  avgPricePerNight: number;
  rating: number;
  distanceMiles: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  isOnSite: boolean;
  isPartner: boolean;
  sortOrder: number;
}

interface AttractionPOI {
  name: string;
  category: string;
  description: string;
  distanceMiles: number;
  rating: number;
  websiteUrl?: string;
  sortOrder: number;
}

interface RvParkPOI {
  name: string;
  description: string;
  distanceMiles: number;
  driveTimeMinutes: number;
  rating: number;
  priceLevel: string;
  numSites?: number;
  hookups?: string;
  amenities?: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  sortOrder: number;
}

export interface GeneratedPOIs {
  dining: DiningPOI[];
  lodging: LodgingPOI[];
  attractions: AttractionPOI[];
  rvParks: RvParkPOI[];
}

// ── Famous Course POI Data ──

const FAMOUS_COURSE_POIS: Record<string, Partial<GeneratedPOIs>> = {
  "pebble beach golf links": {
    dining: [
      { name: "The Bench", cuisineType: "American Fine Dining", priceLevel: "$$$$", rating: 4.6, distanceMiles: 0, description: "Upscale restaurant at The Lodge at Pebble Beach with ocean views. Known for its seafood and prime steaks.", isOnSite: true, sortOrder: 0 },
      { name: "Roy's at Pebble Beach", cuisineType: "Hawaiian Fusion", priceLevel: "$$$", rating: 4.5, distanceMiles: 0.1, description: "Hawaiian-inspired fine dining with creative seafood dishes and a vibrant atmosphere at The Inn at Spanish Bay.", isOnSite: true, sortOrder: 1 },
      { name: "Sticks Bar & Grill", cuisineType: "American Grill", priceLevel: "$$", rating: 4.3, distanceMiles: 0.1, description: "Casual dining at Spanish Bay with pub-style fare, craft cocktails, and outdoor seating.", isOnSite: true, sortOrder: 2 },
      { name: "Grasing's Coastal Cuisine", cuisineType: "Californian", priceLevel: "$$$", rating: 4.5, distanceMiles: 3.2, description: "Farm-to-table fine dining in downtown Carmel featuring locally-sourced seafood and produce.", isOnSite: false, sortOrder: 3 },
      { name: "The Sardine Factory", cuisineType: "Seafood", priceLevel: "$$$", rating: 4.4, distanceMiles: 4.5, description: "Iconic Cannery Row restaurant serving fresh seafood in an elegant setting since 1968.", isOnSite: false, sortOrder: 4 },
    ],
    lodging: [
      { name: "The Lodge at Pebble Beach", lodgingType: "Luxury Resort", priceTier: "$$$$", avgPricePerNight: 950, rating: 4.7, distanceMiles: 0, description: "Iconic Forbes Five-Star resort overlooking the 18th green. The ultimate golf resort experience.", isOnSite: true, isPartner: true, sortOrder: 0 },
      { name: "The Inn at Spanish Bay", lodgingType: "Luxury Resort", priceTier: "$$$$", avgPricePerNight: 750, rating: 4.6, distanceMiles: 1.5, description: "Elegant oceanfront resort with Scottish links-style course and nightly bagpiper at sunset.", isOnSite: true, isPartner: true, sortOrder: 1 },
      { name: "Casa Palmero", lodgingType: "Boutique Hotel", priceTier: "$$$$", avgPricePerNight: 1200, rating: 4.8, distanceMiles: 0.1, description: "Intimate Mediterranean-style estate within Pebble Beach. Ultra-exclusive with 24 rooms.", isOnSite: true, isPartner: true, sortOrder: 2 },
    ],
    attractions: [
      { name: "17-Mile Drive", category: "Scenic Drive", description: "World-famous coastal road through Pebble Beach with stunning ocean vistas and the Lone Cypress.", distanceMiles: 0, rating: 4.8, sortOrder: 0 },
      { name: "Monterey Bay Aquarium", category: "Aquarium", description: "World-class aquarium featuring over 35,000 creatures, kelp forests, and sea otter exhibits.", distanceMiles: 5.0, rating: 4.7, sortOrder: 1 },
      { name: "Carmel-by-the-Sea", category: "Historic Town", description: "Charming village with art galleries, boutique shops, wine tasting rooms, and beautiful Carmel Beach.", distanceMiles: 3.5, rating: 4.6, sortOrder: 2 },
    ],
    rvParks: [
      { name: "Laguna Seca Recreation Area", description: "County park with RV sites near the famous Laguna Seca Raceway. Full hookups, scenic views of the Monterey Peninsula.", distanceMiles: 8.5, driveTimeMinutes: 15, rating: 4.1, priceLevel: "$$", numSites: 172, hookups: "Full (Water, Electric, Sewer)", amenities: "Showers, restrooms, hiking trails, lake access", sortOrder: 0 },
    ],
  },

  "pinehurst no. 2": {
    dining: [
      { name: "The Carolina Dining Room", cuisineType: "Southern Fine Dining", priceLevel: "$$$$", rating: 4.6, distanceMiles: 0, description: "The resort's signature restaurant featuring elevated Southern cuisine in an elegant, historic dining room.", isOnSite: true, sortOrder: 0 },
      { name: "1895 Grille", cuisineType: "American Steakhouse", priceLevel: "$$$", rating: 4.5, distanceMiles: 0, description: "Classic steakhouse within the resort. Prime cuts, craft cocktails, and a warm clubhouse atmosphere.", isOnSite: true, sortOrder: 1 },
      { name: "The Deuce", cuisineType: "Pub Fare", priceLevel: "$$", rating: 4.3, distanceMiles: 0.1, description: "Casual pub at Pinehurst Resort, perfect for a post-round meal. Burgers, sandwiches, and cold beers.", isOnSite: true, sortOrder: 2 },
      { name: "Dugan's Pub", cuisineType: "Irish Pub", priceLevel: "$$", rating: 4.2, distanceMiles: 0.5, description: "Friendly neighborhood pub in the Village of Pinehurst with traditional fare and live music.", isOnSite: false, sortOrder: 3 },
      { name: "Ashten's", cuisineType: "Contemporary Southern", priceLevel: "$$$", rating: 4.4, distanceMiles: 1.0, description: "Upscale contemporary dining in Pinehurst Village with a seasonal menu and extensive wine list.", isOnSite: false, sortOrder: 4 },
    ],
    lodging: [
      { name: "The Carolina Hotel", lodgingType: "Historic Resort", priceTier: "$$$$", avgPricePerNight: 450, rating: 4.7, distanceMiles: 0, description: "The grand 1901 hotel at the heart of Pinehurst Resort. Southern charm meets modern luxury.", isOnSite: true, isPartner: true, sortOrder: 0 },
      { name: "The Holly Inn", lodgingType: "Historic Inn", priceTier: "$$$", avgPricePerNight: 350, rating: 4.5, distanceMiles: 0.2, description: "Pinehurst's original 1895 hotel. Boutique-style rooms with Victorian elegance.", isOnSite: true, isPartner: true, sortOrder: 1 },
      { name: "The Manor Inn", lodgingType: "Inn", priceTier: "$$$", avgPricePerNight: 280, rating: 4.4, distanceMiles: 0.3, description: "Charming resort inn with cozy rooms and a quieter setting within the Pinehurst property.", isOnSite: true, isPartner: true, sortOrder: 2 },
    ],
    attractions: [
      { name: "Pinehurst Village", category: "Historic District", description: "Walkable village with charming shops, restaurants, and the historic Pinehurst Harness Track.", distanceMiles: 0.5, rating: 4.4, sortOrder: 0 },
      { name: "Tufts Archives", category: "Museum", description: "Museum documenting the history of Pinehurst and its golf heritage, including Donald Ross memorabilia.", distanceMiles: 0.3, rating: 4.3, sortOrder: 1 },
      { name: "Weymouth Woods Nature Preserve", category: "Nature", description: "900-acre preserve with longleaf pine forests, hiking trails, and wildlife viewing.", distanceMiles: 5.0, rating: 4.5, sortOrder: 2 },
    ],
    rvParks: [
      { name: "Pinehurst RV Resort", description: "Modern RV resort catering to golf travelers. Minutes from Pinehurst Resort with shuttle service available.", distanceMiles: 3.0, driveTimeMinutes: 8, rating: 4.2, priceLevel: "$$", numSites: 85, hookups: "Full (Water, Electric 30/50 AMP, Sewer)", amenities: "Pool, clubhouse, laundry, Wi-Fi, golf cart rentals", sortOrder: 0 },
    ],
  },

  "bandon dunes": {
    dining: [
      { name: "The Gallery", cuisineType: "Pacific Northwest", priceLevel: "$$$$", rating: 4.7, distanceMiles: 0, description: "The resort's signature fine dining restaurant featuring Pacific Northwest cuisine with ocean views.", isOnSite: true, sortOrder: 0 },
      { name: "McKee's Pub", cuisineType: "Pub Fare", priceLevel: "$$", rating: 4.5, distanceMiles: 0, description: "Lively pub in the main lodge. Great burgers, fish & chips, and a legendary post-round atmosphere.", isOnSite: true, sortOrder: 1 },
      { name: "Trails End", cuisineType: "American", priceLevel: "$$", rating: 4.4, distanceMiles: 0, description: "Casual resort dining with comfort food. Perfect spot before or after a round on Pacific Dunes.", isOnSite: true, sortOrder: 2 },
      { name: "Alloro Wine Bar", cuisineType: "Italian", priceLevel: "$$$", rating: 4.5, distanceMiles: 12, description: "Charming Italian wine bar and restaurant in downtown Bandon with house-made pasta and Oregon wines.", isOnSite: false, sortOrder: 3 },
      { name: "Tony's Crab Shack", cuisineType: "Seafood", priceLevel: "$$", rating: 4.3, distanceMiles: 11, description: "Local favorite for fresh Dungeness crab, clam chowder, and casual waterfront dining in Old Town Bandon.", isOnSite: false, sortOrder: 4 },
    ],
    lodging: [
      { name: "Bandon Dunes Lodge", lodgingType: "Golf Resort", priceTier: "$$$", avgPricePerNight: 350, rating: 4.6, distanceMiles: 0, description: "The main resort lodge with comfortable rooms and easy access to all courses.", isOnSite: true, isPartner: true, sortOrder: 0 },
      { name: "Chrome Lake Lodge", lodgingType: "Golf Resort", priceTier: "$$$", avgPricePerNight: 320, rating: 4.5, distanceMiles: 0.5, description: "Newer lodge overlooking Chrome Lake with modern rooms and quick access to Bandon Trails.", isOnSite: true, isPartner: true, sortOrder: 1 },
      { name: "The Resort Cottages", lodgingType: "Cottage", priceTier: "$$$$", avgPricePerNight: 500, rating: 4.7, distanceMiles: 0.2, description: "Private cottages scattered throughout the resort property. Ideal for groups.", isOnSite: true, isPartner: true, sortOrder: 2 },
    ],
    attractions: [
      { name: "Face Rock State Scenic Viewpoint", category: "Natural Landmark", description: "Iconic rock formation in the ocean visible from the beach. Named after a Coquille tribal legend.", distanceMiles: 10, rating: 4.6, sortOrder: 0 },
      { name: "Bullards Beach State Park", category: "State Park", description: "Beautiful state park with the Coquille River Lighthouse, beaches, and miles of trails.", distanceMiles: 8, rating: 4.5, sortOrder: 1 },
      { name: "Cranberry Sweets", category: "Local Shop", description: "Famous candy factory and shop in Bandon. Free samples of cranberry confections and taffy.", distanceMiles: 11, rating: 4.4, sortOrder: 2 },
    ],
    rvParks: [
      { name: "Bullards Beach State Park Campground", description: "State park campground with RV sites near the beach and Coquille Lighthouse. Closest quality RV option to Bandon Dunes.", distanceMiles: 7.0, driveTimeMinutes: 12, rating: 4.3, priceLevel: "$", numSites: 185, hookups: "Electric, Water", amenities: "Showers, restrooms, beach access, horse trails, boat ramp", sortOrder: 0 },
    ],
  },

  "whistling straits": {
    dining: [
      { name: "The Straits", cuisineType: "American Fine Dining", priceLevel: "$$$$", rating: 4.5, distanceMiles: 0, description: "The clubhouse restaurant featuring upscale American cuisine with stunning Lake Michigan views.", isOnSite: true, sortOrder: 0 },
      { name: "The Irish Pub", cuisineType: "Pub Fare", priceLevel: "$$", rating: 4.4, distanceMiles: 0, description: "Traditional Irish-style pub at the course with hearty fare, craft beers, and a warm fireplace.", isOnSite: true, sortOrder: 1 },
      { name: "The American Club - The Immigrant", cuisineType: "European Fine Dining", priceLevel: "$$$$", rating: 4.7, distanceMiles: 8, description: "AAA Five-Diamond restaurant in Kohler celebrating immigrant heritage with multi-course European cuisine.", isOnSite: false, sortOrder: 2 },
      { name: "Blackwolf Run Restaurant", cuisineType: "American", priceLevel: "$$$", rating: 4.4, distanceMiles: 8, description: "Dining at the sister course with views of the Sheboygan River and classic American fare.", isOnSite: false, sortOrder: 3 },
    ],
    lodging: [
      { name: "The American Club", lodgingType: "Luxury Resort", priceTier: "$$$$", avgPricePerNight: 550, rating: 4.7, distanceMiles: 8, description: "Forbes Five-Star resort in Kohler. America's only AAA Five-Diamond resort hotel in the Midwest.", isOnSite: false, isPartner: true, sortOrder: 0 },
      { name: "Inn on Woodlake", lodgingType: "Hotel", priceTier: "$$$", avgPricePerNight: 280, rating: 4.4, distanceMiles: 8, description: "Comfortable lakeside hotel in Kohler with resort amenities at a more approachable price.", isOnSite: false, isPartner: true, sortOrder: 1 },
    ],
    attractions: [
      { name: "Kohler Design Center", category: "Museum", description: "Stunning showcase of Kohler plumbing products and art installations. Free admission.", distanceMiles: 8, rating: 4.3, sortOrder: 0 },
      { name: "John Michael Kohler Arts Center", category: "Art Gallery", description: "Contemporary art center with rotating exhibitions, art-filled public spaces, and artist residency programs.", distanceMiles: 10, rating: 4.5, sortOrder: 1 },
      { name: "Kohler Waters Spa", category: "Spa & Wellness", description: "World-class spa featuring hydrotherapy and water-based treatments in a luxurious setting.", distanceMiles: 8, rating: 4.6, sortOrder: 2 },
    ],
    rvParks: [
      { name: "Kohler-Andrae State Park", description: "Beautiful state park on Lake Michigan with RV sites in the dunes. Excellent hiking and beach access close to Whistling Straits.", distanceMiles: 12, driveTimeMinutes: 18, rating: 4.4, priceLevel: "$", numSites: 105, hookups: "Electric", amenities: "Showers, restrooms, beach access, nature center, hiking trails", sortOrder: 0 },
    ],
  },

  "kiawah island ocean course": {
    dining: [
      { name: "The Ocean Room", cuisineType: "Southern Coastal", priceLevel: "$$$$", rating: 4.6, distanceMiles: 0.5, description: "Forbes Four-Star restaurant at The Sanctuary Hotel with Atlantic Ocean views and Lowcountry cuisine.", isOnSite: true, sortOrder: 0 },
      { name: "Ryder Cup Bar", cuisineType: "American Grill", priceLevel: "$$", rating: 4.3, distanceMiles: 0, description: "Casual clubhouse bar and grill at the Ocean Course. Perfect for a post-round meal.", isOnSite: true, sortOrder: 1 },
      { name: "Jasmine Porch", cuisineType: "Southern", priceLevel: "$$$", rating: 4.5, distanceMiles: 0.5, description: "Lowcountry buffet and à la carte dining at The Sanctuary with live music and porch seating.", isOnSite: true, sortOrder: 2 },
    ],
    lodging: [
      { name: "The Sanctuary at Kiawah Island", lodgingType: "Luxury Resort", priceTier: "$$$$", avgPricePerNight: 700, rating: 4.8, distanceMiles: 0.5, description: "Forbes Five-Star resort on 10 miles of pristine beach. The pinnacle of Lowcountry luxury.", isOnSite: true, isPartner: true, sortOrder: 0 },
      { name: "Kiawah Island Golf Resort Villas", lodgingType: "Villa", priceTier: "$$$", avgPricePerNight: 400, rating: 4.4, distanceMiles: 1.0, description: "Private villas and cottages throughout Kiawah Island with full resort access.", isOnSite: true, isPartner: true, sortOrder: 1 },
    ],
    attractions: [
      { name: "Kiawah Island Nature Programs", category: "Nature", description: "Guided kayak tours, bird watching, alligator spotting, and beach ecology programs.", distanceMiles: 1, rating: 4.6, sortOrder: 0 },
      { name: "Angel Oak Tree", category: "Natural Landmark", description: "Estimated 400-500 year old live oak tree on Johns Island. One of the oldest living things east of the Mississippi.", distanceMiles: 18, rating: 4.7, sortOrder: 1 },
      { name: "Historic Charleston", category: "Historic District", description: "World-famous historic city with cobblestone streets, antebellum homes, and world-class restaurants.", distanceMiles: 25, rating: 4.8, sortOrder: 2 },
    ],
    rvParks: [
      { name: "James Island County Park", description: "Full-service county park with RV sites, splash zone, and convenient access to Kiawah and Charleston.", distanceMiles: 15, driveTimeMinutes: 22, rating: 4.3, priceLevel: "$$", numSites: 125, hookups: "Full (Water, Electric 30/50 AMP, Sewer)", amenities: "Pool, splash pad, fishing, kayak rentals, dog park", sortOrder: 0 },
    ],
  },

  "tpc sawgrass": {
    dining: [
      { name: "Nineteen at TPC Sawgrass", cuisineType: "American Fine Dining", priceLevel: "$$$$", rating: 4.5, distanceMiles: 0, description: "The signature restaurant at TPC Sawgrass with views of the iconic 17th island green.", isOnSite: true, sortOrder: 0 },
      { name: "The Yard", cuisineType: "American", priceLevel: "$$", rating: 4.3, distanceMiles: 0, description: "Relaxed poolside dining at the Sawgrass Marriott with burgers, salads, and frozen cocktails.", isOnSite: true, sortOrder: 1 },
      { name: "Caps on the Water", cuisineType: "Seafood", priceLevel: "$$$", rating: 4.4, distanceMiles: 5, description: "Waterfront dining on the Intracoastal with fresh catches and sunset views in Vilano Beach.", isOnSite: false, sortOrder: 2 },
    ],
    lodging: [
      { name: "Sawgrass Marriott Golf Resort & Spa", lodgingType: "Golf Resort", priceTier: "$$$", avgPricePerNight: 350, rating: 4.5, distanceMiles: 0, description: "Adjacent to TPC Sawgrass with direct access to both courses. Full-service spa and multiple pools.", isOnSite: true, isPartner: true, sortOrder: 0 },
      { name: "Ponte Vedra Inn & Club", lodgingType: "Luxury Resort", priceTier: "$$$$", avgPricePerNight: 500, rating: 4.6, distanceMiles: 3, description: "Historic oceanfront resort in Ponte Vedra Beach with two courses and a world-class spa.", isOnSite: false, isPartner: false, sortOrder: 1 },
    ],
    attractions: [
      { name: "St. Augustine Historic District", category: "Historic District", description: "America's oldest city, 30 minutes south. Castillo de San Marcos, St. George Street, and historic architecture.", distanceMiles: 28, rating: 4.7, sortOrder: 0 },
      { name: "Ponte Vedra Beach", category: "Beach", description: "Beautiful uncrowded beaches just minutes from the course. Great for a morning walk or afternoon relaxation.", distanceMiles: 3, rating: 4.5, sortOrder: 1 },
    ],
    rvParks: [
      { name: "Anastasia State Park", description: "Beachfront state park camping near St. Augustine with excellent facilities and nature trails.", distanceMiles: 25, driveTimeMinutes: 30, rating: 4.5, priceLevel: "$", numSites: 139, hookups: "Electric, Water", amenities: "Beach access, kayak/paddleboard rentals, nature trails, showers", sortOrder: 0 },
    ],
  },
};

// ── Generic POI Templates ──

const CUISINE_TYPES = [
  "American", "Steakhouse", "Seafood", "Italian", "Mexican",
  "BBQ", "Southern", "Asian Fusion", "Farm-to-Table", "Gastropub",
  "Sushi", "Mediterranean", "Cajun", "Tex-Mex", "Continental",
];

const RESTAURANT_NAME_PATTERNS = [
  "The {adj} {noun}",
  "{name}'s {type}",
  "{adj} {noun} Grill",
  "The {noun} House",
  "{name}'s Kitchen",
];

const HOTEL_CHAINS = [
  { name: "Hampton Inn & Suites", type: "Hotel", tier: "$$", price: 140 },
  { name: "Courtyard by Marriott", type: "Hotel", tier: "$$", price: 155 },
  { name: "Hilton Garden Inn", type: "Hotel", tier: "$$", price: 160 },
  { name: "Fairfield Inn & Suites", type: "Hotel", tier: "$", price: 120 },
  { name: "Holiday Inn Express", type: "Hotel", tier: "$", price: 115 },
  { name: "Residence Inn", type: "Extended Stay", tier: "$$", price: 170 },
  { name: "Best Western Plus", type: "Hotel", tier: "$", price: 105 },
];

const BOUTIQUE_HOTELS = [
  { adj: "Historic", suffix: "Inn" },
  { adj: "Lakeside", suffix: "Lodge" },
  { adj: "Country", suffix: "Inn" },
  { adj: "Heritage", suffix: "House" },
  { adj: "Village", suffix: "Inn" },
];

const ATTRACTION_CATEGORIES = [
  "State Park", "Winery", "Historic Site", "Museum",
  "Nature Preserve", "Shopping District", "Brewery",
  "Scenic Drive", "Water Activity", "Golf Museum",
];

const DINING_ADJECTIVES = [
  "Iron", "Golden", "Copper", "Silver", "Oak",
  "Cedar", "Stone", "River", "Harbor", "Pine",
];

const DINING_NOUNS = [
  "Fork", "Table", "Barrel", "Tap", "Grill",
  "Anchor", "Mill", "Kettle", "Vine", "Flame",
];

const FIRST_NAMES = [
  "Jack", "Mike", "Tony", "Charlie", "Sam",
  "Bobby", "Pete", "Frank", "Joe", "Nick",
];

// Deterministic pseudo-random from course ID
function seededRandom(courseId: number, index: number): number {
  const x = Math.sin(courseId * 9301 + index * 49297) * 49397;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], courseId: number, index: number): T {
  return arr[Math.floor(seededRandom(courseId, index) * arr.length)];
}

function generateRating(courseId: number, index: number, min: number = 3.5, max: number = 4.8): number {
  const raw = min + seededRandom(courseId, index + 500) * (max - min);
  return Math.round(raw * 10) / 10;
}

function generateDistance(courseId: number, index: number, min: number, max: number): number {
  const raw = min + seededRandom(courseId, index + 1000) * (max - min);
  return Math.round(raw * 10) / 10;
}

function getDriveTime(miles: number): number {
  return Math.round(miles * 2.2 + 3);
}

// State-based context for richer generation
const STATE_CONTEXT: Record<string, { cuisine: string[]; attractions: string[]; region: string }> = {
  "California": { cuisine: ["Californian", "Seafood", "Mexican", "Farm-to-Table", "Sushi"], attractions: ["Winery", "Beach", "Scenic Drive"], region: "West Coast" },
  "Florida": { cuisine: ["Seafood", "Cuban", "Southern", "Caribbean", "American"], attractions: ["Beach", "Nature Preserve", "Water Activity"], region: "Southeast" },
  "South Carolina": { cuisine: ["Southern", "Lowcountry", "Seafood", "BBQ"], attractions: ["Historic Site", "Beach", "Nature Preserve"], region: "Southeast" },
  "North Carolina": { cuisine: ["Southern", "BBQ", "Farm-to-Table", "Seafood"], attractions: ["State Park", "Historic Site", "Brewery"], region: "Southeast" },
  "Texas": { cuisine: ["Tex-Mex", "BBQ", "Steakhouse", "Southern", "Mexican"], attractions: ["Ranch", "Historic Site", "Brewery"], region: "Southwest" },
  "Arizona": { cuisine: ["Southwestern", "Mexican", "Steakhouse", "American"], attractions: ["Desert Tour", "Scenic Drive", "Spa & Wellness"], region: "Southwest" },
  "Georgia": { cuisine: ["Southern", "BBQ", "Seafood", "Farm-to-Table"], attractions: ["Historic Site", "State Park", "Nature Preserve"], region: "Southeast" },
  "Oregon": { cuisine: ["Pacific Northwest", "Farm-to-Table", "Seafood", "Asian Fusion"], attractions: ["State Park", "Winery", "Brewery"], region: "Pacific Northwest" },
  "Michigan": { cuisine: ["American", "Steakhouse", "Farm-to-Table", "Gastropub"], attractions: ["State Park", "Winery", "Water Activity"], region: "Midwest" },
  "Wisconsin": { cuisine: ["American", "German", "Steakhouse", "Supper Club"], attractions: ["State Park", "Brewery", "Water Activity"], region: "Midwest" },
  "New York": { cuisine: ["American", "Italian", "Steakhouse", "Seafood"], attractions: ["Winery", "Historic Site", "Museum"], region: "Northeast" },
  "Hawaii": { cuisine: ["Hawaiian", "Asian Fusion", "Seafood", "Pacific Rim"], attractions: ["Beach", "Scenic Drive", "Nature Preserve"], region: "Pacific" },
  "Nevada": { cuisine: ["Steakhouse", "Italian", "Asian", "American"], attractions: ["Casino", "Show", "Desert Tour"], region: "West" },
  "Virginia": { cuisine: ["Southern", "Farm-to-Table", "Seafood", "American"], attractions: ["Historic Site", "Winery", "State Park"], region: "Mid-Atlantic" },
  "Massachusetts": { cuisine: ["Seafood", "American", "Italian", "Farm-to-Table"], attractions: ["Historic Site", "Museum", "Beach"], region: "New England" },
  "New Jersey": { cuisine: ["Italian", "Seafood", "American", "Steakhouse"], attractions: ["Beach", "Historic Site", "Shopping District"], region: "Mid-Atlantic" },
  "Pennsylvania": { cuisine: ["American", "Italian", "Farm-to-Table", "Steakhouse"], attractions: ["Historic Site", "State Park", "Museum"], region: "Mid-Atlantic" },
  "Colorado": { cuisine: ["American", "Farm-to-Table", "Steakhouse", "Southwestern"], attractions: ["Scenic Drive", "State Park", "Brewery"], region: "Mountain West" },
  "Illinois": { cuisine: ["American", "Steakhouse", "Italian", "BBQ"], attractions: ["Museum", "Historic Site", "Winery"], region: "Midwest" },
  "Washington": { cuisine: ["Pacific Northwest", "Seafood", "Asian Fusion", "Farm-to-Table"], attractions: ["State Park", "Winery", "Water Activity"], region: "Pacific Northwest" },
  "Tennessee": { cuisine: ["Southern", "BBQ", "American", "Hot Chicken"], attractions: ["Music Venue", "Historic Site", "Distillery"], region: "Southeast" },
  "Alabama": { cuisine: ["Southern", "BBQ", "Seafood", "Soul Food"], attractions: ["Historic Site", "State Park", "Museum"], region: "Southeast" },
  "Montana": { cuisine: ["American", "Steakhouse", "BBQ", "Farm-to-Table"], attractions: ["State Park", "Scenic Drive", "Nature Preserve"], region: "Mountain West" },
  "Idaho": { cuisine: ["American", "Steakhouse", "Farm-to-Table", "Mexican"], attractions: ["State Park", "Scenic Drive", "Hot Springs"], region: "Mountain West" },
  "Minnesota": { cuisine: ["American", "Scandinavian", "Steakhouse", "Gastropub"], attractions: ["State Park", "Water Activity", "Brewery"], region: "Midwest" },
  "Iowa": { cuisine: ["American", "Steakhouse", "Farm-to-Table", "BBQ"], attractions: ["State Park", "Historic Site", "Winery"], region: "Midwest" },
};

function getStateCuisines(state: string | null | undefined): string[] {
  if (state && STATE_CONTEXT[state]) return STATE_CONTEXT[state].cuisine;
  return CUISINE_TYPES.slice(0, 5);
}

function getStateAttractionTypes(state: string | null | undefined): string[] {
  if (state && STATE_CONTEXT[state]) return STATE_CONTEXT[state].attractions;
  return ATTRACTION_CATEGORIES.slice(0, 3);
}

function generateRestaurantName(courseId: number, index: number): string {
  const pattern = pick(RESTAURANT_NAME_PATTERNS, courseId, index * 7);
  const adj = pick(DINING_ADJECTIVES, courseId, index * 11);
  const noun = pick(DINING_NOUNS, courseId, index * 13);
  const name = pick(FIRST_NAMES, courseId, index * 17);
  const type = pick(["Grill", "Kitchen", "Bistro", "Tavern", "Restaurant"], courseId, index * 19);

  return pattern
    .replace("{adj}", adj)
    .replace("{noun}", noun)
    .replace("{name}", name)
    .replace("{type}", type);
}

function generateAttractionName(courseId: number, index: number, category: string, city: string | null | undefined, state: string | null | undefined): string {
  const location = city || state || "Local";
  switch (category) {
    case "State Park": return `${location} State Park`;
    case "Winery": {
      const adj = pick(["Hidden", "Rolling", "Valley", "Sunset", "Iron"], courseId, index * 23);
      const noun = pick(["Hills", "Creek", "Ridge", "Oaks", "Stone"], courseId, index * 29);
      return `${adj} ${noun} Winery`;
    }
    case "Historic Site": return `${location} Historic District`;
    case "Museum": return `${location} Heritage Museum`;
    case "Nature Preserve": return `${location} Nature Preserve`;
    case "Shopping District": return `${location} Town Center`;
    case "Brewery": {
      const adj = pick(["Iron", "Copper", "Golden", "Stone", "Old"], courseId, index * 31);
      return `${adj} Gate Brewing Company`;
    }
    case "Scenic Drive": return `${location} Scenic Byway`;
    case "Water Activity": return `${location} Kayak & Paddle`;
    default: return `${location} ${category}`;
  }
}

function generateGenericDining(course: CourseInput): DiningPOI[] {
  const restaurants: DiningPOI[] = [];
  const stateCuisines = getStateCuisines(course.state);
  const isResort = course.onSiteLodging || course.accessType?.toLowerCase()?.includes("resort");
  const numRestaurants = 3 + Math.floor(seededRandom(course.courseId, 200) * 3); // 3-5

  // If resort, add on-site restaurant first
  if (isResort) {
    const clubhouseName = course.facilityName
      ? `${course.facilityName.replace(/Golf.*$/i, "").trim()} Grille`
      : "The Clubhouse Grill";
    restaurants.push({
      name: clubhouseName,
      cuisineType: "American",
      priceLevel: "$$$",
      rating: generateRating(course.courseId, 100),
      distanceMiles: 0,
      description: `On-site dining at ${course.courseName} with views of the course. Classic American fare and craft cocktails.`,
      isOnSite: true,
      sortOrder: 0,
    });
  }

  for (let i = 0; i < numRestaurants; i++) {
    if (isResort && i === 0) continue; // skip first slot, already filled
    const cuisine = pick(stateCuisines, course.courseId, i * 3 + 300);
    const priceLevel = pick(["$$", "$$$", "$$", "$$$$"], course.courseId, i * 3 + 301);
    restaurants.push({
      name: generateRestaurantName(course.courseId, i),
      cuisineType: cuisine,
      priceLevel,
      rating: generateRating(course.courseId, i + 310),
      distanceMiles: generateDistance(course.courseId, i + 320, 1, 12),
      description: `Popular ${cuisine.toLowerCase()} restaurant near ${course.city || "the course"}. ${
        priceLevel === "$$$$" ? "Fine dining experience with an extensive wine list." :
        priceLevel === "$$$" ? "Elevated dining with locally-sourced ingredients." :
        "Casual atmosphere with great food and friendly service."
      }`,
      isOnSite: false,
      sortOrder: restaurants.length,
    });
  }

  return restaurants.slice(0, 5);
}

function generateGenericLodging(course: CourseInput): LodgingPOI[] {
  const lodging: LodgingPOI[] = [];
  const isResort = course.onSiteLodging || course.accessType?.toLowerCase()?.includes("resort");

  // On-site resort lodging
  if (isResort) {
    const resortName = course.resortNameField || `${course.courseName.replace(/Golf.*$/i, "").trim()} Resort`;
    lodging.push({
      name: resortName,
      lodgingType: "Golf Resort",
      priceTier: "$$$",
      avgPricePerNight: 250 + Math.round(seededRandom(course.courseId, 400) * 200),
      rating: generateRating(course.courseId, 401, 4.0, 4.8),
      distanceMiles: 0,
      description: `On-site accommodations at ${course.courseName} with direct course access and golf packages.`,
      isOnSite: true,
      isPartner: true,
      sortOrder: 0,
    });
  }

  // Add 2-3 nearby hotels
  const numHotels = 2 + Math.floor(seededRandom(course.courseId, 410) * 2);
  for (let i = 0; i < numHotels; i++) {
    const isChain = seededRandom(course.courseId, i + 420) > 0.4;
    if (isChain) {
      const chain = pick(HOTEL_CHAINS, course.courseId, i + 430);
      const location = course.city || "Local Area";
      lodging.push({
        name: `${chain.name} ${location}`,
        lodgingType: chain.type,
        priceTier: chain.tier,
        avgPricePerNight: chain.price + Math.round(seededRandom(course.courseId, i + 440) * 40 - 20),
        rating: generateRating(course.courseId, i + 450, 3.8, 4.5),
        distanceMiles: generateDistance(course.courseId, i + 460, 2, 15),
        description: `Comfortable ${chain.type.toLowerCase()} conveniently located near ${course.courseName}. Clean rooms and reliable service.`,
        isOnSite: false,
        isPartner: false,
        sortOrder: lodging.length,
      });
    } else {
      const boutique = pick(BOUTIQUE_HOTELS, course.courseId, i + 470);
      const location = course.city || "Countryside";
      lodging.push({
        name: `${boutique.adj} ${location} ${boutique.suffix}`,
        lodgingType: "Boutique Hotel",
        priceTier: "$$$",
        avgPricePerNight: 180 + Math.round(seededRandom(course.courseId, i + 480) * 120),
        rating: generateRating(course.courseId, i + 490, 4.0, 4.7),
        distanceMiles: generateDistance(course.courseId, i + 500, 3, 20),
        description: `Charming ${boutique.adj.toLowerCase()} accommodations near ${course.city || "the course"}. Personalized service and local character.`,
        isOnSite: false,
        isPartner: false,
        sortOrder: lodging.length,
      });
    }
  }

  return lodging.slice(0, 4);
}

function generateGenericAttractions(course: CourseInput): AttractionPOI[] {
  const attractions: AttractionPOI[] = [];
  const categories = getStateAttractionTypes(course.state);
  const numAttractions = 2 + Math.floor(seededRandom(course.courseId, 600) * 2); // 2-3

  for (let i = 0; i < numAttractions; i++) {
    const category = pick([...categories, ...ATTRACTION_CATEGORIES.slice(0, 4)], course.courseId, i + 610);
    const name = generateAttractionName(course.courseId, i, category, course.city, course.state);
    const distance = generateDistance(course.courseId, i + 620, 3, 25);
    attractions.push({
      name,
      category,
      description: generateAttractionDescription(category, course.city, course.state),
      distanceMiles: distance,
      rating: generateRating(course.courseId, i + 630),
      sortOrder: i,
    });
  }

  return attractions;
}

function generateAttractionDescription(category: string, city: string | null | undefined, state: string | null | undefined): string {
  const location = city || state || "the area";
  const descriptions: Record<string, string> = {
    "State Park": `Beautiful state park near ${location} with hiking trails, scenic views, and picnic areas.`,
    "Winery": `Award-winning winery near ${location} offering tastings, tours, and a lovely patio with vineyard views.`,
    "Historic Site": `Step back in time at this well-preserved historic site in ${location}. Guided tours available.`,
    "Museum": `Explore the cultural heritage and history of ${location} through engaging exhibits and collections.`,
    "Nature Preserve": `Pristine nature preserve near ${location} with trails, bird watching, and wildlife viewing opportunities.`,
    "Shopping District": `Charming shopping and dining district in ${location} with boutiques, galleries, and cafes.`,
    "Brewery": `Local craft brewery near ${location} with a rotating tap list, tours, and a relaxed taproom atmosphere.`,
    "Scenic Drive": `A stunning scenic drive through the countryside near ${location} with panoramic views.`,
    "Water Activity": `Kayaking, paddleboarding, and water sports near ${location}. Rentals and guided tours available.`,
    "Beach": `Beautiful beaches near ${location} perfect for relaxation, swimming, and sunset walks.`,
    "Spa & Wellness": `Luxurious spa experience near ${location} with a full menu of treatments and wellness programs.`,
  };
  return descriptions[category] || `A popular attraction near ${location} worth visiting during your golf trip.`;
}

function generateGenericRvPark(course: CourseInput): RvParkPOI[] {
  const distance = generateDistance(course.courseId, 700, 5, 20);
  const location = course.city || course.state || "Local Area";
  const parkType = pick(["State Park", "County Park", "RV Resort", "Campground"], course.courseId, 710);
  const adj = pick(["Shady", "Lakeside", "Pine", "Sunset", "Oak"], course.courseId, 720);

  let name: string;
  let description: string;
  let numSites: number;
  let hookups: string;
  let amenities: string;

  if (parkType === "RV Resort") {
    name = `${adj} Oaks RV Resort`;
    description = `Modern RV resort near ${location} with excellent amenities. Convenient base for golfers visiting ${course.courseName}.`;
    numSites = 80 + Math.round(seededRandom(course.courseId, 730) * 120);
    hookups = "Full (Water, Electric 30/50 AMP, Sewer)";
    amenities = "Pool, clubhouse, laundry, Wi-Fi, cable TV, playground";
  } else if (parkType === "State Park") {
    name = `${location} ${parkType} Campground`;
    description = `Scenic state park campground near ${location} with RV sites in a natural setting. Great outdoor activities.`;
    numSites = 50 + Math.round(seededRandom(course.courseId, 730) * 150);
    hookups = "Electric, Water";
    amenities = "Showers, restrooms, hiking trails, nature programs";
  } else {
    name = `${adj} ${pick(["Creek", "Pines", "Valley", "Lake", "Ridge"], course.courseId, 740)} ${parkType}`;
    description = `Well-maintained ${parkType.toLowerCase()} near ${location}. A comfortable stop for golfers traveling to ${course.courseName}.`;
    numSites = 40 + Math.round(seededRandom(course.courseId, 730) * 80);
    hookups = "Full (Water, Electric, Sewer)";
    amenities = "Showers, laundry, Wi-Fi, picnic areas";
  }

  return [{
    name,
    description,
    distanceMiles: distance,
    driveTimeMinutes: getDriveTime(distance),
    rating: generateRating(course.courseId, 750, 3.5, 4.5),
    priceLevel: pick(["$", "$$"], course.courseId, 760),
    numSites,
    hookups,
    amenities,
    sortOrder: 0,
  }];
}

// ── Main Export ──

export function generatePOIsForCourse(course: CourseInput): GeneratedPOIs {
  // Check for famous course override
  const normalizedName = course.courseName.toLowerCase().trim();
  const famousMatch = Object.keys(FAMOUS_COURSE_POIS).find(key =>
    normalizedName.includes(key) || key.includes(normalizedName)
  );

  if (famousMatch) {
    const famous = FAMOUS_COURSE_POIS[famousMatch];
    return {
      dining: famous.dining || generateGenericDining(course),
      lodging: famous.lodging || generateGenericLodging(course),
      attractions: famous.attractions || generateGenericAttractions(course),
      rvParks: famous.rvParks || generateGenericRvPark(course),
    };
  }

  return {
    dining: generateGenericDining(course),
    lodging: generateGenericLodging(course),
    attractions: generateGenericAttractions(course),
    rvParks: generateGenericRvPark(course),
  };
}
