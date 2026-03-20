import { db } from "../prisma";
import { inngest } from "./client";



export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  {  event: "test/industry.generate"  },
  async ({ step }) => {
    // 1. Fetch industries
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    // 2. Loop through industries
    for (const item of industries) {
      const industry = item.industry;

      const prompt = `
Return ONLY valid JSON. No explanation. No markdown.

Industry: ${industry}

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

      // 3. Call Gemini (FIXED URL)
      const res = await step.ai.wrap("gemini", async (p) => {
        const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: p }] }],
            }),
          }
        );

        const data = await response.json();
        console.log("Gemini RAW:", data); // 🔥 debug log

        return data;
      }, prompt);

      // 4. Safe extraction
      const text =
        res?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // 5. Safe JSON parse
      let insights;

      try {
        insights = JSON.parse(cleanedText);
      } catch (err) {
        console.error("Invalid JSON:", cleanedText);
        continue; // skip this industry, don't crash whole loop
      }

      // 6. Update DB safely
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.updateMany({
          where: { industry },
          data: {
            ...insights,
            lastUpdated: new Date(),
            nextUpdate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
          },
        });
      });
    }
  }
);

