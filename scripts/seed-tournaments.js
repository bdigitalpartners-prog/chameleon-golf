/**
 * Seed Tournament History Data
 *
 * Usage:
 *   node scripts/seed-tournaments.js
 *
 * Requires DATABASE_URL environment variable (Postgres connection string).
 * Looks up courses by name and inserts tournament history records.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TOURNAMENTS = [
  // Augusta National — The Masters
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2024, winner_name: "Scottie Scheffler", winner_score: "-7", runner_up: "Ludvig Åberg", notable_moments: "Scheffler's second Green Jacket in three years" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2023, winner_name: "Jon Rahm", winner_score: "-12", runner_up: "Phil Mickelson, Brooks Koepka", notable_moments: "Rahm's first major, dominant wire-to-wire" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2022, winner_name: "Scottie Scheffler", winner_score: "-10", runner_up: "Rory McIlroy", notable_moments: "Scheffler's first major championship, world #1" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2021, winner_name: "Hideki Matsuyama", winner_score: "-10", runner_up: "Will Zalatoris", notable_moments: "First Japanese man to win a major championship" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2020, winner_name: "Dustin Johnson", winner_score: "-20", runner_up: "Cameron Smith, Sungjae Im", notable_moments: "Record score of 268; November Masters due to COVID" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 2019, winner_name: "Tiger Woods", winner_score: "-13", runner_up: "Dustin Johnson, Xander Schauffele, Brooks Koepka", notable_moments: "Tiger's legendary comeback, fifth Green Jacket, first major in 11 years" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 1997, winner_name: "Tiger Woods", winner_score: "-18", runner_up: "Tom Kite", notable_moments: "Tiger's record 12-shot victory at age 21, lowest score ever at The Masters" },
  { courseName: "Augusta National Golf Club", tournament_name: "The Masters", tour: "Major", year: 1986, winner_name: "Jack Nicklaus", winner_score: "-9", runner_up: "Tom Kite, Greg Norman", notable_moments: "Nicklaus at 46, oldest Masters winner, 'Yes Sir!' back nine 30" },

  // Pebble Beach
  { courseName: "Pebble Beach Golf Links", tournament_name: "AT&T Pebble Beach Pro-Am", tour: "PGA Tour", year: 2024, winner_name: "Wyndham Clark", winner_score: "-18", runner_up: "Eric Cole", notable_moments: "Clark's second PGA Tour victory" },
  { courseName: "Pebble Beach Golf Links", tournament_name: "AT&T Pebble Beach Pro-Am", tour: "PGA Tour", year: 2023, winner_name: "Justin Rose", winner_score: "-17", runner_up: "Brandon Wu", notable_moments: "Rose's 11th PGA Tour win" },
  { courseName: "Pebble Beach Golf Links", tournament_name: "U.S. Open", tour: "Major", year: 2019, winner_name: "Gary Woodland", winner_score: "-13", runner_up: "Brooks Koepka", notable_moments: "Woodland's stunning approach on 17 sealed the deal" },
  { courseName: "Pebble Beach Golf Links", tournament_name: "U.S. Open", tour: "Major", year: 2010, winner_name: "Graeme McDowell", winner_score: "E", runner_up: "Gregory Havret", notable_moments: "First Northern Irishman to win U.S. Open" },
  { courseName: "Pebble Beach Golf Links", tournament_name: "U.S. Open", tour: "Major", year: 2000, winner_name: "Tiger Woods", winner_score: "-12", runner_up: "Miguel Ángel Jiménez, Ernie Els", notable_moments: "Tiger won by a record 15 shots — the most dominant major performance in history" },
  { courseName: "Pebble Beach Golf Links", tournament_name: "U.S. Open", tour: "Major", year: 1982, winner_name: "Tom Watson", winner_score: "-6", runner_up: "Jack Nicklaus", notable_moments: "Watson's iconic chip-in on 17 from the rough" },

  // St Andrews — The Open Championship
  { courseName: "St Andrews Links - Old Course", tournament_name: "The Open Championship", tour: "Major", year: 2022, winner_name: "Cameron Smith", winner_score: "-20", runner_up: "Cameron Young", notable_moments: "Smith's 64 on Sunday, the 150th Open Championship" },
  { courseName: "St Andrews Links - Old Course", tournament_name: "The Open Championship", tour: "Major", year: 2015, winner_name: "Zach Johnson", winner_score: "-15", runner_up: "Marc Leishman, Louis Oosthuizen", notable_moments: "Won in a four-hole playoff" },
  { courseName: "St Andrews Links - Old Course", tournament_name: "The Open Championship", tour: "Major", year: 2010, winner_name: "Louis Oosthuizen", winner_score: "-16", runner_up: "Lee Westwood", notable_moments: "South African's dominant 7-shot victory" },
  { courseName: "St Andrews Links - Old Course", tournament_name: "The Open Championship", tour: "Major", year: 2005, winner_name: "Tiger Woods", winner_score: "-14", runner_up: "Colin Montgomerie", notable_moments: "Tiger's second Open at St Andrews, 10th major" },
  { courseName: "St Andrews Links - Old Course", tournament_name: "The Open Championship", tour: "Major", year: 2000, winner_name: "Tiger Woods", winner_score: "-19", runner_up: "Ernie Els, Thomas Bjørn", notable_moments: "Tiger completes career Grand Slam at 24" },

  // Pinehurst No. 2
  { courseName: "Pinehurst Resort & Country Club (No. 2)", tournament_name: "U.S. Open", tour: "Major", year: 2024, winner_name: "Bryson DeChambeau", winner_score: "-6", runner_up: "Rory McIlroy", notable_moments: "McIlroy's devastating three-putt on 18; DeChambeau's clutch bunker shot" },
  { courseName: "Pinehurst Resort & Country Club (No. 2)", tournament_name: "U.S. Open", tour: "Major", year: 2014, winner_name: "Martin Kaymer", winner_score: "-9", runner_up: "Rickie Fowler, Erik Compton", notable_moments: "Kaymer led wire-to-wire by 8 shots" },
  { courseName: "Pinehurst Resort & Country Club (No. 2)", tournament_name: "U.S. Women's Open", tour: "LPGA", year: 2014, winner_name: "Michelle Wie", winner_score: "-2", runner_up: "Stacy Lewis", notable_moments: "Back-to-back U.S. Opens at Pinehurst — men's and women's in consecutive weeks" },
  { courseName: "Pinehurst Resort & Country Club (No. 2)", tournament_name: "U.S. Open", tour: "Major", year: 2005, winner_name: "Michael Campbell", winner_score: "E", runner_up: "Tiger Woods", notable_moments: "Campbell upset Woods on the restored Donald Ross masterpiece" },
  { courseName: "Pinehurst Resort & Country Club (No. 2)", tournament_name: "U.S. Open", tour: "Major", year: 1999, winner_name: "Payne Stewart", winner_score: "-1", runner_up: "Phil Mickelson", notable_moments: "Stewart's iconic putt on 18; tragically died months later" },

  // TPC Sawgrass
  { courseName: "TPC Sawgrass", tournament_name: "THE PLAYERS Championship", tour: "PGA Tour", year: 2024, winner_name: "Scottie Scheffler", winner_score: "-20", runner_up: "Xander Schauffele", notable_moments: "Scheffler dominant from start to finish" },
  { courseName: "TPC Sawgrass", tournament_name: "THE PLAYERS Championship", tour: "PGA Tour", year: 2023, winner_name: "Scottie Scheffler", winner_score: "-17", runner_up: "Tyrrell Hatton", notable_moments: "First back-to-back PLAYERS winner since inception" },
  { courseName: "TPC Sawgrass", tournament_name: "THE PLAYERS Championship", tour: "PGA Tour", year: 2022, winner_name: "Cameron Smith", winner_score: "-13", runner_up: "Anirban Lahiri", notable_moments: "Smith's incredible final round 66 comeback" },

  // Royal Liverpool (Hoylake)
  { courseName: "Royal Liverpool Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2023, winner_name: "Brian Harman", winner_score: "-13", runner_up: "Jason Day, Tom Kim, Sepp Straka, Jon Rahm", notable_moments: "Harman's wire-to-wire victory at Hoylake" },
  { courseName: "Royal Liverpool Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2014, winner_name: "Rory McIlroy", winner_score: "-17", runner_up: "Rickie Fowler, Sergio Garcia", notable_moments: "McIlroy's dominant Open victory, third major" },
  { courseName: "Royal Liverpool Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2006, winner_name: "Tiger Woods", winner_score: "-18", runner_up: "Chris DiMarco", notable_moments: "Tiger's emotional victory weeks after his father's death" },

  // Valhalla
  { courseName: "Valhalla Golf Club", tournament_name: "PGA Championship", tour: "Major", year: 2024, winner_name: "Xander Schauffele", winner_score: "-21", runner_up: "Bryson DeChambeau", notable_moments: "Schauffele's first major championship" },
  { courseName: "Valhalla Golf Club", tournament_name: "PGA Championship", tour: "Major", year: 2014, winner_name: "Rory McIlroy", winner_score: "-16", runner_up: "Phil Mickelson", notable_moments: "McIlroy's second PGA Championship, fourth major" },
  { courseName: "Valhalla Golf Club", tournament_name: "Ryder Cup", tour: "Ryder Cup", year: 2008, winner_name: "USA", winner_score: "16½–11½", runner_up: "Europe", notable_moments: "USA's dominant victory, Boo Weekley's memorable charge" },

  // Whistling Straits
  { courseName: "Whistling Straits", tournament_name: "Ryder Cup", tour: "Ryder Cup", year: 2021, winner_name: "USA", winner_score: "19–9", runner_up: "Europe", notable_moments: "Record-breaking US victory, Stricker's emotional captaincy" },
  { courseName: "Whistling Straits", tournament_name: "PGA Championship", tour: "Major", year: 2015, winner_name: "Jason Day", winner_score: "-20", runner_up: "Jordan Spieth", notable_moments: "Day's record-breaking major score of 268" },
  { courseName: "Whistling Straits", tournament_name: "PGA Championship", tour: "Major", year: 2010, winner_name: "Martin Kaymer", winner_score: "-11", runner_up: "Bubba Watson", notable_moments: "Dustin Johnson's infamous bunker penalty on 18" },

  // Torrey Pines
  { courseName: "Torrey Pines Golf Course (South)", tournament_name: "U.S. Open", tour: "Major", year: 2021, winner_name: "Jon Rahm", winner_score: "-6", runner_up: "Louis Oosthuizen", notable_moments: "Rahm's birdie-birdie finish for first major" },
  { courseName: "Torrey Pines Golf Course (South)", tournament_name: "U.S. Open", tour: "Major", year: 2008, winner_name: "Tiger Woods", winner_score: "-1", runner_up: "Rocco Mediate", notable_moments: "Tiger won on a broken leg in a Monday 19-hole playoff" },
  { courseName: "Torrey Pines Golf Course (South)", tournament_name: "Farmers Insurance Open", tour: "PGA Tour", year: 2024, winner_name: "Matthieu Pavon", winner_score: "-16", runner_up: "Nicolai Højgaard", notable_moments: "Pavon becomes first French winner on PGA Tour in 100 years" },

  // Royal St George's
  { courseName: "Royal St George's Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2021, winner_name: "Collin Morikawa", winner_score: "-15", runner_up: "Jordan Spieth", notable_moments: "Morikawa's first Open Championship victory, debut at links" },
  { courseName: "Royal St George's Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2011, winner_name: "Darren Clarke", winner_score: "-5", runner_up: "Phil Mickelson, Dustin Johnson", notable_moments: "Clarke's emotional first major at 42, beloved by fans" },

  // Bethpage Black
  { courseName: "Bethpage State Park - Black Course", tournament_name: "PGA Championship", tour: "Major", year: 2019, winner_name: "Brooks Koepka", winner_score: "-8", runner_up: "Dustin Johnson", notable_moments: "Koepka held off DJ's Sunday charge" },
  { courseName: "Bethpage State Park - Black Course", tournament_name: "U.S. Open", tour: "Major", year: 2009, winner_name: "Lucas Glover", winner_score: "-4", runner_up: "Ricky Barnes, Phil Mickelson, David Duval", notable_moments: "Played in rain-soaked conditions all week" },
  { courseName: "Bethpage State Park - Black Course", tournament_name: "U.S. Open", tour: "Major", year: 2002, winner_name: "Tiger Woods", winner_score: "-3", runner_up: "Phil Mickelson", notable_moments: "First major at a public golf course in 30 years" },

  // Shinnecock Hills
  { courseName: "Shinnecock Hills Golf Club", tournament_name: "U.S. Open", tour: "Major", year: 2018, winner_name: "Brooks Koepka", winner_score: "+1", runner_up: "Tommy Fleetwood", notable_moments: "Brutal conditions, Phil's infamous putting green hit" },
  { courseName: "Shinnecock Hills Golf Club", tournament_name: "U.S. Open", tour: "Major", year: 2004, winner_name: "Retief Goosen", winner_score: "-4", runner_up: "Phil Mickelson", notable_moments: "Controversial Saturday setup, 7th green debacle" },

  // Muirfield
  { courseName: "Muirfield (The Honourable Company of Edinburgh Golfers)", tournament_name: "The Open Championship", tour: "Major", year: 2013, winner_name: "Phil Mickelson", winner_score: "-3", runner_up: "Henrik Stenson", notable_moments: "Mickelson's brilliant final round 66, first and only Open" },

  // Kiawah Island — Ocean Course
  { courseName: "Kiawah Island Golf Resort (Ocean Course)", tournament_name: "PGA Championship", tour: "Major", year: 2021, winner_name: "Phil Mickelson", winner_score: "-6", runner_up: "Brooks Koepka, Louis Oosthuizen", notable_moments: "Mickelson became oldest major winner at 50, electric crowds" },
  { courseName: "Kiawah Island Golf Resort (Ocean Course)", tournament_name: "PGA Championship", tour: "Major", year: 2012, winner_name: "Rory McIlroy", winner_score: "-13", runner_up: "David Lynn", notable_moments: "McIlroy's 8-shot romp, second major" },
  { courseName: "Kiawah Island Golf Resort (Ocean Course)", tournament_name: "Ryder Cup", tour: "Ryder Cup", year: 1991, winner_name: "USA", winner_score: "14½–13½", runner_up: "Europe", notable_moments: "The 'War on the Shore' — dramatic singles matches, Bernhard Langer's missed putt" },

  // Oakmont
  { courseName: "Oakmont Country Club", tournament_name: "U.S. Open", tour: "Major", year: 2016, winner_name: "Dustin Johnson", winner_score: "-4", runner_up: "Jim Furyk, Shane Lowry, Scott Piercy", notable_moments: "Controversial ball-movement ruling on 5th green" },

  // Olympic Club
  { courseName: "The Olympic Club (Lake Course)", tournament_name: "U.S. Open", tour: "Major", year: 2012, winner_name: "Webb Simpson", winner_score: "+1", runner_up: "Graeme McDowell, Michael Thompson", notable_moments: "Jim Furyk's late collapse, brutal conditions" },

  // Royal Portrush
  { courseName: "Royal Portrush Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2019, winner_name: "Shane Lowry", winner_score: "-15", runner_up: "Tommy Fleetwood", notable_moments: "Lowry's emotional victory in front of home fans in Northern Ireland" },

  // Winged Foot
  { courseName: "Winged Foot Golf Club (West)", tournament_name: "U.S. Open", tour: "Major", year: 2020, winner_name: "Bryson DeChambeau", winner_score: "-6", runner_up: "Matthew Wolff", notable_moments: "DeChambeau's power game conquered brutal Winged Foot" },

  // Southern Hills
  { courseName: "Southern Hills Country Club", tournament_name: "PGA Championship", tour: "Major", year: 2022, winner_name: "Justin Thomas", winner_score: "-5", runner_up: "Will Zalatoris", notable_moments: "Thomas came from 7 back on Sunday, won in playoff" },

  // Royal Troon
  { courseName: "Royal Troon Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2024, winner_name: "Xander Schauffele", winner_score: "-9", runner_up: "Justin Rose", notable_moments: "Schauffele's second major of the year" },
  { courseName: "Royal Troon Golf Club", tournament_name: "The Open Championship", tour: "Major", year: 2016, winner_name: "Henrik Stenson", winner_score: "-20", runner_up: "Phil Mickelson", notable_moments: "Greatest duel in Open history — Stenson 63 vs Mickelson 65 on Sunday" },
];

async function seedTournaments() {
  console.log("🏆 Seeding tournament history...\n");

  // Get all course names for matching
  const courses = await prisma.$queryRawUnsafe(
    `SELECT "courseId", "courseName" FROM courses`
  );
  const courseMap = new Map();
  for (const c of courses) {
    courseMap.set(c.courseName, c.courseId);
    // Also set partial/lowercase match
    courseMap.set(c.courseName.toLowerCase(), c.courseId);
  }

  let inserted = 0;
  let skipped = 0;

  for (const t of TOURNAMENTS) {
    // Try exact match first, then case-insensitive
    let courseId = courseMap.get(t.courseName) || courseMap.get(t.courseName.toLowerCase());

    // Try partial match
    if (!courseId) {
      const partial = t.courseName.split(" ").slice(0, 2).join(" ").toLowerCase();
      for (const [name, id] of courseMap.entries()) {
        if (typeof name === "string" && name.toLowerCase().includes(partial)) {
          courseId = id;
          break;
        }
      }
    }

    if (!courseId) {
      console.log(`  ⚠️  Course not found: "${t.courseName}" — skipping ${t.tournament_name} (${t.year})`);
      skipped++;
      continue;
    }

    try {
      await prisma.$queryRawUnsafe(
        `INSERT INTO course_tournaments (course_id, tournament_name, tour, year, winner_name, winner_score, runner_up, notable_moments, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'seed')
         ON CONFLICT (course_id, tournament_name, year) DO UPDATE SET
           winner_name = EXCLUDED.winner_name,
           winner_score = EXCLUDED.winner_score,
           runner_up = EXCLUDED.runner_up,
           notable_moments = EXCLUDED.notable_moments`,
        courseId, t.tournament_name, t.tour, t.year,
        t.winner_name, t.winner_score, t.runner_up, t.notable_moments
      );
      inserted++;
      console.log(`  ✅ ${t.tournament_name} (${t.year}) — ${t.winner_name}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${t.tournament_name} (${t.year}):`, err.message);
      skipped++;
    }
  }

  console.log(`\n🏁 Done: ${inserted} inserted, ${skipped} skipped out of ${TOURNAMENTS.length} total.`);
  await prisma.$disconnect();
}

seedTournaments().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
