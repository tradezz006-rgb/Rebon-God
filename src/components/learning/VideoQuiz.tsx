import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/data/learningContent";
import { CheckCircle, XCircle, HelpCircle, ArrowRight, Award } from "lucide-react";

interface VideoQuizProps {
  questions: QuizQuestion[];
  videoTitle: string;
  onComplete: (score: number, maxScore: number, answers: Record<string, number>) => void;
  onSkip?: () => void;
}

const VideoQuiz = ({ questions, videoTitle, onComplete, onSkip }: VideoQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctIndex;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    const newAnswers = { ...answers, [currentQuestion.id]: index };
    setAnswers(newAnswers);
    
    if (index === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setQuizCompleted(true);
      onComplete(score + (isCorrect ? 0 : 0), questions.length, answers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
            passed ? "bg-success/20" : "bg-amber-500/20"
          }`}
        >
          {passed ? (
            <Award className="w-12 h-12 text-success" />
          ) : (
            <HelpCircle className="w-12 h-12 text-amber-500" />
          )}
        </motion.div>

        <h3 className="text-2xl font-bold text-foreground mb-2">
          {passed ? "Quiz Passed!" : "Keep Learning!"}
        </h3>
        
        <p className="text-muted-foreground mb-4">
          You scored {score} out of {questions.length} ({percentage}%)
        </p>

        <div className="w-full max-w-xs mx-auto h-3 bg-secondary rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`h-full ${passed ? "bg-success" : "bg-amber-500"}`}
          />
        </div>

        {passed ? (
          <p className="text-success text-sm mb-6">
            Great job! You've demonstrated understanding of this topic.
          </p>
        ) : (
          <div className="text-left w-full max-w-2xl mx-auto space-y-4 mt-8">
            <h4 className="font-bold text-amber-500 border-b border-amber-500/30 pb-2 mb-4">Review Incorrect Answers:</h4>
            {questions.map((q) => {
                 const userAnswer = answers[q.id];
                 if (userAnswer !== q.correctIndex) {
                     return (
                         <div key={q.id} className="p-4 bg-black/40 border border-amber-500/30 rounded-lg">
                             <p className="font-bold text-white mb-2">{q.question}</p>
                             <p className="text-red-400 text-sm mb-1 line-through opacity-80">Your answer: {q.options[userAnswer] || "Skipped"}</p>
                             <p className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Correct answer: {q.options[q.correctIndex]}</p>
                             <p className="text-blue-200/60 text-xs italic">{q.explanation}</p>
                         </div>
                     )
                 }
                 return null;
             })}
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-6 border-amber-500 text-amber-500 hover:bg-amber-500/10">Try Quiz Again</Button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Knowledge Check</h3>
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <p className="text-foreground font-medium text-lg mb-6">
            {currentQuestion.question}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              
              let optionStyle = "border-border/50 hover:border-primary/50 hover:bg-primary/5";
              
              if (showExplanation) {
                if (isCorrectOption) {
                  optionStyle = "border-success bg-success/10";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "border-destructive bg-destructive/10";
                } else {
                  optionStyle = "border-border/30 opacity-50";
                }
              } else if (isSelected) {
                optionStyle = "border-primary bg-primary/10";
              }

              return (
                <motion.button
                  key={index}
                  whileHover={!showExplanation ? { scale: 1.01 } : {}}
                  whileTap={!showExplanation ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showExplanation && isCorrectOption
                        ? "bg-success text-white"
                        : showExplanation && isSelected && !isCorrectOption
                        ? "bg-destructive text-white"
                        : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {showExplanation && isCorrectOption ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : showExplanation && isSelected && !isCorrectOption ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="text-foreground">{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl ${
              isCorrect ? "bg-success/10 border border-success/30" : "bg-amber-500/10 border border-amber-500/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold mb-1 ${isCorrect ? "text-success" : "text-amber-500"}`}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <Button onClick={handleNext} variant="hero">
            {isLastQuestion ? "Complete Quiz" : "Next Question"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default VideoQuiz;
