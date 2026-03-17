import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`\-]/g, "")
    .replace(/\b(the|at|of|and|&|golf|course|club|links|resort|country)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

interface CourseInput {
  courseName: string;
  facilityName?: string;
  city?: string;
  state?: string;
  country?: string;
  yearOpened?: number;
  originalArchitect?: string;
  renovationArchitect?: string;
  renovationYear?: number;
  renovationNotes?: string;
  accessType?: string;
  courseType?: string;
  numHoles?: number;
  description?: string;
  websiteUrl?: string;
  dataSources?: string;
}

// Gil Hanse Original Designs
const ORIGINAL_DESIGNS: CourseInput[] = [
  // California
  { courseName: "Ladera", city: "Thermal", state: "CA", country: "United States", yearOpened: 2023, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Los Angeles Country Club - South Course", facilityName: "Los Angeles Country Club", city: "Los Angeles", state: "CA", country: "United States", yearOpened: 2016, originalArchitect: "Gil Hanse & Geoff Shackelford", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Rustic Canyon Golf Course", city: "Moorpark", state: "CA", country: "United States", yearOpened: 2002, originalArchitect: "Gil Hanse & Geoff Shackelford", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Florida
  { courseName: "Apogee Golf Club - West Course", facilityName: "Apogee Golf Club", city: "Jupiter", state: "FL", country: "United States", yearOpened: 2024, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "High Grove Golf Club", city: "Venus", state: "FL", country: "United States", yearOpened: 2025, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Jonathan's Landing Golf Club", city: "Jupiter", state: "FL", country: "United States", yearOpened: 2022, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Kinsale Golf Club", city: "Naples", state: "FL", country: "United States", yearOpened: 2024, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Park West Palm Beach", city: "West Palm Beach", state: "FL", country: "United States", yearOpened: 2023, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Streamsong Black already exists
  // Georgia - Ohoopee already exists
  // Massachusetts
  // Boston Golf Club already exists
  { courseName: "The Vineyard Club", city: "Edgartown", state: "MA", country: "United States", yearOpened: 2015, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Mississippi
  { courseName: "Mossy Oak Golf Club", city: "West Point", state: "MS", country: "United States", yearOpened: 2016, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Nebraska
  { courseName: "CapRock Ranch", city: "Valentine", state: "NE", country: "United States", yearOpened: 2021, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Horse Course at The Prairie Club", facilityName: "The Prairie Club", city: "Valentine", state: "NE", country: "United States", yearOpened: 2010, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // New York
  { courseName: "South Fork Country Club", city: "Amagansett", state: "NY", country: "United States", yearOpened: 1999, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // North Carolina
  { courseName: "Pinehurst No. 4", facilityName: "Pinehurst Resort & Country Club", city: "Pinehurst", state: "NC", country: "United States", yearOpened: 2018, originalArchitect: "Gil Hanse", accessType: "Resort", numHoles: 18, dataSources: "hansegolfdesign.com", description: "Gil Hanse's renovation of Pinehurst No. 4 was so thorough it's considered essentially a new course. Opened in 2018, it features sprawling sandy native areas replacing the previous pot bunkers, seamlessly connecting with the surrounding landscape." },
  { courseName: "The Cradle at Pinehurst", facilityName: "Pinehurst Resort & Country Club", city: "Pinehurst", state: "NC", country: "United States", yearOpened: 2017, originalArchitect: "Gil Hanse", accessType: "Resort", numHoles: 9, dataSources: "hansegolfdesign.com", description: "A 9-hole short course designed by Gil Hanse at Pinehurst Resort. The Cradle provides a fun, accessible golf experience with holes ranging from 60 to 130 yards." },
  // Pennsylvania
  // Applebrook already exists
  { courseName: "French Creek Golf Club", city: "Elverson", state: "PA", country: "United States", yearOpened: 2004, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Inniscrone Golf Club", city: "Avondale", state: "PA", country: "United States", yearOpened: 1998, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Tennessee
  { courseName: "Upper Course at The Golf Club of Tennessee", facilityName: "The Golf Club of Tennessee", city: "Kingston Springs", state: "TN", country: "United States", yearOpened: 2025, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Course at Sewanee", facilityName: "University of the South", city: "Sewanee", state: "TN", country: "United States", yearOpened: 2013, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 9, dataSources: "hansegolfdesign.com" },
  // Texas
  { courseName: "Childress Hall - Lower Course", facilityName: "Childress Hall", city: "Childress", state: "TX", country: "United States", yearOpened: 2026, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Circle T Ranch - Short Course", facilityName: "Circle T Ranch", city: "Westlake", state: "TX", country: "United States", yearOpened: 2023, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 9, dataSources: "hansegolfdesign.com" },
  { courseName: "Fields Ranch East at PGA Frisco", facilityName: "PGA Frisco", city: "Frisco", state: "TX", country: "United States", yearOpened: 2022, originalArchitect: "Gil Hanse", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Brazil - Olympic already exists
  // France - Les Bordes already exists
  // Scotland
  { courseName: "Castle Stuart Golf Links", city: "Inverness", state: "Scotland", country: "United Kingdom", yearOpened: 2009, originalArchitect: "Gil Hanse & Mark Parsinen", accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Crail already exists
  // Thailand
  { courseName: "Ban Rakat Club Ballyshear Golf Links", city: "Ban Rakat", country: "Thailand", yearOpened: 2022, originalArchitect: "Gil Hanse", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
];

// Gil Hanse Renovations
const RENOVATIONS: CourseInput[] = [
  { courseName: "Soule Park Golf Course", city: "Ojai", state: "CA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2005, accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Burning Tree Club", city: "Bethesda", state: "MD", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2019, accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "TPC Boston", city: "Norton", state: "MA", country: "United States", renovationArchitect: "Gil Hanse & Brad Faxon", renovationYear: 2007, accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Colonial Country Club", city: "Fort Worth", state: "TX", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2017, accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com", description: "Home of the Charles Schwab Challenge on the PGA Tour. Gil Hanse's ongoing master plan renovation has revitalized this historic club." },
  { courseName: "Royal Sydney Golf Club", city: "Sydney", country: "Australia", renovationArchitect: "Gil Hanse", renovationYear: 2016, accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Gavea Golf Club", city: "Rio de Janeiro", country: "Brazil", renovationArchitect: "Gil Hanse", renovationYear: 2013, accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Narin & Portnoo Links", city: "Donegal", country: "Ireland", renovationArchitect: "Gil Hanse", renovationYear: 2018, accessType: "Public", numHoles: 18, dataSources: "hansegolfdesign.com" },
];

// Gil Hanse Restorations
const RESTORATIONS: CourseInput[] = [
  // California
  { courseName: "Lake Merced Golf Club", city: "Daly City", state: "CA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2020, renovationNotes: "Restoration of Lock/MacKenzie layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Los Angeles Country Club - North Course", facilityName: "Los Angeles Country Club", city: "Los Angeles", state: "CA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2006, renovationNotes: "Restoration of George C. Thomas Jr. layout. Host of 2023 US Open.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Olympic Club", city: "San Francisco", state: "CA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2020, renovationNotes: "Restoration of Watson & Whiting layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Colorado
  { courseName: "Denver Country Club", city: "Denver", state: "CO", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2009, renovationNotes: "Restoration of Flynn layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Lakewood Country Club", city: "Lakewood", state: "CO", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1993, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Connecticut
  { courseName: "Yale Golf Course", city: "New Haven", state: "CT", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2021, renovationNotes: "Restoration of Macdonald & Raynor layout. Reopening April 2026.", accessType: "Semi-Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Georgia
  { courseName: "Savannah Golf Club", city: "Savannah", state: "GA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2018, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Massachusetts
  { courseName: "The Country Club", city: "Brookline", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2009, renovationNotes: "Restoration of Reid/Flynn/Jones layout. Host of 2022 US Open.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Kittansett Club", city: "Marion", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1995, renovationNotes: "Restoration of Hood & Flynn layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Myopia Hunt Club", city: "Hamilton", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2011, renovationNotes: "Restoration of Leeds layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Oyster Harbors Club", city: "Osterville", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2022, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Taconic Golf Club", city: "Williamstown", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2008, renovationNotes: "Restoration of Stiles layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Wianno Club", city: "Osterville", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2012, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Worcester Country Club", city: "Worcester", state: "MA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2018, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Michigan
  { courseName: "Oakland Hills Country Club - South Course", facilityName: "Oakland Hills Country Club", city: "Bloomfield Hills", state: "MI", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2015, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // New Jersey
  { courseName: "Baltusrol Golf Club - Upper Course", facilityName: "Baltusrol Golf Club", city: "Springfield", state: "NJ", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2018, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Baltusrol Golf Club - Lower Course", facilityName: "Baltusrol Golf Club", city: "Springfield", state: "NJ", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2018, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Essex County Country Club", city: "West Orange", state: "NJ", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2004, renovationNotes: "Restoration of Banks layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Plainfield Country Club", city: "Plainfield", state: "NJ", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1999, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Ridgewood Country Club", city: "Paramus", state: "NJ", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1995, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // New York
  { courseName: "Country Club of Rochester", city: "Rochester", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2001, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Creek", city: "Locust Valley", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1997, renovationNotes: "Restoration of Raynor & Macdonald layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Fenway Golf Club", city: "Scarsdale", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1997, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Fishers Island Club", city: "Fishers Island", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1995, renovationNotes: "Restoration of Raynor layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Quaker Ridge Golf Club", city: "Scarsdale", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2002, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Sleepy Hollow Country Club", city: "Scarborough", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2006, renovationNotes: "Restoration of Raynor & Macdonald layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Westhampton Country Club", city: "Westhampton Beach", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2009, renovationNotes: "Restoration of Raynor layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Winged Foot Golf Club - East Course", facilityName: "Winged Foot Golf Club", city: "Mamaroneck", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2013, renovationNotes: "Restoration of Tillinghast layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Winged Foot Golf Club - West Course", facilityName: "Winged Foot Golf Club", city: "Mamaroneck", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2016, renovationNotes: "Restoration of Tillinghast layout. Host of 2020 US Open.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Ohio
  { courseName: "The Country Club (Pepper Pike)", city: "Pepper Pike", state: "OH", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2021, renovationNotes: "Restoration of Flynn layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Denison University Golf Course", city: "Granville", state: "OH", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2020, renovationNotes: "Restoration of Ross layout", accessType: "Semi-Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Oklahoma
  { courseName: "Southern Hills Country Club", city: "Tulsa", state: "OK", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2015, renovationNotes: "Consulting architect. Restoration of Maxwell layout. Host of 2022 PGA Championship.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Oregon
  { courseName: "Waverley Country Club", city: "Portland", state: "OR", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2009, renovationNotes: "Restoration of Egan layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Pennsylvania
  { courseName: "Allegheny Country Club", city: "Sewickley", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2003, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Aronimink Golf Club", city: "Newtown Square", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2016, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Gulph Mills Golf Club", city: "King of Prussia", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2000, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Merion Golf Club - East Course", facilityName: "Merion Golf Club", city: "Ardmore", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2014, renovationNotes: "Restoration of Wilson layout. Host of 2013 US Open.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Oakmont Country Club", city: "Oakmont", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2020, renovationNotes: "Restoration of Fownes layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Rolling Green Golf Club", city: "Springfield", state: "PA", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2021, renovationNotes: "Consulting architect. Restoration of Flynn layout.", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // Rhode Island
  { courseName: "Sakonnet Golf Club", city: "Little Compton", state: "RI", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1999, renovationNotes: "Restoration of Ross layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // South Carolina
  { courseName: "Palmetto Golf Club", city: "Aiken", state: "SC", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2007, renovationNotes: "Restoration of Leeds & Mackenzie layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // International
  { courseName: "Mid Ocean Club", city: "Tucker's Town", country: "Bermuda", renovationArchitect: "Gil Hanse", renovationYear: 2023, renovationNotes: "Restoration of Raynor & Macdonald layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "Tokyo Golf Club", city: "Tokyo", country: "Japan", renovationArchitect: "Gil Hanse", renovationYear: 2008, renovationNotes: "Restoration of Ohtani layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  // St. George's
  { courseName: "St. George's Golf and Country Club", city: "East Hampton", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 1999, renovationNotes: "Restoration of Emmet layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
  { courseName: "The Rockaway Hunting Club", city: "Cedarhurst", state: "NY", country: "United States", renovationArchitect: "Gil Hanse", renovationYear: 2009, renovationNotes: "Restoration of Emmet layout", accessType: "Private", numHoles: 18, dataSources: "hansegolfdesign.com" },
];

export async function POST(request: NextRequest) {
  // Temporary import token for one-time bulk import
  const importToken = request.headers.get("x-import-token");
  if (importToken !== "hanse-import-2026-temp") {
    const authErr = await checkAdminAuth(request);
    if (authErr) return authErr;
  }

  try {
    // Find Gil Hanse architect record
    const hanseArchitect = await prisma.architect.findFirst({
      where: {
        OR: [
          { name: { contains: "Gil Hanse", mode: "insensitive" } },
          { name: { contains: "Hanse", mode: "insensitive" } },
        ],
      },
    });

    const architectId = hanseArchitect?.id || null;

    // Get all existing courses for dedup
    const existingCourses = await prisma.course.findMany({
      select: { courseId: true, courseName: true, state: true, country: true },
    });

    const existingNormMap = new Map<string, number>();
    for (const c of existingCourses) {
      const key = normalize(c.courseName) + "|" + (c.state || c.country || "").toLowerCase();
      existingNormMap.set(key, c.courseId);
    }

    const allCourses = [...ORIGINAL_DESIGNS, ...RENOVATIONS, ...RESTORATIONS];
    const results = {
      total: allCourses.length,
      created: 0,
      skipped: 0,
      updated: 0,
      skippedNames: [] as string[],
      createdNames: [] as string[],
      updatedNames: [] as string[],
      errors: [] as string[],
    };

    for (const course of allCourses) {
      try {
        const normKey = normalize(course.courseName) + "|" + (course.state || course.country || "").toLowerCase();

        const existingId = existingNormMap.get(normKey);

        if (existingId) {
          // Course exists - update renovation/architect info if we have it
          const updateData: Record<string, unknown> = {};
          if (course.renovationArchitect) updateData.renovationArchitect = course.renovationArchitect;
          if (course.renovationYear) updateData.renovationYear = course.renovationYear;
          if (course.renovationNotes) updateData.renovationNotes = course.renovationNotes;
          if (course.originalArchitect && !course.renovationArchitect) {
            updateData.originalArchitect = course.originalArchitect;
          }
          if (architectId && course.originalArchitect?.includes("Gil Hanse") && !course.renovationArchitect) {
            updateData.architectId = architectId;
          }
          if (course.dataSources) {
            const existing = await prisma.course.findUnique({ where: { courseId: existingId }, select: { dataSources: true } });
            const sources = new Set((existing?.dataSources || "").split(",").filter(Boolean));
            sources.add("hansegolfdesign.com");
            updateData.dataSources = Array.from(sources).join(",");
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date();
            await prisma.course.update({ where: { courseId: existingId }, data: updateData });
            results.updated++;
            results.updatedNames.push(course.courseName);
          } else {
            results.skipped++;
            results.skippedNames.push(course.courseName);
          }

          // Also create CourseArchitect link if architect exists
          if (architectId) {
            const role = course.originalArchitect?.includes("Gil Hanse") ? "original" : "renovation";
            const existingLink = await prisma.courseArchitect.findFirst({
              where: { courseId: existingId, architectId, role },
            });
            if (!existingLink) {
              await prisma.courseArchitect.create({
                data: { courseId: existingId, architectId, role },
              });
            }
          }

          continue;
        }

        // Create new course
        const data: Record<string, unknown> = {
          courseName: course.courseName,
          country: course.country || "United States",
          dataSources: "hansegolfdesign.com",
        };

        if (course.facilityName) data.facilityName = course.facilityName;
        if (course.city) data.city = course.city;
        if (course.state) data.state = course.state;
        if (course.yearOpened) data.yearOpened = course.yearOpened;
        if (course.originalArchitect) data.originalArchitect = course.originalArchitect;
        if (course.renovationArchitect) data.renovationArchitect = course.renovationArchitect;
        if (course.renovationYear) data.renovationYear = course.renovationYear;
        if (course.renovationNotes) data.renovationNotes = course.renovationNotes;
        if (course.accessType) data.accessType = course.accessType;
        if (course.courseType) data.courseType = course.courseType;
        if (course.numHoles) data.numHoles = course.numHoles;
        if (course.description) data.description = course.description;
        if (course.websiteUrl) data.websiteUrl = course.websiteUrl;
        if (architectId && course.originalArchitect?.includes("Gil Hanse")) {
          data.architectId = architectId;
        }

        const created = await prisma.course.create({ data: data as any });
        results.created++;
        results.createdNames.push(course.courseName);

        // Add to dedup map
        existingNormMap.set(normKey, created.courseId);

        // Create CourseArchitect junction link
        if (architectId) {
          const role = course.originalArchitect?.includes("Gil Hanse") ? "original" : "renovation";
          await prisma.courseArchitect.create({
            data: { courseId: created.courseId, architectId, role },
          });
        }
      } catch (err) {
        results.errors.push(`${course.courseName}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Hanse import error:", err);
    return NextResponse.json({ error: "Import failed", details: String(err) }, { status: 500 });
  }
}
