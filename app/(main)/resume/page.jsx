
import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/ResumeBuilder";

const ResumePage = async () => {
  const resume = await getResume(); // server component can await

  return (
    <div className="container mx-auto py-6">
      <ResumeBuilder initialContent={resume?.content} /> {/* pass resume as prop */}
    </div>
  );
};

export default ResumePage;