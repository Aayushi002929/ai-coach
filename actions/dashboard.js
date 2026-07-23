"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Normalize any AI-returned value to a value your Prisma enums actually accept
function normalizeDemandLevel(value) {
  const map = {
    HIGH: "HIGH",
    VERY_HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    MODERATE: "MEDIUM",
    LOW: "LOW",
    VERY_LOW: "LOW",
  };
  return map[value?.toUpperCase()] || "HIGH";
}

function normalizeMarketOutlook(value) {
  const map = {
    POSITIVE: "POSITIVE",
    VERY_POSITIVE: "POSITIVE",
    NEUTRAL: "NEUTRAL",
    NEGATIVE: "NEGATIVE",
    VERY_NEGATIVE: "NEGATIVE",
  };
  return map[value?.toUpperCase()] || "POSITIVE";
}

// Generate AI insights with safe fallback
export const generateAIInsights = async (industry) => {
  const prompt = `
Return ONLY valid JSON. No explanation. No markdown.

Industry: ${industry}

IMPORTANT: "demandLevel" must be EXACTLY one of these three strings: "HIGH", "MEDIUM", "LOW" (nothing else, no variations).
IMPORTANT: "marketOutlook" must be EXACTLY one of these three strings: "POSITIVE", "NEUTRAL", "NEGATIVE" (nothing else, no variations).

{
  "salaryRanges": [
    { "role": "Software Engineer", "min": 80000, "max": 160000, "median": 120000, "location": "Remote" }
  ],
  "growthRate": 10,
  "demandLevel": "HIGH",
  "topSkills": ["JavaScript"],
  "marketOutlook": "POSITIVE",
  "keyTrends": ["AI adoption"],
  "recommendedSkills": ["React"]
}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  console.log("AI RAW:", text);
  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let insights = {};
  try {
    insights = JSON.parse(cleanedText);
  } catch (err) {
    console.log("JSON ERROR:", err);
    insights = {}; // ensure fallback triggers
  }

  const safeInsights = {
    salaryRanges:
      insights.salaryRanges?.length > 0
        ? insights.salaryRanges
        : [
            { role: "Software Engineer", min: 80000, median: 120000, max: 160000, location: "Remote" },
            { role: "Data Scientist", min: 90000, median: 135000, max: 180000, location: "Remote" },
          ],

    growthRate: Number(insights.growthRate) || 8,

    // ✅ always mapped to a valid Prisma enum value now, never passed through raw
    demandLevel: normalizeDemandLevel(insights.demandLevel),
    marketOutlook: normalizeMarketOutlook(insights.marketOutlook),

    topSkills:
      insights.topSkills?.length > 0
        ? insights.topSkills
        : ["JavaScript", "React", "Node.js", "SQL"],

    keyTrends:
      insights.keyTrends?.length > 0
        ? insights.keyTrends
        : ["AI adoption", "Remote work", "Cloud computing"],

    recommendedSkills:
      insights.recommendedSkills?.length > 0
        ? insights.recommendedSkills
        : ["System Design", "DSA", "DevOps"],
  };

  return safeInsights;
};

// Fetch or generate industry insights
export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  // Generate if missing
  if (
    !user.industryInsight ||
    user.industryInsight.salaryRanges?.length === 0 ||
    user.industryInsight.topSkills?.length === 0 ||
    user.industryInsight.keyTrends?.length === 0 ||
    user.industryInsight.recommendedSkills?.length === 0
  ) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.upsert({
      where: {
        industry: user.industry,
      },
      update: {
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}