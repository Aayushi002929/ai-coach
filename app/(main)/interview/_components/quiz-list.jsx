"use client"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";  // make sure you import this

const QuizList = ({ assessments }) => {

  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="gradient-title text-3xl md:text-4xl">Recent Quizzes</CardTitle>
            <CardDescription>Review your past quiz performance</CardDescription>
          </div>
          <Button onClick={() => router.push("/interview/mock")}>Start New Quiz</Button>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {(Array.isArray(assessments) ? assessments : []).map((assessment, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>Quiz {i + 1}</CardTitle>
                  <CardDescription className="flex justify-between w-full">
                    <div>Score: {Number(assessment.quizScore).toFixed(1)}%</div>
                    <div>
                      {format(
                        new Date(assessment.createdAt),
                        "MMMM dd, yyyy HH:mm"
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                
                
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuizList;