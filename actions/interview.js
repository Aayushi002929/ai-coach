"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function generateQuiz() {
    const { userId } = await auth();
        if(!userId) throw new Error("Unauthorized");
    
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
    
        if(!user)  throw new Error("User not found");

        try{

        

        const prompt = `
        Generate 1- technical interview questions for a ${
            user.industry
        } professional${
            user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
        }.
        
        Each question should be multiple choice with 4 options.
        
        Return the response in this JSON format only, no additional text:
        {
          "questions" : [
          {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswer": "string",
            "explanation":"string"}
            ]
            }
            `;

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
  const cleanedText = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

    const quiz = JSON.parse(cleanedText);
    return quiz.questions;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz questions");
        }
}

export async function saveQuizResult(questions, answers, score) {
    const { userId } = await auth();
        if(!userId) throw new Error("Unauthorized");
    
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const questionResults = questions.map((q,index) => ({
           question:q.question,
           answer:q.correctAnswer,
           userAnswer: answers[index],
           isCorrect: q.correctAnswer == answers[index],
           explanation: q.explanation,
        }));

        const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
        let improvementTip = null;

        if(wrongAnswers.length > 0) {
            const wrongQuestionText = wrongAnswers.map(
                (q) => 
                    `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
            )
            .join("\n\n");

            const improvementPrompt = `
            The user got the following ${user.industry} technical interview questions wrong:
            ${wrongQuestionText}
            Based on these mistaked, provide a concise, specific improvement tip.
            Focus on the knowledge gaps revealed by these wrong answers.
            Keep the response under 2 sentences and make it encouraging.
            Don't explicitly mention the mistakes, instead focus on what to learn/practice.
            `;

            try {
            const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: improvementPrompt}] }],
      }),
    }
  );

  const data = await res.json();

  improvementTip = (data.candidates?.[0]?.content?.parts?.[0]?.text).trim() || "{}";

            } 
             catch (error){
              console.error("Error generating improvement tip:", error);  
            }
        }

    try {
        const assessment = await db.assessment.create({
            data: {
                userId: user.id,
                quizScore: score,
                questions: questionResults,
                category: "Technical",
                improvementTip,
            },
        });

        return assessment;
    } catch (error) {
         console.error("Error saving quiz result:", error);
         throw new Error("Failed to save quiz result");
    }
}


export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

