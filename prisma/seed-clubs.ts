import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PILOT_CLUBS = [
  {
    name: "Rodeo Dunes Founders",
    slug: "rodeo-dunes-founders",
    type: "CLUB" as const,
    privacy: "SECRET" as const,
    description:
      "The founding members circle for Rodeo Dunes Golf Club. An exclusive community for charter members and founders.",
    verificationMethod: "ADMIN_MANUAL" as const,
    tiers: ["Founder", "Charter Member"],
  },
  {
    name: "Icon Golf",
    slug: "icon-golf",
    type: "CLUB" as const,
    privacy: "PRIVATE" as const,
    description:
      "The official Icon Golf members circle. Connect with fellow members, share experiences, and stay updated on events.",
    verificationMethod: "ADMIN_MANUAL" as const,
    tiers: ["Member"],
  },
  {
    name: "Epic Golf Club",
    slug: "epic-golf-club",
    type: "CLUB" as const,
    privacy: "PRIVATE" as const,
    description:
      "Epic Golf Club's member community. Share trip reviews, plan outings, and connect with members nationwide.",
    verificationMethod: "ADMIN_MANUAL" as const,
    tiers: ["Member"],
  },
];

async function main() {
  console.log("Seeding pilot club circles...");

  // Find the first user (Calvin or the first in the database)
  const owner = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "calvin@bdigitalpartners.com" },
        { email: { not: undefined } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!owner) {
    console.log("No users found in the database. Skipping seed.");
    return;
  }

  console.log(`Using owner: ${owner.name || owner.email} (${owner.id})`);

  for (const club of PILOT_CLUBS) {
    // Check if circle already exists (idempotent)
    const existing = await prisma.circle.findUnique({
      where: { slug: club.slug },
    });

    if (existing) {
      console.log(`Circle "${club.name}" already exists, skipping.`);
      continue;
    }

    const circle = await prisma.circle.create({
      data: {
        name: club.name,
        slug: club.slug,
        type: club.type,
        privacy: club.privacy,
        description: club.description,
        verificationMethod: club.verificationMethod,
        createdById: owner.id,
        members: {
          create: {
            userId: owner.id,
            role: "OWNER",
            membershipTier: club.tiers[0],
          },
        },
      },
    });

    console.log(`Created circle "${circle.name}" (${circle.id})`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
