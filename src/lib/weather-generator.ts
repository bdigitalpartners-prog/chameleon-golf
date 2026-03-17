/**
 * Weather Data Generation Engine
 *
 * Uses OpenAI to generate monthly climate data for golf courses based on
 * their location, then computes a playability score for each month.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface MonthlyWeather {
  month: number; // 1-12
  avgHighF: number;
  avgLowF: number;
  avgPrecipInches: number;
  avgPrecipDays: number;
  avgSunnyDays: number;
  humidity: number;
  windSpeedMph: number;
  bestTimeOfDay: string | null;
}

export interface WeatherWithScore extends MonthlyWeather {
  playabilityScore: number;
}

export interface CourseLocationInput {
  courseId: number;
  courseName: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

/**
 * Compute playability score (0-100) based on weather conditions.
 *
 * Ideal: 60-80F, low rain, low wind, moderate humidity.
 * Penalize: extreme heat (>95F), cold (<45F), heavy rain, high wind.
 */
export function computePlayabilityScore(w: MonthlyWeather): number {
  let score = 100;

  // Temperature scoring (ideal range 60-80F)
  const avgTemp = (w.avgHighF + w.avgLowF) / 2;
  if (avgTemp >= 60 && avgTemp <= 80) {
    // Perfect range
  } else if (avgTemp > 80 && avgTemp <= 90) {
    score -= (avgTemp - 80) * 1.5;
  } else if (avgTemp > 90 && avgTemp <= 100) {
    score -= 15 + (avgTemp - 90) * 2.5;
  } else if (avgTemp > 100) {
    score -= 40 + (avgTemp - 100) * 3;
  } else if (avgTemp >= 50 && avgTemp < 60) {
    score -= (60 - avgTemp) * 1;
  } else if (avgTemp >= 40 && avgTemp < 50) {
    score -= 10 + (50 - avgTemp) * 2;
  } else if (avgTemp < 40) {
    score -= 30 + (40 - avgTemp) * 3;
  }

  // High temperature extremes
  if (w.avgHighF > 95) score -= (w.avgHighF - 95) * 2;
  if (w.avgLowF < 35) score -= (35 - w.avgLowF) * 1.5;

  // Precipitation penalty
  if (w.avgPrecipInches > 1) score -= Math.min((w.avgPrecipInches - 1) * 3, 20);
  if (w.avgPrecipDays > 8) score -= Math.min((w.avgPrecipDays - 8) * 1.5, 15);

  // Wind penalty (ideal < 10mph)
  if (w.windSpeedMph > 10) score -= Math.min((w.windSpeedMph - 10) * 1.5, 15);

  // Humidity penalty (ideal 30-60%)
  if (w.humidity > 70) score -= Math.min((w.humidity - 70) * 0.5, 10);

  // Sunny days bonus
  if (w.avgSunnyDays >= 20) {
    score += 3;
  } else if (w.avgSunnyDays < 10) {
    score -= Math.min((10 - w.avgSunnyDays) * 1, 8);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Call OpenAI to generate monthly weather data for a golf course location.
 */
export async function generateWeatherData(
  course: CourseLocationInput
): Promise<WeatherWithScore[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const locationParts = [course.city, course.state, course.country].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Unknown location";

  const latLon =
    course.latitude && course.longitude
      ? ` (latitude: ${course.latitude}, longitude: ${course.longitude})`
      : "";

  const prompt = `Generate realistic monthly average climate data for the location of ${course.courseName} in ${locationStr}${latLon}.

Return a JSON array with exactly 12 objects (one per month, January=1 through December=12). Each object must have these exact fields:
- month: number (1-12)
- avgHighF: number (average high temperature in Fahrenheit)
- avgLowF: number (average low temperature in Fahrenheit)
- avgPrecipInches: number (average precipitation in inches, 1 decimal)
- avgPrecipDays: number (average number of rainy days)
- avgSunnyDays: number (average number of sunny/mostly sunny days)
- humidity: number (average relative humidity percentage, 0-100)
- windSpeedMph: number (average wind speed in mph, 1 decimal)
- bestTimeOfDay: string (best time for golf, e.g. "Early morning" or "Mid-morning" or "Afternoon" or null if unplayable)

Base data on real climate patterns for this geographic location. Be accurate to the specific microclimate.

Return ONLY the JSON array, no markdown, no explanation.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a meteorological data assistant. Return only valid JSON arrays with accurate climate data. No markdown formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  // Parse JSON — handle potential markdown code fences
  let cleanContent = content;
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let months: MonthlyWeather[];
  try {
    months = JSON.parse(cleanContent);
  } catch {
    throw new Error(`Failed to parse OpenAI response as JSON: ${cleanContent.slice(0, 200)}`);
  }

  if (!Array.isArray(months) || months.length !== 12) {
    throw new Error(`Expected 12 months, got ${Array.isArray(months) ? months.length : "non-array"}`);
  }

  return months.map((m) => {
    const validated: MonthlyWeather = {
      month: Number(m.month),
      avgHighF: Number(m.avgHighF),
      avgLowF: Number(m.avgLowF),
      avgPrecipInches: Number(m.avgPrecipInches),
      avgPrecipDays: Number(m.avgPrecipDays),
      avgSunnyDays: Number(m.avgSunnyDays),
      humidity: Number(m.humidity),
      windSpeedMph: Number(m.windSpeedMph),
      bestTimeOfDay: m.bestTimeOfDay || null,
    };

    if (validated.month < 1 || validated.month > 12) throw new Error(`Invalid month: ${validated.month}`);
    if (validated.avgHighF < -40 || validated.avgHighF > 140) throw new Error(`Invalid avgHighF: ${validated.avgHighF}`);
    if (validated.avgLowF < -60 || validated.avgLowF > 120) throw new Error(`Invalid avgLowF: ${validated.avgLowF}`);

    return {
      ...validated,
      playabilityScore: computePlayabilityScore(validated),
    };
  });
}
