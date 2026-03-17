// Stubbed GHIN API client
// When GHIN_API_KEY is set, will make real API calls; otherwise returns mock data

const GHIN_API_BASE = 'https://api.ghin.com/api/v1';

interface GhinHandicapData {
  handicapIndex: number;
  lowIndex: number;
  highIndex: number;
  clubName: string;
  association: string;
  lastRevisionDate: string;
}

interface GhinRoundData {
  roundId: string;
  courseId: string;
  courseName: string;
  score: number;
  adjustedScore: number;
  differential: number;
  teeBoxName: string;
  courseRating: number;
  slopeRating: number;
  playDate: string;
  numHoles: number;
}

export async function fetchGhinHandicap(ghinNumber: string): Promise<GhinHandicapData> {
  if (process.env.GHIN_API_KEY) {
    // Real API call would go here
    // const res = await fetch(`${GHIN_API_BASE}/golfers/${ghinNumber}`, { headers: { Authorization: `Bearer ${process.env.GHIN_API_KEY}` } });
  }

  // Stubbed response
  return {
    handicapIndex: 14.2,
    lowIndex: 12.8,
    highIndex: 16.1,
    clubName: 'Pebble Beach Golf Links',
    association: 'NCGA',
    lastRevisionDate: new Date().toISOString(),
  };
}

export async function fetchGhinRounds(ghinNumber: string): Promise<GhinRoundData[]> {
  if (process.env.GHIN_API_KEY) {
    // Real API call
  }

  return [
    { roundId: 'r1', courseId: 'c1', courseName: 'Pebble Beach GL', score: 86, adjustedScore: 84, differential: 12.3, teeBoxName: 'Blue', courseRating: 72.8, slopeRating: 135, playDate: '2026-03-10', numHoles: 18 },
    { roundId: 'r2', courseId: 'c2', courseName: 'Spyglass Hill', score: 91, adjustedScore: 89, differential: 15.1, teeBoxName: 'White', courseRating: 71.2, slopeRating: 131, playDate: '2026-03-05', numHoles: 18 },
    { roundId: 'r3', courseId: 'c3', courseName: 'Spanish Bay', score: 83, adjustedScore: 82, differential: 10.7, teeBoxName: 'Blue', courseRating: 72.0, slopeRating: 129, playDate: '2026-02-28', numHoles: 18 },
  ];
}

export async function verifyGhinNumber(ghinNumber: string): Promise<{ valid: boolean; name?: string }> {
  if (process.env.GHIN_API_KEY) {
    // Real verification
  }
  return { valid: true, name: 'Test Golfer' };
}
