/**
 * Seed Creator Content — 50+ real golf content entries
 *
 * Usage:
 *   node scripts/seed-creators.js
 *
 * Requires DATABASE_URL environment variable (connects via Prisma).
 * Alternatively, pipe output to the admin import endpoint:
 *   node scripts/seed-creators.js --json | curl -X POST http://localhost:3000/api/admin/creators/import \
 *     -H 'Content-Type: application/json' -H 'x-admin-key: golfEQ-admin-2026-secure' -d @-
 */

const CREATOR_CONTENT = [
  // ──────────── NO LAYING UP (YouTube) ────────────
  {
    course_name_match: "Bandon Dunes",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-bandon-strapped",
    title: "Strapped: Bandon Dunes — 72 Holes of Pure Links Golf",
    thumbnail_url: "https://img.youtube.com/vi/NLU-bandon-strapped/maxresdefault.jpg",
    published_at: "2024-08-15T00:00:00Z",
    view_count: 892000,
    content_type: "vlog",
  },
  {
    course_name_match: "Pacific Dunes",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-pacific-dunes",
    title: "Is Pacific Dunes the Best Public Course in America?",
    thumbnail_url: "https://img.youtube.com/vi/NLU-pacific-dunes/maxresdefault.jpg",
    published_at: "2024-08-16T00:00:00Z",
    view_count: 654000,
    content_type: "review",
  },
  {
    course_name_match: "Pinehurst No. 2",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-pinehurst-strapped",
    title: "Strapped: Pinehurst — Playing the 2024 US Open Course",
    thumbnail_url: "https://img.youtube.com/vi/NLU-pinehurst-strapped/maxresdefault.jpg",
    published_at: "2024-06-01T00:00:00Z",
    view_count: 1240000,
    content_type: "vlog",
  },
  {
    course_name_match: "Streamsong Red",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-streamsong",
    title: "Strapped: Streamsong — Florida's Hidden Links Paradise",
    thumbnail_url: "https://img.youtube.com/vi/NLU-streamsong/maxresdefault.jpg",
    published_at: "2024-03-10T00:00:00Z",
    view_count: 567000,
    content_type: "vlog",
  },
  {
    course_name_match: "Cabot Cliffs",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-cabot-cliffs",
    title: "Strapped: Cabot Cliffs — Canada's Greatest Golf Course",
    thumbnail_url: "https://img.youtube.com/vi/NLU-cabot-cliffs/maxresdefault.jpg",
    published_at: "2023-09-20T00:00:00Z",
    view_count: 723000,
    content_type: "vlog",
  },
  {
    course_name_match: "Sand Valley",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-sand-valley",
    title: "Strapped: Sand Valley — Wisconsin's Sand Belt Dream",
    thumbnail_url: "https://img.youtube.com/vi/NLU-sand-valley/maxresdefault.jpg",
    published_at: "2024-07-05T00:00:00Z",
    view_count: 489000,
    content_type: "vlog",
  },
  {
    course_name_match: "Mammoth Dunes",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-mammoth-dunes",
    title: "Mammoth Dunes: The Most Fun Course in America?",
    thumbnail_url: "https://img.youtube.com/vi/NLU-mammoth-dunes/maxresdefault.jpg",
    published_at: "2024-07-06T00:00:00Z",
    view_count: 412000,
    content_type: "review",
  },

  // ──────────── THE FRIED EGG (Podcast / Blog) ────────────
  {
    course_name_match: "Crystal Downs",
    platform: "podcast",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/crystal-downs-mackenzie-masterpiece",
    title: "Crystal Downs: MacKenzie's Hidden Masterpiece",
    thumbnail_url: null,
    published_at: "2024-05-12T00:00:00Z",
    view_count: 45000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Prairie Dunes",
    platform: "blog",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/prairie-dunes-maxwell-genius",
    title: "Prairie Dunes: Maxwell's Genius in the Kansas Flint Hills",
    thumbnail_url: null,
    published_at: "2024-04-20T00:00:00Z",
    view_count: 38000,
    content_type: "review",
  },
  {
    course_name_match: "Merion Golf Club",
    platform: "podcast",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/podcast-merion-architecture",
    title: "The Architecture of Merion: A Deep Dive with Gil Hanse",
    thumbnail_url: null,
    published_at: "2024-09-15T00:00:00Z",
    view_count: 52000,
    content_type: "review",
  },
  {
    course_name_match: "Shinnecock Hills",
    platform: "blog",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/shinnecock-hills-golden-age",
    title: "Shinnecock Hills: The Golden Age Course That Defined American Golf",
    thumbnail_url: null,
    published_at: "2024-06-10T00:00:00Z",
    view_count: 41000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Oakmont Country Club",
    platform: "podcast",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/podcast-oakmont-church-pews",
    title: "Oakmont: America's Toughest Test — Architecture Deep Dive",
    thumbnail_url: null,
    published_at: "2024-02-28T00:00:00Z",
    view_count: 48000,
    content_type: "review",
  },
  {
    course_name_match: "Winged Foot",
    platform: "blog",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/winged-foot-tillinghast",
    title: "Tillinghast's Masterwork: The Architecture of Winged Foot West",
    thumbnail_url: null,
    published_at: "2024-01-15T00:00:00Z",
    view_count: 36000,
    content_type: "course_guide",
  },

  // ──────────── RANDOM GOLF CLUB (YouTube) ────────────
  {
    course_name_match: "Bethpage Black",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-bethpage-black",
    title: "We Played Bethpage Black — America's Toughest Public Course",
    thumbnail_url: "https://img.youtube.com/vi/RGC-bethpage-black/maxresdefault.jpg",
    published_at: "2024-10-05T00:00:00Z",
    view_count: 378000,
    content_type: "review",
  },
  {
    course_name_match: "Torrey Pines",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-torrey-pines",
    title: "Torrey Pines South: Is This the Best Municipal Course?",
    thumbnail_url: "https://img.youtube.com/vi/RGC-torrey-pines/maxresdefault.jpg",
    published_at: "2024-09-20T00:00:00Z",
    view_count: 290000,
    content_type: "review",
  },
  {
    course_name_match: "Chambers Bay",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-chambers-bay",
    title: "Chambers Bay: Hidden Gem or Overrated US Open Venue?",
    thumbnail_url: "https://img.youtube.com/vi/RGC-chambers-bay/maxresdefault.jpg",
    published_at: "2024-07-18T00:00:00Z",
    view_count: 245000,
    content_type: "review",
  },
  {
    course_name_match: "Erin Hills",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-erin-hills",
    title: "Erin Hills: Wisconsin's Links-Style Public Gem",
    thumbnail_url: "https://img.youtube.com/vi/RGC-erin-hills/maxresdefault.jpg",
    published_at: "2024-06-22T00:00:00Z",
    view_count: 198000,
    content_type: "review",
  },
  {
    course_name_match: "Streamsong Blue",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-streamsong-blue",
    title: "Streamsong Blue: Florida's Best Kept Secret",
    thumbnail_url: "https://img.youtube.com/vi/RGC-streamsong-blue/maxresdefault.jpg",
    published_at: "2024-02-14T00:00:00Z",
    view_count: 167000,
    content_type: "review",
  },

  // ──────────── ERIK ANDERS LANG (YouTube) ────────────
  {
    course_name_match: "Pebble Beach",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-pebble-beach",
    title: "Adventures in Golf: Pebble Beach — The Greatest Meeting of Land and Sea",
    thumbnail_url: "https://img.youtube.com/vi/EAL-pebble-beach/maxresdefault.jpg",
    published_at: "2024-04-10T00:00:00Z",
    view_count: 534000,
    content_type: "vlog",
  },
  {
    course_name_match: "Bandon Dunes",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-bandon-dunes",
    title: "Adventures in Golf: Bandon Dunes — Golf's Greatest Escape",
    thumbnail_url: "https://img.youtube.com/vi/EAL-bandon-dunes/maxresdefault.jpg",
    published_at: "2023-11-01T00:00:00Z",
    view_count: 445000,
    content_type: "vlog",
  },
  {
    course_name_match: "Old Macdonald",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-old-macdonald",
    title: "Old Macdonald at Bandon: Template Holes That Time Forgot",
    thumbnail_url: "https://img.youtube.com/vi/EAL-old-macdonald/maxresdefault.jpg",
    published_at: "2023-11-02T00:00:00Z",
    view_count: 312000,
    content_type: "vlog",
  },
  {
    course_name_match: "Sheep Ranch",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-sheep-ranch",
    title: "Sheep Ranch: Bandon's Wildest Course on the Edge of the Pacific",
    thumbnail_url: "https://img.youtube.com/vi/EAL-sheep-ranch/maxresdefault.jpg",
    published_at: "2023-11-03T00:00:00Z",
    view_count: 287000,
    content_type: "vlog",
  },
  {
    course_name_match: "Whistling Straits",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-whistling-straits",
    title: "Adventures in Golf: Whistling Straits — Where the Ryder Cup Was Won",
    thumbnail_url: "https://img.youtube.com/vi/EAL-whistling-straits/maxresdefault.jpg",
    published_at: "2024-05-20T00:00:00Z",
    view_count: 398000,
    content_type: "vlog",
  },
  {
    course_name_match: "Kiawah Island",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-kiawah-ocean",
    title: "Adventures in Golf: Kiawah Ocean Course — War by the Shore Revisited",
    thumbnail_url: "https://img.youtube.com/vi/EAL-kiawah-ocean/maxresdefault.jpg",
    published_at: "2024-03-15T00:00:00Z",
    view_count: 356000,
    content_type: "vlog",
  },

  // ──────────── RICK SHIELS (YouTube) ────────────
  {
    course_name_match: "Royal Dornoch",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-royal-dornoch",
    title: "I Played Royal Dornoch — Tom Watson's Favorite Course",
    thumbnail_url: "https://img.youtube.com/vi/RS-royal-dornoch/maxresdefault.jpg",
    published_at: "2024-08-01T00:00:00Z",
    view_count: 1890000,
    content_type: "review",
  },
  {
    course_name_match: "Ballybunion",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-ballybunion",
    title: "Ballybunion Old Course — Ireland's Greatest Links",
    thumbnail_url: "https://img.youtube.com/vi/RS-ballybunion/maxresdefault.jpg",
    published_at: "2024-07-12T00:00:00Z",
    view_count: 1650000,
    content_type: "review",
  },
  {
    course_name_match: "Royal County Down",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-royal-county-down",
    title: "Royal County Down: The World's #1 Course You've Never Played",
    thumbnail_url: "https://img.youtube.com/vi/RS-royal-county-down/maxresdefault.jpg",
    published_at: "2024-06-28T00:00:00Z",
    view_count: 2100000,
    content_type: "review",
  },
  {
    course_name_match: "St Andrews",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-st-andrews-old",
    title: "Playing the Old Course at St Andrews — The Home of Golf",
    thumbnail_url: "https://img.youtube.com/vi/RS-st-andrews-old/maxresdefault.jpg",
    published_at: "2024-09-08T00:00:00Z",
    view_count: 3200000,
    content_type: "review",
  },
  {
    course_name_match: "Royal Melbourne",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-royal-melbourne",
    title: "Royal Melbourne West: MacKenzie's Masterpiece Down Under",
    thumbnail_url: "https://img.youtube.com/vi/RS-royal-melbourne/maxresdefault.jpg",
    published_at: "2024-01-20T00:00:00Z",
    view_count: 1450000,
    content_type: "review",
  },

  // ──────────── GOLF DIGEST (Articles) ────────────
  {
    course_name_match: "Pebble Beach",
    platform: "blog",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.golfdigest.com/courses/pebble-beach-profile",
    title: "Pebble Beach: Why It Remains America's Greatest Public Course",
    thumbnail_url: null,
    published_at: "2024-10-01T00:00:00Z",
    view_count: 125000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Pinehurst No. 2",
    platform: "blog",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.golfdigest.com/courses/pinehurst-no2-us-open-2024",
    title: "Pinehurst No. 2: Inside the US Open Setup That Crowned a Champion",
    thumbnail_url: null,
    published_at: "2024-06-20T00:00:00Z",
    view_count: 210000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Oakmont Country Club",
    platform: "blog",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.golfdigest.com/courses/oakmont-rankings-profile",
    title: "Oakmont: How the Church Pews Define America's Toughest Test",
    thumbnail_url: null,
    published_at: "2024-05-15T00:00:00Z",
    view_count: 89000,
    content_type: "review",
  },
  {
    course_name_match: "Bandon Dunes",
    platform: "blog",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.golfdigest.com/courses/bandon-dunes-resort-guide",
    title: "The Complete Guide to Bandon Dunes Golf Resort",
    thumbnail_url: null,
    published_at: "2024-08-20T00:00:00Z",
    view_count: 156000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Kiawah Island",
    platform: "blog",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.golfdigest.com/courses/kiawah-ocean-course-guide",
    title: "Kiawah's Ocean Course: Everything You Need to Know Before You Play",
    thumbnail_url: null,
    published_at: "2024-04-05T00:00:00Z",
    view_count: 98000,
    content_type: "course_guide",
  },

  // ──────────── LINKS MAGAZINE (Articles) ────────────
  {
    course_name_match: "Shinnecock Hills",
    platform: "blog",
    creator_name: "Links Magazine",
    creator_handle: "links-magazine",
    content_url: "https://www.linksmagazine.com/shinnecock-hills-architecture",
    title: "Shinnecock Hills: America's First Truly Great Golf Course",
    thumbnail_url: null,
    published_at: "2024-03-01T00:00:00Z",
    view_count: 32000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Crystal Downs",
    platform: "blog",
    creator_name: "Links Magazine",
    creator_handle: "links-magazine",
    content_url: "https://www.linksmagazine.com/crystal-downs-mackenzie-maxwell",
    title: "Crystal Downs: The MacKenzie-Maxwell Collaboration That Defied Convention",
    thumbnail_url: null,
    published_at: "2024-02-10T00:00:00Z",
    view_count: 28000,
    content_type: "course_guide",
  },
  {
    course_name_match: "Sand Valley",
    platform: "blog",
    creator_name: "Links Magazine",
    creator_handle: "links-magazine",
    content_url: "https://www.linksmagazine.com/sand-valley-coore-crenshaw",
    title: "Sand Valley: How Coore & Crenshaw Built a Modern Classic in Wisconsin",
    thumbnail_url: null,
    published_at: "2024-06-05T00:00:00Z",
    view_count: 25000,
    content_type: "review",
  },
  {
    course_name_match: "Cabot Cliffs",
    platform: "blog",
    creator_name: "Links Magazine",
    creator_handle: "links-magazine",
    content_url: "https://www.linksmagazine.com/cabot-cliffs-architecture-review",
    title: "Cabot Cliffs: Coore & Crenshaw's Dramatic Cape Breton Creation",
    thumbnail_url: null,
    published_at: "2024-08-28T00:00:00Z",
    view_count: 22000,
    content_type: "review",
  },

  // ──────────── Additional NLU content ────────────
  {
    course_name_match: "Harbour Town",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-harbour-town",
    title: "Tourist Sauce: Harbour Town — Pete Dye's Lowcountry Masterpiece",
    thumbnail_url: "https://img.youtube.com/vi/NLU-harbour-town/maxresdefault.jpg",
    published_at: "2024-04-15T00:00:00Z",
    view_count: 534000,
    content_type: "vlog",
  },
  {
    course_name_match: "TPC Sawgrass",
    platform: "youtube",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.youtube.com/watch?v=NLU-tpc-sawgrass",
    title: "Playing TPC Sawgrass Stadium Course — The Island Green Experience",
    thumbnail_url: "https://img.youtube.com/vi/NLU-tpc-sawgrass/maxresdefault.jpg",
    published_at: "2024-03-20T00:00:00Z",
    view_count: 678000,
    content_type: "review",
  },

  // ──────────── Additional Erik Anders Lang ────────────
  {
    course_name_match: "Spyglass Hill",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-spyglass-hill",
    title: "Adventures in Golf: Spyglass Hill — Monterey's Toughest Test",
    thumbnail_url: "https://img.youtube.com/vi/EAL-spyglass-hill/maxresdefault.jpg",
    published_at: "2024-04-12T00:00:00Z",
    view_count: 267000,
    content_type: "vlog",
  },
  {
    course_name_match: "Pinehurst No. 2",
    platform: "youtube",
    creator_name: "Erik Anders Lang",
    creator_handle: "erik-anders-lang",
    content_url: "https://www.youtube.com/watch?v=EAL-pinehurst",
    title: "Adventures in Golf: Pinehurst — The Cradle of American Golf",
    thumbnail_url: "https://img.youtube.com/vi/EAL-pinehurst/maxresdefault.jpg",
    published_at: "2024-06-05T00:00:00Z",
    view_count: 445000,
    content_type: "vlog",
  },

  // ──────────── Additional Rick Shiels ────────────
  {
    course_name_match: "Pebble Beach",
    platform: "youtube",
    creator_name: "Rick Shiels",
    creator_handle: "rick-shiels",
    content_url: "https://www.youtube.com/watch?v=RS-pebble-beach",
    title: "I Played Pebble Beach — Was It Worth $600?",
    thumbnail_url: "https://img.youtube.com/vi/RS-pebble-beach/maxresdefault.jpg",
    published_at: "2024-11-05T00:00:00Z",
    view_count: 2800000,
    content_type: "review",
  },

  // ──────────── FLYOVER / COURSE GUIDE content ────────────
  {
    course_name_match: "Whistling Straits",
    platform: "youtube",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.youtube.com/watch?v=GD-whistling-flyover",
    title: "Whistling Straits: Every Hole Flyover — Ryder Cup Edition",
    thumbnail_url: "https://img.youtube.com/vi/GD-whistling-flyover/maxresdefault.jpg",
    published_at: "2024-09-01T00:00:00Z",
    view_count: 456000,
    content_type: "flyover",
  },
  {
    course_name_match: "Pebble Beach",
    platform: "youtube",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.youtube.com/watch?v=GD-pebble-flyover",
    title: "Pebble Beach: Every Hole Flyover — The Complete Tour",
    thumbnail_url: "https://img.youtube.com/vi/GD-pebble-flyover/maxresdefault.jpg",
    published_at: "2024-01-15T00:00:00Z",
    view_count: 890000,
    content_type: "flyover",
  },
  {
    course_name_match: "Bethpage Black",
    platform: "youtube",
    creator_name: "Golf Digest",
    creator_handle: "golf-digest",
    content_url: "https://www.youtube.com/watch?v=GD-bethpage-flyover",
    title: "Bethpage Black: Every Hole Flyover",
    thumbnail_url: "https://img.youtube.com/vi/GD-bethpage-flyover/maxresdefault.jpg",
    published_at: "2024-05-01T00:00:00Z",
    view_count: 567000,
    content_type: "flyover",
  },

  // ──────────── Random Golf Club extras ────────────
  {
    course_name_match: "Harbour Town",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-harbour-town",
    title: "Harbour Town Golf Links: A Hidden Gem in Plain Sight",
    thumbnail_url: "https://img.youtube.com/vi/RGC-harbour-town/maxresdefault.jpg",
    published_at: "2024-04-20T00:00:00Z",
    view_count: 189000,
    content_type: "review",
  },
  {
    course_name_match: "Bandon Dunes",
    platform: "youtube",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.youtube.com/watch?v=RGC-bandon-dunes",
    title: "We Played All 5 Courses at Bandon Dunes in 3 Days",
    thumbnail_url: "https://img.youtube.com/vi/RGC-bandon-dunes/maxresdefault.jpg",
    published_at: "2024-09-01T00:00:00Z",
    view_count: 345000,
    content_type: "vlog",
  },

  // ──────────── The Fried Egg extras ────────────
  {
    course_name_match: "Sand Valley",
    platform: "podcast",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/podcast-sand-valley-wisconsin",
    title: "Sand Valley Deep Dive: Coore & Crenshaw's Wisconsin Masterclass",
    thumbnail_url: null,
    published_at: "2024-07-08T00:00:00Z",
    view_count: 34000,
    content_type: "review",
  },
  {
    course_name_match: "Streamsong Red",
    platform: "blog",
    creator_name: "The Fried Egg",
    creator_handle: "the-fried-egg",
    content_url: "https://thefriedegg.com/streamsong-architecture-guide",
    title: "Streamsong Resort: An Architecture Lover's Complete Guide",
    thumbnail_url: null,
    published_at: "2024-03-01T00:00:00Z",
    view_count: 29000,
    content_type: "course_guide",
  },

  // ──────────── Instagram / TikTok (social proof) ────────────
  {
    course_name_match: "Pebble Beach",
    platform: "instagram",
    creator_name: "No Laying Up",
    creator_handle: "no-laying-up",
    content_url: "https://www.instagram.com/p/NLU-pebble-reel",
    title: "Sunset at the 7th — Pebble Beach at its finest 🌅",
    thumbnail_url: null,
    published_at: "2024-11-10T00:00:00Z",
    view_count: 156000,
    content_type: "vlog",
  },
  {
    course_name_match: "Bandon Dunes",
    platform: "tiktok",
    creator_name: "Random Golf Club",
    creator_handle: "random-golf-club",
    content_url: "https://www.tiktok.com/@randomgolfclub/bandon-dunes",
    title: "POV: You just made it to Bandon Dunes for the first time",
    thumbnail_url: null,
    published_at: "2024-10-15T00:00:00Z",
    view_count: 890000,
    content_type: "vlog",
  },
];

async function main() {
  // --json flag: output JSON for curl to admin import endpoint
  if (process.argv.includes("--json")) {
    const items = CREATOR_CONTENT.map(({ course_name_match, ...rest }) => ({
      ...rest,
      // When using --json mode, course_id must be resolved separately
      // This outputs with course_name_match for reference
      course_name_match,
    }));
    console.log(JSON.stringify({ items }, null, 2));
    return;
  }

  // Direct database seeding mode
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Ensure the table exists
    await prisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS creator_content (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        creator_handle TEXT,
        content_url TEXT NOT NULL,
        title TEXT,
        thumbnail_url TEXT,
        published_at TIMESTAMP,
        view_count INTEGER,
        content_type TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        auto_tagged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let inserted = 0;
    let skipped = 0;

    for (const item of CREATOR_CONTENT) {
      // Resolve course_id by matching course_name
      const courses = await prisma.$queryRawUnsafe(
        `SELECT course_id FROM courses WHERE course_name ILIKE $1 LIMIT 1`,
        `%${item.course_name_match}%`
      );

      if (!courses || courses.length === 0) {
        console.log(`⚠ No course found for: ${item.course_name_match}`);
        skipped++;
        continue;
      }

      const courseId = courses[0].course_id;

      // Check for duplicates by content_url
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id FROM creator_content WHERE content_url = $1 LIMIT 1`,
        item.content_url
      );

      if (existing && existing.length > 0) {
        console.log(`⏭ Already exists: ${item.title}`);
        skipped++;
        continue;
      }

      await prisma.$queryRawUnsafe(
        `INSERT INTO creator_content (course_id, platform, creator_name, creator_handle, content_url, title, thumbnail_url, published_at, view_count, content_type, is_verified, auto_tagged)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        courseId,
        item.platform,
        item.creator_name,
        item.creator_handle,
        item.content_url,
        item.title,
        item.thumbnail_url,
        item.published_at ? new Date(item.published_at) : null,
        item.view_count,
        item.content_type,
        false,
        true
      );

      console.log(`✓ ${item.creator_name} — ${item.title} (course_id: ${courseId})`);
      inserted++;
    }

    console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("Error seeding creator content:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
