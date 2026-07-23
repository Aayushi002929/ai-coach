import { db } from "../prisma";
import { inngest } from "./client";

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

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { event: "test/industry.generate" },
  async ({ step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    for (const item of industries) {
      const industry = item.industry;

      const prompt = `
Return ONLY valid JSON. No explanation. No markdown.

Industry: ${industry}

IMPORTANT: "demandLevel" must be EXACTLY one of: "HIGH", "MEDIUM", "LOW".
IMPORTANT: "marketOutlook" must be EXACTLY one of: "POSITIVE", "NEUTRAL", "NEGATIVE".

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

      const res = await step.ai.wrap("gemini", async (p) => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: p }] }] }),
          }
        );
        const data = await response.json();
        console.log("Gemini RAW:", data);
        return data;
      }, prompt);

      const text = res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

      let insights;
      try {
        insights = JSON.parse(cleanedText);
      } catch (err) {
        console.error("Invalid JSON:", cleanedText);
        continue;
      }

      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.updateMany({
          where: { industry },
          data: {
            ...insights,
            demandLevel: normalizeDemandLevel(insights.demandLevel),
            marketOutlook: normalizeMarketOutlook(insights.marketOutlook),
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);