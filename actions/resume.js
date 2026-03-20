"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveResume(content) {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
    
      const user = await db.user.findUnique({
        where: {
          clerkUserId: userId,
        },
      });
    
      if (!user) throw new Error("User not found");

      try {
       const resume = await db.resume.upsert({
        where : {
            userId: user.id,
        },
        update: {
            content,
        },
        create: {
            userId: user.id,
            content,
        },
       });

       revalidatePath("/resume");
       return resume;
      } catch (error) {
        console.erroe("Error saving resume:", error.message);
        throw new Error("Failed to save resume");
      }
}

export async function getResume() {
    const {userId} = await auth();
    if(!userId) throw new Error("Unauthorised");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId},
    });
    if(!user) throw new Error("User not found");

    return await db.resume.findUnique({
        where: {
            userId: user.id,
        },
    });
}

export async function improvedWithAI({ current, type}) {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
    
      const user = await db.user.findUnique({
        where: {
          clerkUserId: userId,
        },
      });
    
      if (!user) throw new Error("User not found");
       const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;
 try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
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
    return text.trim();
  } catch (error) {
    console.error("Error improving resume content with AI:", error);
    throw new Error("Failed to improve content");
  }
}