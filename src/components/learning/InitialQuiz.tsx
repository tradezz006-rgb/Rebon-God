import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useStruggleDetection } from "@/hooks/useStruggleDetection";

interface InitialQuizProps {
  level: string;
  onComplete: (score: number, maxScore: number) => void;
}

const quizData: Record<string, { question: string; options: string[]; correct: number }[]> = {
  beginner: [
    { question: "What is the correct greeting for a formal meeting?", options: ["Hey!", "Good morning, everyone.", "What's up?", "Yo!"], correct: 1 },
    { question: "Complete: 'I ___ to the office every day.'", options: ["go", "goes", "going", "gone"], correct: 0 },
    { question: "Which is more polite?", options: ["Give me that.", "Can you please pass that?", "I want that.", "That one."], correct: 1 },
    { question: "What does 'deadline' mean?", options: ["A phone line", "The last date to finish something", "A type of email", "A meeting room"], correct: 1 },
    { question: "Choose the correct sentence:", options: ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."], correct: 2 },
  ],
  moderate: [
    { question: "Which phrase best shows you're actively listening?", options: ["Whatever.", "I see what you mean.", "Okay.", "Next."], correct: 1 },
    { question: "Complete: 'If I ___ more time, I would finish the project.'", options: ["have", "had", "having", "has"], correct: 1 },
    { question: "What's the best way to disagree professionally?", options: ["You're wrong.", "I see your point, but I have a different perspective.", "That's stupid.", "No way."], correct: 1 },
    { question: "Which word means 'to make something better'?", options: ["Improve", "Worsen", "Ignore", "Delay"], correct: 0 },
    { question: "Choose the correct sentence:", options: ["The meeting has been postpone.", "The meeting has been postponed.", "The meeting have been postponed.", "The meeting has postponed."], correct: 1 },
  ],
  pro: [
    { question: "Which phrase demonstrates diplomatic disagreement in a board meeting?", options: ["That won't work.", "I appreciate that perspective; however, the data suggests otherwise.", "I disagree.", "Let me think about it."], correct: 1 },
    { question: "Complete: 'Had I known about the issue earlier, I ___ taken preventive measures.'", options: ["would have", "will have", "would", "have"], correct: 0 },
    { question: "What's the most effective way to handle a difficult question you can't answer?", options: ["Make up an answer.", "Say 'I don't know' and move on.", "Acknowledge the question, commit to follow up, and continue.", "Change the subject."], correct: 2 },
    { question: "Which word best describes 'a mutually beneficial outcome'?", options: ["Win-win", "Compromise", "Concession", "Victory"], correct: 0 },
    { question: "Choose the most concise version:", options: ["Due to the fact that we are experiencing delays...", "Because of delays...", "In light of the delays that we are currently experiencing...", "With respect to the delays we have..."], correct: 1 },
  ],
  ultra_pro: [
    { question: "In executive communication, what's the BLUF principle?", options: ["Bottom Line Up Front", "Best Logic Under Fire", "Build Links Using Facts", "Basic Leadership Unified Framework"], correct: 0 },
    { question: "Which rhetorical device involves using three parallel elements?", options: ["Anaphora", "Tricolon", "Antithesis", "Chiasmus"], correct: 1 },
    { question: "What's the most effective structure for delivering difficult feedback?", options: ["Criticism sandwich", "SBI (Situation-Behavior-Impact)", "Just be direct", "Email first, then discuss"], correct: 1 },
    { question: "In high-stakes negotiations, 'BATNA' refers to:", options: ["Best Alternative To Negotiated Agreement", "Basic Approach To Negotiation Analysis", "Bilateral Agreement Terms for New Alliances", "Business And Trade Negotiation Act"], correct: 0 },
    { question: "Which cognitive bias should communicators be most aware of when presenting data?", options: ["Confirmation bias", "Anchoring effect", "Availability heuristic", "All of the above"], correct: 3 },
  ],
};

const InitialQuiz = ({ level, onComplete }: InitialQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const { recordAttempt } = useStruggleDetection({
    taskId: `quiz_${currentQuestion}`,
    maxTimeSeconds: 45,
    maxAttempts: 2,
    context: { level, currentLesson: "Communication Initial Assessment Quiz", domain: "Communication" }
  });

  const questions = quizData[level] || quizData.beginner;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    const isCorrect = selectedAnswer === question.correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      recordAttempt();
    }
    setAnswers((prev) => [...prev, selectedAnswer]);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete(score + (selectedAnswer === question.correct ? 1 : 0), questions.length);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
          English Communication Quiz
        </h1>
        <p className="text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      <Progress value={progress} className="h-2 mb-8" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <h2 className="text-lg md:text-xl font-semibold mb-6 text-foreground">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  showResult
                    ? index === question.correct
                      ? "bg-success/20 border-success text-success"
                      : index === selectedAnswer
                      ? "bg-destructive/20 border-destructive text-destructive"
                      : "bg-secondary/50 text-muted-foreground"
                    : selectedAnswer === index
                    ? "bg-primary/20 border-primary text-foreground"
                    : "bg-secondary/50 hover:bg-secondary text-foreground"
                } border ${
                  selectedAnswer === index && !showResult ? "border-primary" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && index === question.correct && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {showResult && index === selectedAnswer && index !== question.correct && (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            {!showResult ? (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
              >
                Submit Answer
              </Button>
            ) : (
              <Button variant="hero" onClick={handleNext}>
                {currentQuestion < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Complete Quiz"
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score Display */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Current Score: <span className="text-primary font-bold">{score}</span> / {currentQuestion + (showResult ? 1 : 0)}
        </p>
      </div>
    </div>
  );
};

export default InitialQuiz;
