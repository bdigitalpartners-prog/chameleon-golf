/**
 * Course Intelligence Note Generation
 *
 * Generates structured intelligence notes from existing course data
 * using smart templating. No external API calls — purely rule-based.
 */

import { getSeasonInfo } from "./course-enrichment";

// ─── Types ───────────────────────────────────────────────────────────

export type NoteCategory =
  | "BEST_TIME_TO_VISIT"
  | "INSIDER_TIP"
  | "SIMILAR_COURSES"
  | "COURSE_STRATEGY"
  | "WHAT_TO_EXPECT"
  | "ACCESS_GUIDE";

export interface GeneratedNote {
  category: NoteCategory;
  title: string;
  content: string;
  icon: string;
}

export interface CourseForNotes {
  courseId: number;
  courseName: string;
  description?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  par?: number | null;
  yearOpened?: number | null;
  originalArchitect?: string | null;
  renovationArchitect?: string | null;
  renovationYear?: number | null;
  courseType?: string | null;
  accessType?: string | null;
  courseStyle?: string | null;
  greenFeeLow?: number | null;
  greenFeeHigh?: number | null;
  walkingPolicy?: string | null;
  dressCode?: string | null;
  caddieAvailability?: string | null;
  bestTimeToPlay?: string | null;
  bestMonths?: string[] | null;
  golfSeason?: string | null;
  howToGetOn?: string | null;
  courseStrategy?: string | null;
  whatToExpect?: string | null;
  insiderTips?: any;
  numHoles?: number | null;
  fairwayGrass?: string | null;
  greenGrass?: string | null;
  numListsAppeared?: number | null;
  // rankings for context
  rankings?: Array<{
    rankingList?: { listName?: string; publication?: string | null } | null;
    rankPosition?: number | null;
  }>;
}

// ─── Category Config ─────────────────────────────────────────────────

const CATEGORY_ICONS: Record<NoteCategory, string> = {
  BEST_TIME_TO_VISIT: "Calendar",
  INSIDER_TIP: "Lightbulb",
  SIMILAR_COURSES: "Map",
  COURSE_STRATEGY: "Flag",
  WHAT_TO_EXPECT: "Compass",
  ACCESS_GUIDE: "DollarSign",
};

// ─── Generators ──────────────────────────────────────────────────────

function generateBestTimeToVisit(course: CourseForNotes): GeneratedNote | null {
  const seasonInfo = getSeasonInfo(
    course.state,
    course.country,
    course.latitude ? Number(course.latitude) : null
  );

  if (!seasonInfo && !course.bestTimeToPlay) return null;

  const bestTime = course.bestTimeToPlay || seasonInfo?.bestTimeToPlay || "";
  const season = course.golfSeason || seasonInfo?.golfSeason || "";

  let content = bestTime;
  if (season && !content.includes(season)) {
    content += ` The golf season runs ${season}.`;
  }

  if (course.greenFeeLow && course.greenFeeHigh && Number(course.greenFeeHigh) > Number(course.greenFeeLow) * 1.3) {
    content += ` Off-peak rates can be significantly lower — check for twilight and shoulder-season pricing.`;
  }

  return {
    category: "BEST_TIME_TO_VISIT",
    title: "Best Time to Visit",
    content: content.trim(),
    icon: CATEGORY_ICONS.BEST_TIME_TO_VISIT,
  };
}

function generateInsiderTip(course: CourseForNotes): GeneratedNote | null {
  const tips: string[] = [];

  // Pull from existing insiderTips
  if (course.insiderTips) {
    const parsed = typeof course.insiderTips === "string"
      ? JSON.parse(course.insiderTips)
      : course.insiderTips;
    if (Array.isArray(parsed)) {
      tips.push(...parsed.filter((t: any) => typeof t === "string").slice(0, 2));
    }
  }

  // Walking policy tip
  if (course.walkingPolicy === "Walking Only") {
    tips.push("This is a walking-only course — plan accordingly and consider a caddie for the full experience.");
  } else if (course.walkingPolicy === "Unrestricted") {
    tips.push("Walking is unrestricted here. Walking the course gives you a more authentic experience of the layout.");
  }

  // Caddie tip
  if (course.caddieAvailability && course.caddieAvailability.toLowerCase().includes("available")) {
    tips.push("Caddies are available and highly recommended — local knowledge of the greens is invaluable.");
  }

  // Dress code tip
  if (course.dressCode && course.dressCode.toLowerCase().includes("strict")) {
    tips.push(`Dress code is enforced — ${course.dressCode.toLowerCase()}. Come prepared to avoid any issues at check-in.`);
  }

  // Renovation tip
  if (course.renovationArchitect && course.renovationYear && course.renovationYear >= 2015) {
    tips.push(`Recently renovated by ${course.renovationArchitect} in ${course.renovationYear} — expect modern conditioning with refreshed design elements.`);
  }

  // Grass type insight
  if (course.greenGrass) {
    const grass = course.greenGrass;
    if (grass.toLowerCase().includes("bent")) {
      tips.push("Bentgrass greens are fast and true — expect smooth, consistent putting surfaces.");
    } else if (grass.toLowerCase().includes("bermuda")) {
      tips.push("Bermuda greens have a distinctive grain — pay attention to grain direction on your putts.");
    } else if (grass.toLowerCase().includes("poa")) {
      tips.push("Poa annua greens can get bumpy in the afternoon — early tee times give the smoothest surfaces.");
    }
  }

  if (tips.length === 0) return null;

  return {
    category: "INSIDER_TIP",
    title: "Insider Tips",
    content: tips.slice(0, 3).join(" "),
    icon: CATEGORY_ICONS.INSIDER_TIP,
  };
}

function generateCourseStrategy(course: CourseForNotes): GeneratedNote | null {
  const strategies: string[] = [];

  // Use existing course strategy
  if (course.courseStrategy) {
    strategies.push(course.courseStrategy);
  }

  // Par-based strategy
  if (course.par) {
    if (course.par >= 72) {
      strategies.push("This is a full-length championship layout. Course management and avoiding big numbers are key to a good round.");
    } else if (course.par <= 70) {
      strategies.push("This shorter layout rewards accuracy over distance. Precision off the tee is more important than power.");
    }
  }

  // Course style strategy
  if (course.courseStyle) {
    const style = course.courseStyle.toLowerCase();
    if (style.includes("links")) {
      strategies.push("Links golf demands creativity — expect firm, fast conditions, wind as a constant factor, and run-up approaches to greens.");
    } else if (style.includes("parkland")) {
      strategies.push("Classic parkland layout with tree-lined fairways. Accuracy off the tee sets up scoring opportunities.");
    } else if (style.includes("desert")) {
      strategies.push("Desert golf demands target golf — find the fairway off the tee to avoid desert waste areas. Club up in the thin, dry air.");
    } else if (style.includes("heathland")) {
      strategies.push("Heathland courses reward well-positioned tee shots. Avoid the heather and gorse, and use the terrain to your advantage.");
    }
  }

  if (strategies.length === 0) return null;

  return {
    category: "COURSE_STRATEGY",
    title: "Course Strategy",
    content: strategies.slice(0, 2).join(" "),
    icon: CATEGORY_ICONS.COURSE_STRATEGY,
  };
}

function generateWhatToExpect(course: CourseForNotes): GeneratedNote | null {
  const sections: string[] = [];

  // Use existing whatToExpect
  if (course.whatToExpect) {
    sections.push(course.whatToExpect);
  }

  // Architect context
  if (course.originalArchitect && course.yearOpened) {
    const era = course.yearOpened < 1930 ? "Golden Age"
      : course.yearOpened < 1960 ? "mid-century"
      : course.yearOpened < 1990 ? "modern era"
      : "contemporary";
    sections.push(`Designed by ${course.originalArchitect} (${course.yearOpened}), this is a ${era} design.`);
  } else if (course.originalArchitect) {
    sections.push(`Designed by ${course.originalArchitect}.`);
  }

  // Rankings context
  if (course.rankings && course.rankings.length > 0) {
    const topRanking = course.rankings
      .filter((r) => r.rankPosition)
      .sort((a, b) => (a.rankPosition || 999) - (b.rankPosition || 999))[0];
    if (topRanking?.rankingList?.publication) {
      sections.push(`Ranked #${topRanking.rankPosition} by ${topRanking.rankingList.publication}. Expect a world-class experience.`);
    }
  }

  // Number of lists
  if (course.numListsAppeared && course.numListsAppeared >= 3) {
    sections.push(`Appearing on ${course.numListsAppeared} major ranking lists — this course is widely recognized among top golf destinations.`);
  }

  // Holes
  if (course.numHoles && course.numHoles !== 18) {
    sections.push(`This is a ${course.numHoles}-hole course.`);
  }

  if (sections.length === 0) return null;

  return {
    category: "WHAT_TO_EXPECT",
    title: "What to Expect",
    content: sections.slice(0, 3).join(" "),
    icon: CATEGORY_ICONS.WHAT_TO_EXPECT,
  };
}

function generateAccessGuide(course: CourseForNotes): GeneratedNote | null {
  const parts: string[] = [];

  // Access type
  const access = (course.accessType || "").toLowerCase();
  if (access.includes("private")) {
    parts.push("This is a private club. Access typically requires a member invitation or reciprocal arrangement.");
    if (course.howToGetOn) {
      parts.push(course.howToGetOn);
    }
  } else if (access.includes("resort")) {
    parts.push("Resort course — booking a stay at the affiliated resort is the easiest path to a tee time.");
    if (course.howToGetOn) {
      parts.push(course.howToGetOn);
    }
  } else if (access.includes("public") || access.includes("municipal")) {
    parts.push("Open to the public. Book tee times online or call the pro shop.");
  } else if (course.howToGetOn) {
    parts.push(course.howToGetOn);
  }

  // Green fees
  if (course.greenFeeLow || course.greenFeeHigh) {
    const low = course.greenFeeLow ? `$${Number(course.greenFeeLow).toFixed(0)}` : null;
    const high = course.greenFeeHigh ? `$${Number(course.greenFeeHigh).toFixed(0)}` : null;
    if (low && high && low !== high) {
      parts.push(`Green fees range from ${low} to ${high}.`);
    } else if (high) {
      parts.push(`Green fees are around ${high}.`);
    } else if (low) {
      parts.push(`Green fees start at ${low}.`);
    }
  }

  if (parts.length === 0) return null;

  return {
    category: "ACCESS_GUIDE",
    title: "Access & Green Fees",
    content: parts.slice(0, 3).join(" "),
    icon: CATEGORY_ICONS.ACCESS_GUIDE,
  };
}

// ─── Main Generation Function ────────────────────────────────────────

const GENERATORS: Array<(course: CourseForNotes) => GeneratedNote | null> = [
  generateBestTimeToVisit,
  generateInsiderTip,
  generateCourseStrategy,
  generateWhatToExpect,
  generateAccessGuide,
  // SIMILAR_COURSES is generated separately via a different mechanism
];

export function generateNotesForCourse(course: CourseForNotes): GeneratedNote[] {
  const notes: GeneratedNote[] = [];

  for (const gen of GENERATORS) {
    const note = gen(course);
    if (note) notes.push(note);
  }

  return notes;
}

export { CATEGORY_ICONS };
