// Stubbed Golf Genius/Golf Hub API client
// Returns sample event data for development

const GOLF_GENIUS_API_BASE = 'https://api.golfgenius.com/v1';

export interface GolfGeniusEvent {
  id: string;
  name: string;
  description: string;
  courseName: string;
  eventDate: string;
  endDate?: string;
  format: string;
  price: number;
  maxHandicap?: number;
  minHandicap?: number;
  registrationUrl: string;
  city: string;
  state: string;
}

export async function fetchGolfGeniusEvents(state?: string): Promise<GolfGeniusEvent[]> {
  if (process.env.GOLF_GENIUS_API_KEY) {
    // Real API call would go here
    // const res = await fetch(`${GOLF_GENIUS_API_BASE}/events?state=${state ?? ''}`, {
    //   headers: { Authorization: `Bearer ${process.env.GOLF_GENIUS_API_KEY}` },
    // });
    // return res.json();
  }

  // Return sample events for development
  return getSampleEvents(state);
}

function getSampleEvents(state?: string): GolfGeniusEvent[] {
  const now = new Date();

  const events: GolfGeniusEvent[] = [
    {
      id: 'gg-evt-001',
      name: 'Pebble Beach Pro-Am Charity Classic',
      description:
        'A two-day member-guest charity tournament benefiting local youth golf programs. Includes welcome reception, two rounds of golf, and awards dinner.',
      courseName: 'Pebble Beach Golf Links',
      eventDate: futureDate(now, 12),
      endDate: futureDate(now, 13),
      format: 'Member-Guest',
      price: 450,
      maxHandicap: 24,
      minHandicap: undefined,
      registrationUrl: 'https://www.pebblebeach.com/events/charity-classic',
      city: 'Pebble Beach',
      state: 'CA',
    },
    {
      id: 'gg-evt-002',
      name: 'Desert Scramble Showdown',
      description:
        'Four-person scramble format open to all skill levels. Prizes for longest drive, closest to pin, and top three teams. Lunch included.',
      courseName: 'Troon North Golf Club',
      eventDate: futureDate(now, 18),
      format: 'Scramble',
      price: 175,
      maxHandicap: undefined,
      minHandicap: undefined,
      registrationUrl: 'https://www.troonnorthgolf.com/events/scramble-showdown',
      city: 'Scottsdale',
      state: 'AZ',
    },
    {
      id: 'gg-evt-003',
      name: 'TPC Sawgrass Stroke Play Championship',
      description:
        'A 36-hole stroke play championship for low-handicap golfers. USGA handicap verification required. Flighted by handicap index.',
      courseName: 'TPC Sawgrass',
      eventDate: futureDate(now, 22),
      endDate: futureDate(now, 23),
      format: 'Stroke Play',
      price: 350,
      maxHandicap: 12,
      minHandicap: 0,
      registrationUrl: 'https://www.tpc.com/sawgrass/events/stroke-play',
      city: 'Ponte Vedra Beach',
      state: 'FL',
    },
    {
      id: 'gg-evt-004',
      name: 'Kiawah Island Match Play Invitational',
      description:
        'Single-elimination match play bracket. 32-player field with seeding based on handicap index. Three rounds over two days on the Ocean Course.',
      courseName: 'Kiawah Island Ocean Course',
      eventDate: futureDate(now, 30),
      endDate: futureDate(now, 31),
      format: 'Match Play',
      price: 500,
      maxHandicap: 18,
      minHandicap: 0,
      registrationUrl: 'https://www.kiawahresort.com/events/match-play',
      city: 'Kiawah Island',
      state: 'SC',
    },
    {
      id: 'gg-evt-005',
      name: 'Austin City Limits Charity Golf Classic',
      description:
        'Annual charity scramble supporting Folds of Honor. Celebrity guests, live music after play, and silent auction. Fun for all handicaps.',
      courseName: 'Barton Creek Resort - Fazio Foothills',
      eventDate: futureDate(now, 15),
      format: 'Scramble',
      price: 200,
      maxHandicap: undefined,
      minHandicap: undefined,
      registrationUrl: 'https://www.bartoncreek.com/events/charity-classic',
      city: 'Austin',
      state: 'TX',
    },
    {
      id: 'gg-evt-006',
      name: 'Pinehurst Resort Four-Ball Championship',
      description:
        'Two-person four-ball (better ball) format played on Pinehurst No. 2. Gross and net divisions. Includes practice round and gala dinner.',
      courseName: 'Pinehurst No. 2',
      eventDate: futureDate(now, 35),
      endDate: futureDate(now, 36),
      format: 'Four-Ball',
      price: 425,
      maxHandicap: 20,
      minHandicap: undefined,
      registrationUrl: 'https://www.pinehurst.com/events/four-ball',
      city: 'Pinehurst',
      state: 'NC',
    },
    {
      id: 'gg-evt-007',
      name: 'Torrey Pines Junior-Senior Classic',
      description:
        'Intergenerational two-person best ball event pairing junior golfers (under 18) with senior golfers (55+). Free entry — sponsored by the SCGA.',
      courseName: 'Torrey Pines South Course',
      eventDate: futureDate(now, 25),
      format: 'Best Ball',
      price: 0,
      maxHandicap: 36,
      minHandicap: undefined,
      registrationUrl: 'https://www.torreypinesgolf.com/events/junior-senior',
      city: 'La Jolla',
      state: 'CA',
    },
    {
      id: 'gg-evt-008',
      name: 'Bay Hill Couples Alternate Shot',
      description:
        'Mixed couples alternate shot tournament. Nine-hole format followed by brunch. Great for introducing partners to competitive golf.',
      courseName: 'Arnold Palmer\'s Bay Hill Club',
      eventDate: futureDate(now, 20),
      format: 'Alternate Shot',
      price: 150,
      maxHandicap: 30,
      minHandicap: undefined,
      registrationUrl: 'https://www.bayhill.com/events/couples-alt-shot',
      city: 'Orlando',
      state: 'FL',
    },
    {
      id: 'gg-evt-009',
      name: 'Scottsdale Open — Net Stroke Play',
      description:
        'Open net stroke play event with flights based on handicap index. 18-hole tournament with prizes for each flight. Cart and range included.',
      courseName: 'We-Ko-Pa Golf Club',
      eventDate: futureDate(now, 40),
      format: 'Stroke Play',
      price: 125,
      maxHandicap: 36,
      minHandicap: 10,
      registrationUrl: 'https://www.wekopa.com/events/scottsdale-open',
      city: 'Scottsdale',
      state: 'AZ',
    },
    {
      id: 'gg-evt-010',
      name: 'Harbour Town Heritage Skins Game',
      description:
        'Individual skins game on the iconic Harbour Town Golf Links. Each hole is worth increasing prize money. Low handicappers only — competitive field.',
      courseName: 'Harbour Town Golf Links',
      eventDate: futureDate(now, 45),
      format: 'Skins',
      price: 300,
      maxHandicap: 10,
      minHandicap: 0,
      registrationUrl: 'https://www.seapines.com/events/skins-game',
      city: 'Hilton Head Island',
      state: 'SC',
    },
  ];

  return state ? events.filter((e) => e.state === state) : events;
}

/** Helper to create a date string N days in the future */
function futureDate(from: Date, daysAhead: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}
