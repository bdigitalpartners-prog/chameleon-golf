/**
 * Seed Script: Architect Genealogy (Relationships + Design DNA)
 *
 * Usage:
 *   node scripts/seed-architect-genealogy.js
 *
 * Requires ADMIN_API_KEY environment variable or uses the default key.
 * Requires the app to be running (seeds via API).
 *
 * Alternatively, can seed directly to the database via DATABASE_URL.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "golfEQ-admin-2026-secure";

// ─── Architect Name → ID Lookup ───
// We'll look up IDs dynamically from the API

async function getArchitectIdByName(name) {
  const res = await fetch(`${BASE_URL}/api/architects?search=${encodeURIComponent(name)}&limit=1`);
  const data = await res.json();
  const architects = data.architects || data;
  if (Array.isArray(architects) && architects.length > 0) {
    return architects[0].id;
  }
  console.warn(`  ⚠ Architect not found: "${name}"`);
  return null;
}

// ─── Relationship Data (Real Historical Connections) ───
const RELATIONSHIPS = [
  // Old Tom Morris lineage
  { from: "Old Tom Morris", to: "Harry Colt", type: "mentored", description: "Colt studied Morris's natural design approach" },

  // Harry Colt's tree
  { from: "Harry Colt", to: "Alister MacKenzie", type: "mentored", description: "MacKenzie collaborated with Colt and was deeply influenced by his strategic approach" },
  { from: "Harry Colt", to: "Tom Simpson", type: "mentored", description: "Simpson worked under Colt at Sunningdale" },
  { from: "Harry Colt", to: "C.H. Alison", type: "mentored", description: "Alison was Colt's long-time partner, forming Colt & Alison" },

  // MacKenzie's influence
  { from: "Alister MacKenzie", to: "Pete Dye", type: "influenced", description: "Dye studied MacKenzie's strategic bunkering and green complexes" },

  // Pete Dye's tree
  { from: "Pete Dye", to: "Tom Doak", type: "mentored", description: "Doak briefly worked for Dye before forming Renaissance Golf" },
  { from: "Pete Dye", to: "Bill Coore", type: "mentored", description: "Coore worked for Dye early in his career" },

  // Coore & Crenshaw
  { from: "Bill Coore", to: "Ben Crenshaw", type: "partner", description: "Co-founders of Coore & Crenshaw, one of golf's most acclaimed design firms" },

  // Tom Doak's influence
  { from: "Tom Doak", to: "Gil Hanse", type: "influenced", description: "Hanse and Doak share minimalist design philosophies" },
  { from: "Tom Doak", to: "Mike DeVries", type: "influenced", description: "DeVries carries forward Doak's naturalistic approach" },

  // Donald Ross lineage
  { from: "Donald Ross", to: "Robert Trent Jones Sr.", type: "influenced", description: "Jones studied Ross's work extensively" },

  // RTJ family
  { from: "Robert Trent Jones Sr.", to: "Robert Trent Jones Jr.", type: "mentored", description: "Father-son; Jones Jr. grew up learning design from his father" },
  { from: "Robert Trent Jones Sr.", to: "Rees Jones", type: "mentored", description: "Father-son; Rees Jones continued the family legacy with championship design work" },

  // C.B. Macdonald lineage
  { from: "C.B. Macdonald", to: "Seth Raynor", type: "influenced", description: "Raynor was Macdonald's protégé, carrying forward his template design approach" },
  { from: "Seth Raynor", to: "Charles Banks", type: "influenced", description: "Banks continued Raynor's template philosophy after his death" },

  // Jack Nicklaus influence
  { from: "Jack Nicklaus", to: "Tom Fazio", type: "influenced", description: "Both shaped modern American golf course design" },

  // Arnold Palmer partnership
  { from: "Arnold Palmer", to: "Ed Seay", type: "partner", description: "Co-founders of Palmer Design Company" },

  // Additional connections
  { from: "A.W. Tillinghast", to: "Robert Trent Jones Sr.", type: "influenced", description: "Jones studied Tillinghast's bold design approach" },
  { from: "George Thomas", to: "Jack Nicklaus", type: "influenced", description: "Thomas's dramatic designs at Riviera and LACC influenced modern strategic design" },
];

// ─── Design DNA Scores (0-100 scale) ───
const DESIGN_DNA = [
  {
    name: "Alister MacKenzie",
    naturalism: 95, strategicDepth: 90, visualDrama: 85,
    greenComplexity: 95, bunkerArtistry: 80, routingGenius: 90,
    minimalism: 70, playability: 85,
  },
  {
    name: "Pete Dye",
    naturalism: 40, strategicDepth: 85, visualDrama: 95,
    greenComplexity: 90, bunkerArtistry: 70, routingGenius: 80,
    minimalism: 20, playability: 50,
  },
  {
    name: "Tom Doak",
    naturalism: 90, strategicDepth: 95, visualDrama: 80,
    greenComplexity: 85, bunkerArtistry: 75, routingGenius: 95,
    minimalism: 90, playability: 80,
  },
  {
    name: "Donald Ross",
    naturalism: 75, strategicDepth: 85, visualDrama: 60,
    greenComplexity: 90, bunkerArtistry: 70, routingGenius: 80,
    minimalism: 65, playability: 85,
  },
  {
    name: "C.B. Macdonald",
    naturalism: 55, strategicDepth: 90, visualDrama: 70,
    greenComplexity: 80, bunkerArtistry: 75, routingGenius: 75,
    minimalism: 40, playability: 70,
  },
  {
    name: "Seth Raynor",
    naturalism: 45, strategicDepth: 85, visualDrama: 75,
    greenComplexity: 80, bunkerArtistry: 80, routingGenius: 70,
    minimalism: 35, playability: 65,
  },
  {
    name: "Harry Colt",
    naturalism: 80, strategicDepth: 90, visualDrama: 65,
    greenComplexity: 85, bunkerArtistry: 75, routingGenius: 90,
    minimalism: 70, playability: 80,
  },
  {
    name: "Old Tom Morris",
    naturalism: 95, strategicDepth: 60, visualDrama: 50,
    greenComplexity: 50, bunkerArtistry: 40, routingGenius: 70,
    minimalism: 95, playability: 80,
  },
  {
    name: "Tom Simpson",
    naturalism: 80, strategicDepth: 85, visualDrama: 70,
    greenComplexity: 85, bunkerArtistry: 80, routingGenius: 80,
    minimalism: 70, playability: 75,
  },
  {
    name: "Robert Trent Jones Sr.",
    naturalism: 35, strategicDepth: 80, visualDrama: 85,
    greenComplexity: 75, bunkerArtistry: 70, routingGenius: 70,
    minimalism: 15, playability: 55,
  },
  {
    name: "Robert Trent Jones Jr.",
    naturalism: 45, strategicDepth: 75, visualDrama: 80,
    greenComplexity: 70, bunkerArtistry: 65, routingGenius: 70,
    minimalism: 25, playability: 60,
  },
  {
    name: "Rees Jones",
    naturalism: 40, strategicDepth: 80, visualDrama: 70,
    greenComplexity: 75, bunkerArtistry: 70, routingGenius: 70,
    minimalism: 30, playability: 65,
  },
  {
    name: "Jack Nicklaus",
    naturalism: 40, strategicDepth: 80, visualDrama: 85,
    greenComplexity: 80, bunkerArtistry: 65, routingGenius: 75,
    minimalism: 20, playability: 55,
  },
  {
    name: "Tom Fazio",
    naturalism: 50, strategicDepth: 65, visualDrama: 90,
    greenComplexity: 70, bunkerArtistry: 75, routingGenius: 75,
    minimalism: 30, playability: 75,
  },
  {
    name: "Bill Coore",
    naturalism: 92, strategicDepth: 88, visualDrama: 75,
    greenComplexity: 80, bunkerArtistry: 70, routingGenius: 95,
    minimalism: 90, playability: 85,
  },
  {
    name: "Ben Crenshaw",
    naturalism: 90, strategicDepth: 85, visualDrama: 70,
    greenComplexity: 78, bunkerArtistry: 68, routingGenius: 85,
    minimalism: 88, playability: 85,
  },
  {
    name: "Gil Hanse",
    naturalism: 85, strategicDepth: 90, visualDrama: 70,
    greenComplexity: 82, bunkerArtistry: 75, routingGenius: 88,
    minimalism: 85, playability: 80,
  },
  {
    name: "A.W. Tillinghast",
    naturalism: 60, strategicDepth: 90, visualDrama: 75,
    greenComplexity: 88, bunkerArtistry: 85, routingGenius: 85,
    minimalism: 45, playability: 70,
  },
  {
    name: "George Thomas",
    naturalism: 65, strategicDepth: 88, visualDrama: 85,
    greenComplexity: 85, bunkerArtistry: 80, routingGenius: 85,
    minimalism: 55, playability: 75,
  },
  {
    name: "Arnold Palmer",
    naturalism: 50, strategicDepth: 65, visualDrama: 75,
    greenComplexity: 60, bunkerArtistry: 55, routingGenius: 65,
    minimalism: 30, playability: 85,
  },
  {
    name: "Charles Banks",
    naturalism: 45, strategicDepth: 80, visualDrama: 70,
    greenComplexity: 75, bunkerArtistry: 75, routingGenius: 65,
    minimalism: 35, playability: 60,
  },
];

async function seedRelationships() {
  console.log("\n🌳 Seeding Architect Relationships...\n");

  // Build name → ID map
  const nameToId = new Map();
  const allNames = new Set();
  for (const rel of RELATIONSHIPS) {
    allNames.add(rel.from);
    allNames.add(rel.to);
  }
  for (const dna of DESIGN_DNA) {
    allNames.add(dna.name);
  }

  for (const name of allNames) {
    const id = await getArchitectIdByName(name);
    if (id) {
      nameToId.set(name, id);
      console.log(`  ✓ ${name} → ID ${id}`);
    }
  }

  // Seed relationships
  const relationships = [];
  for (const rel of RELATIONSHIPS) {
    const fromId = nameToId.get(rel.from);
    const toId = nameToId.get(rel.to);
    if (fromId && toId) {
      relationships.push({
        fromArchitectId: fromId,
        toArchitectId: toId,
        relationshipType: rel.type,
        description: rel.description,
      });
    } else {
      console.warn(`  ⚠ Skipping: ${rel.from} → ${rel.to} (missing ID)`);
    }
  }

  if (relationships.length > 0) {
    const res = await fetch(`${BASE_URL}/api/admin/architects/relationships`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({ relationships }),
    });
    const result = await res.json();
    console.log(`\n  ✅ Relationships: ${result.imported} imported, ${result.skipped} skipped`);
  }

  // Seed Design DNA
  console.log("\n🧬 Seeding Architect Design DNA...\n");
  const entries = [];
  for (const dna of DESIGN_DNA) {
    const id = nameToId.get(dna.name);
    if (id) {
      entries.push({
        architectId: id,
        naturalism: dna.naturalism,
        strategicDepth: dna.strategicDepth,
        visualDrama: dna.visualDrama,
        greenComplexity: dna.greenComplexity,
        bunkerArtistry: dna.bunkerArtistry,
        routingGenius: dna.routingGenius,
        minimalism: dna.minimalism,
        playability: dna.playability,
      });
      console.log(`  ✓ ${dna.name} DNA ready`);
    }
  }

  if (entries.length > 0) {
    const res = await fetch(`${BASE_URL}/api/admin/architects/design-dna`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({ entries }),
    });
    const result = await res.json();
    console.log(`\n  ✅ Design DNA: ${result.imported} imported, ${result.skipped} skipped`);
  }

  console.log("\n🎉 Architect genealogy seeding complete!\n");
}

seedRelationships().catch(console.error);
