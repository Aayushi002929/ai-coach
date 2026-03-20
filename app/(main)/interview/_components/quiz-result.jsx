export default function QuizResult({ result, onStartNew }) {
  return (
    <div>
      <h2>Quiz Result</h2>
      <p>Score: {result?.quizScore}</p>

      <button onClick={onStartNew}>
        Start New Quiz
      </button>
    </div>
  );
}