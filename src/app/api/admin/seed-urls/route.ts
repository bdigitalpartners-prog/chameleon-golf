import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// One-time seed script to populate websiteUrl fields for Pebble Beach (courseId=484)
// DELETE this route after running it once
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (secret !== "seed-urls-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update Lodging websiteUrls
    const lodgingUpdates = [
      { name: "The Lodge at Pebble Beach", websiteUrl: "https://www.pebblebeach.com/accommodations/the-lodge-at-pebble-beach/", bookingUrl: "https://www.pebblebeach.com/accommodations/the-lodge-at-pebble-beach/" },
      { name: "Casa Palmero", websiteUrl: "https://www.pebblebeach.com/accommodations/casa-palmero-at-pebble-beach/", bookingUrl: "https://www.pebblebeach.com/accommodations/casa-palmero-at-pebble-beach/" },
      { name: "The Inn at Spanish Bay", websiteUrl: "https://www.pebblebeach.com/accommodations/the-inn-at-spanish-bay/", bookingUrl: "https://www.pebblebeach.com/accommodations/the-inn-at-spanish-bay/" },
      { name: "Hofsas House Hotel", websiteUrl: "https://www.hofsashouse.com", bookingUrl: "https://www.hofsashouse.com" },
      { name: "Laguna Seca Recreation Area", websiteUrl: "https://www.co.monterey.ca.us/government/government-links/parks/parks-facilities/laguna-seca-recreation-area", bookingUrl: null },
    ];

    for (const update of lodgingUpdates) {
      await prisma.courseNearbyLodging.updateMany({
        where: { courseId: 484, name: { contains: update.name.substring(0, 20) } },
        data: {
          websiteUrl: update.websiteUrl,
          ...(update.bookingUrl ? { bookingUrl: update.bookingUrl } : {}),
        },
      });
    }

    // Update Dining websiteUrls
    const diningUpdates = [
      { name: "The Tap Room", websiteUrl: "https://www.pebblebeach.com/dining/the-tap-room/" },
      { name: "The Bench", websiteUrl: "https://www.pebblebeach.com/dining/the-bench/" },
      { name: "Stillwater", websiteUrl: "https://www.pebblebeach.com/dining/stillwater/" },
      { name: "ppoli", websiteUrl: "https://www.pebblebeach.com/dining/peppoli/" },
      { name: "Roy", websiteUrl: "https://www.pebblebeach.com/dining/roys-at-pebble-beach/" },
    ];

    for (const update of diningUpdates) {
      await prisma.courseNearbyDining.updateMany({
        where: { courseId: 484, name: { contains: update.name } },
        data: { websiteUrl: update.websiteUrl },
      });
    }

    // Update Attraction websiteUrls
    const attractionUpdates = [
      { name: "17-Mile Drive", websiteUrl: "https://www.pebblebeach.com/17-mile-drive/" },
      { name: "Monterey Bay Aquarium", websiteUrl: "https://www.montereybayaquarium.org" },
      { name: "Carmel-by-the-Sea", websiteUrl: "https://www.carmelcalifornia.com" },
      { name: "Point Lobos", websiteUrl: "https://www.parks.ca.gov/pointlobos" },
      { name: "Cannery Row", websiteUrl: "https://canneryrow.com" },
      { name: "Big Sur", websiteUrl: "https://www.bigsurcalifornia.org" },
    ];

    for (const update of attractionUpdates) {
      await prisma.courseNearbyAttractions.updateMany({
        where: { courseId: 484, name: { contains: update.name } },
        data: { websiteUrl: update.websiteUrl },
      });
    }

    return NextResponse.json({ success: true, message: "Website URLs seeded for Pebble Beach (484)" });
  } catch (error: any) {
    console.error("Seed URLs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
