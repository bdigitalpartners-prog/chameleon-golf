import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STARTER_PROMPTS = [
  {
    text: "Find me walkable courses near NYC",
    icon: "walk",
    category: "location",
  },
  {
    text: "Best public courses under $150",
    icon: "dollar",
    category: "value",
  },
  {
    text: "Links courses with ocean views",
    icon: "waves",
    category: "style",
  },
  {
    text: "Where should I play in Scotland?",
    icon: "globe",
    category: "travel",
  },
  {
    text: "Top-rated desert courses in Arizona",
    icon: "sun",
    category: "style",
  },
  {
    text: "Pete Dye courses I should visit",
    icon: "architect",
    category: "architect",
  },
  {
    text: "Affordable mountain courses in Colorado",
    icon: "mountain",
    category: "budget",
  },
  {
    text: "Best courses in the Southeast under $200",
    icon: "map",
    category: "region",
  },
];

export async function GET() {
  return NextResponse.json({ suggestions: STARTER_PROMPTS });
}
