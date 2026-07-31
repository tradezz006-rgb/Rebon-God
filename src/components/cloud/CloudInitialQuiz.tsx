import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useStruggleDetection } from "@/hooks/useStruggleDetection";

interface CloudInitialQuizProps {
  level: string;
  onComplete: (score: number, maxScore: number) => void;
}

interface Question {
  id: string;
  question: string;
  type: "multiple_choice" | "code";
  options?: string[];
  correctIndex?: number;
  explanation: string;
}

const getQuestionsByLevel = (level: string): Question[] => {
  const baseQuestions: Question[] = [
    {
      id: "q1",
      question: "What does AWS stand for?",
      type: "multiple_choice",
      options: [
        "Amazon Web Services",
        "Advanced Web Server",
        "Automated Web Systems",
        "Application Web Storage",
      ],
      correctIndex: 0,
      explanation:
        "AWS stands for Amazon Web Services — the most widely adopted cloud platform worldwide.",
    },
    {
      id: "q2",
      question: "Which AWS region is physically located in India (Mumbai)?",
      type: "multiple_choice",
      options: ["us-east-1", "ap-south-1", "eu-central-1", "ap-southeast-1"],
      correctIndex: 1,
      explanation:
        "ap-south-1 is Mumbai — lowest latency for Indian users.",
    },
    {
      id: "q3",
      question: "What is an IP address?",
      type: "multiple_choice",
      options: [
        "A physical address of a data center",
        "A unique numerical label assigned to devices connected to a network",
        "A type of cloud server",
        "A secure password for server access",
      ],
      correctIndex: 1,
      explanation:
        "An IP address uniquely identifies a device on a network — the internet’s addressing system.",
    },
  ];

  const intermediateQuestions: Question[] = [
    {
      id: "q4",
      question: "What is the primary function of DNS?",
      type: "multiple_choice",
      options: [
        "To encrypt web traffic",
        "To translate human-readable domain names into IP addresses",
        "To store website databases",
        "To prevent DDoS attacks",
      ],
      correctIndex: 1,
      explanation:
        "DNS is the phonebook of the internet — names become addresses.",
    },
    {
      id: "q5",
      question: "What is the main difference between HTTP and HTTPS?",
      type: "multiple_choice",
      options: [
        "HTTPS is faster than HTTP",
        "HTTPS uses encryption to secure data, HTTP does not",
        "HTTP is for websites, HTTPS is for mobile apps",
        "There is no difference",
      ],
      correctIndex: 1,
      explanation: "The S in HTTPS means Secure — TLS encrypts the traffic.",
    },
  ];

  const advancedQuestions: Question[] = [
    {
      id: "q6",
      question: "What is an AWS VPC?",
      type: "multiple_choice",
      options: [
        "A physical server rack reserved for you",
        "A logically isolated section of the AWS Cloud where you can launch resources",
        "A database optimization engine",
        "A global content delivery network",
      ],
      correctIndex: 1,
      explanation:
        "A VPC is your private virtual network inside AWS — isolation you define.",
    },
    {
      id: "q7",
      question: "Which default port is used for secure SSH access to a Linux server?",
      type: "multiple_choice",
      options: ["80", "443", "22", "3306"],
      correctIndex: 2,
      explanation: "Port 22 is the default for SSH.",
    },
  ];

  switch (level) {
    case "beginner":
      return baseQuestions;
    case "moderate":
      return [...baseQuestions, ...intermediateQuestions];
    case "pro":
    case "ultra_pro":
      return [...baseQuestions, ...intermediateQuestions, ...advancedQuestions];
    default:
      return baseQuestions;
  }
};

const CloudInitialQuiz = ({ level, onComplete }: CloudInitialQuizProps) => {
  const questions = getQuestionsByLevel(level);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const { recordAttempt } = useStruggleDetection({
    taskId: `cloud_quiz_${currentIndex}`,
    maxTimeSeconds: 60,
    maxAttempts: 2,
    context: {
      level,
      currentLesson: "Initial Assessment",
      domain: "Engineering",
    },
  });

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setShowExplanation(true);
    setAnswers([...answers, isCorrect]);
    if (isCorrect) setScore(score + 1);
    else recordAttempt();
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(
        score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0),
        questions.length
      );
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-2">
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-4">
          Assessment · {currentIndex + 1} / {questions.length}
        </p>
        <div className="h-px w-full bg-white/[0.08] overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-snug mb-10">
          {currentQuestion.question}
        </h2>

        {currentQuestion.options && (
          <div className="space-y-0 border-t border-white/[0.08] mb-10">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showResult = showExplanation;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !showExplanation && setSelectedAnswer(index)}
                  disabled={showExplanation}
                  className={`w-full flex items-start gap-4 py-5 border-b border-white/[0.08] text-left transition-colors ${
                    showResult
                      ? isCorrect
                        ? "text-foreground"
                        : isSelected
                        ? "text-muted-foreground opacity-50"
                        : "text-muted-foreground/40"
                      : isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`font-display text-sm w-6 shrink-0 ${
                      isSelected || (showResult && isCorrect) ? "text-primary" : ""
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-[15px] leading-relaxed">{option}</span>
                  {showResult && isCorrect && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-primary shrink-0">
                      Correct
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {showExplanation && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground leading-relaxed mb-8 border-l border-primary/50 pl-4"
          >
            {currentQuestion.explanation}
          </motion.p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tracking-wide">
            {answers.length > 0 ? `${score} of ${answers.length} so far` : "Take your time"}
          </p>
          {!showExplanation ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              variant="hero"
              className="min-w-[140px]"
            >
              Confirm
            </Button>
          ) : (
            <Button onClick={handleNext} variant="hero" className="gap-2 min-w-[140px]">
              {isLastQuestion ? "Continue" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CloudInitialQuiz;
