import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw, Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Assessment } from "@/data/workspaceScenarios";

interface AssessmentQuizProps {
  assessment: Assessment;
  onClose: () => void;
  onComplete: (result: AssessmentResult) => void;
}

interface Question {
  id: string;
  type: "multiple-choice" | "scenario" | "voice-response";
  question: string;
  options?: string[];
  correctAnswer?: number;
  scenario?: string;
  rubric?: string[];
}

interface AssessmentResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string[];
  timeSpent: number;
}

// Assessment question banks
const questionBanks: Record<string, Question[]> = {
  "comm-basics": [
    {
      id: "cb1",
      type: "multiple-choice",
      question: "What is the most important element of active listening?",
      options: [
        "Preparing your response while the other person speaks",
        "Giving full attention and providing feedback to show understanding",
        "Nodding frequently to show agreement",
        "Taking detailed notes of everything said"
      ],
      correctAnswer: 1
    },
    {
      id: "cb2",
      type: "multiple-choice",
      question: "Which communication style is most effective in a crisis situation?",
      options: [
        "Passive - avoid conflict and let others lead",
        "Aggressive - take charge forcefully",
        "Assertive - clear, direct, and respectful",
        "Passive-aggressive - express concerns indirectly"
      ],
      correctAnswer: 2
    },
    {
      id: "cb3",
      type: "multiple-choice",
      question: "What percentage of communication is typically non-verbal?",
      options: ["10-20%", "30-40%", "55-65%", "80-90%"],
      correctAnswer: 2
    },
    {
      id: "cb4",
      type: "scenario",
      question: "Your colleague interrupts you during a presentation. How would you handle this professionally?",
      scenario: "You're presenting quarterly results to your team when a colleague says 'That doesn't seem right' and starts challenging your data in front of everyone.",
      rubric: ["Stays calm", "Acknowledges concern", "Offers to discuss after", "Maintains professionalism"]
    },
    {
      id: "cb5",
      type: "multiple-choice",
      question: "What is the 'elevator pitch' rule for professional introductions?",
      options: [
        "Always use technical jargon to sound professional",
        "Keep your introduction under 30-60 seconds",
        "Include your entire career history",
        "Focus only on your weaknesses to seem humble"
      ],
      correctAnswer: 1
    },
    {
      id: "cb6",
      type: "multiple-choice",
      question: "When receiving negative feedback, you should first:",
      options: [
        "Immediately defend your actions",
        "Thank the person and ask clarifying questions",
        "Apologize profusely even if you disagree",
        "Change the subject to avoid conflict"
      ],
      correctAnswer: 1
    },
    {
      id: "cb7",
      type: "scenario",
      question: "How would you communicate a project delay to your manager?",
      scenario: "Your project is delayed by 2 weeks due to unexpected technical issues. You need to inform your manager.",
      rubric: ["Takes responsibility", "Explains root cause", "Proposes solution", "Provides new timeline"]
    },
    {
      id: "cb8",
      type: "multiple-choice",
      question: "Which phrase best opens a difficult conversation?",
      options: [
        "We need to talk about your performance issues.",
        "I'd like to discuss something and get your perspective.",
        "Everyone has been complaining about you.",
        "This is going to be hard to hear, but..."
      ],
      correctAnswer: 1
    },
    {
      id: "cb9",
      type: "multiple-choice",
      question: "What is 'mirroring' in communication?",
      options: [
        "Copying someone's exact words back to them",
        "Subtly matching body language and speech patterns",
        "Looking at yourself while speaking",
        "Reflecting on past conversations"
      ],
      correctAnswer: 1
    },
    {
      id: "cb10",
      type: "multiple-choice",
      question: "The best way to ensure your message is understood is to:",
      options: [
        "Repeat it multiple times loudly",
        "Send it in writing after saying it verbally",
        "Ask the listener to summarize what they heard",
        "Use as many words as possible to explain"
      ],
      correctAnswer: 2
    }
  ],
  "email-writing": [
    {
      id: "ew1",
      type: "multiple-choice",
      question: "What is the ideal length for a professional email subject line?",
      options: ["1-3 words", "6-10 words", "15-20 words", "Any length is fine"],
      correctAnswer: 1
    },
    {
      id: "ew2",
      type: "multiple-choice",
      question: "When should you use 'Reply All'?",
      options: [
        "Always, to keep everyone informed",
        "Only when all recipients need to see your response",
        "Never, it's considered unprofessional",
        "Only for positive messages"
      ],
      correctAnswer: 1
    },
    {
      id: "ew3",
      type: "scenario",
      question: "Draft a subject line and opening sentence for requesting a meeting with a VP.",
      scenario: "You need to schedule a 30-minute meeting with the VP of Engineering to discuss resource allocation for your project.",
      rubric: ["Clear subject", "Professional tone", "States purpose", "Shows respect for time"]
    },
    {
      id: "ew4",
      type: "multiple-choice",
      question: "What should the first paragraph of a business email contain?",
      options: [
        "Your complete background and qualifications",
        "The main purpose or request of the email",
        "A detailed history of the project",
        "Personal greetings and small talk"
      ],
      correctAnswer: 1
    },
    {
      id: "ew5",
      type: "multiple-choice",
      question: "How long should you wait before following up on an unanswered email?",
      options: [
        "2-4 hours",
        "24-48 hours for urgent matters, 3-5 business days for non-urgent",
        "1 week minimum",
        "Never follow up, they'll respond when ready"
      ],
      correctAnswer: 1
    },
    {
      id: "ew6",
      type: "multiple-choice",
      question: "Which sign-off is most appropriate for a formal business email?",
      options: ["Cheers,", "Best regards,", "Later!", "TTYL,"],
      correctAnswer: 1
    },
    {
      id: "ew7",
      type: "multiple-choice",
      question: "When forwarding an email, you should:",
      options: [
        "Forward the entire chain without any context",
        "Add context about why you're forwarding and what action is needed",
        "Delete all previous messages for privacy",
        "CC everyone in the original email"
      ],
      correctAnswer: 1
    },
    {
      id: "ew8",
      type: "scenario",
      question: "How would you politely decline a meeting request via email?",
      scenario: "A vendor wants to schedule a 1-hour demo call, but you're not interested in their product.",
      rubric: ["Polite tone", "Clear decline", "Brief explanation", "Leaves door open if appropriate"]
    }
  ],
  "negotiation": [
    {
      id: "ng1",
      type: "multiple-choice",
      question: "What is BATNA in negotiation?",
      options: [
        "Best Alternative To a Negotiated Agreement",
        "Business And Trade Negotiation Agreement",
        "Better Approach To New Arrangements",
        "Basic Agreement Terms for New Alliances"
      ],
      correctAnswer: 0
    },
    {
      id: "ng2",
      type: "multiple-choice",
      question: "The best negotiators typically:",
      options: [
        "Talk more than they listen",
        "Make the first offer immediately",
        "Ask questions and listen actively",
        "Use aggressive tactics to dominate"
      ],
      correctAnswer: 2
    },
    {
      id: "ng3",
      type: "scenario",
      question: "Negotiate a project deadline extension with your client.",
      scenario: "Your client expects delivery in 2 weeks, but your team needs 3 weeks to maintain quality. You need to negotiate.",
      rubric: ["Explains value", "Proposes alternatives", "Shows flexibility", "Maintains relationship"]
    },
    {
      id: "ng4",
      type: "multiple-choice",
      question: "What is 'anchoring' in negotiation?",
      options: [
        "Refusing to move from your position",
        "Setting an initial reference point that influences the discussion",
        "Connecting negotiations to past agreements",
        "Securing a deal quickly"
      ],
      correctAnswer: 1
    },
    {
      id: "ng5",
      type: "multiple-choice",
      question: "When should you walk away from a negotiation?",
      options: [
        "When you don't get exactly what you want",
        "When the deal falls below your BATNA",
        "Never, always find a compromise",
        "After the first rejection"
      ],
      correctAnswer: 1
    },
    {
      id: "ng6",
      type: "scenario",
      question: "How would you respond to a vendor who doubled their price?",
      scenario: "Your software vendor announces a 100% price increase for renewal. Your budget cannot accommodate this.",
      rubric: ["Stays calm", "Asks for justification", "Explores alternatives", "Negotiates value"]
    },
    {
      id: "ng7",
      type: "multiple-choice",
      question: "Win-win negotiation is characterized by:",
      options: [
        "Both parties getting exactly what they asked for",
        "Finding creative solutions that benefit all parties",
        "Splitting everything 50/50",
        "Taking turns winning"
      ],
      correctAnswer: 1
    },
    {
      id: "ng8",
      type: "multiple-choice",
      question: "Before entering a negotiation, you should:",
      options: [
        "Keep your preparation minimal to stay flexible",
        "Research the other party and prepare multiple scenarios",
        "Focus only on your own goals",
        "Decide exactly what to say word-for-word"
      ],
      correctAnswer: 1
    }
  ],
  "presentation": [
    {
      id: "pr1",
      type: "multiple-choice",
      question: "What is the 10-20-30 rule for presentations?",
      options: [
        "10 minutes, 20 slides, 30 point font",
        "10 slides, 20 minutes, 30 point font",
        "10 words, 20 images, 30 seconds per slide",
        "10 topics, 20 examples, 30 minutes total"
      ],
      correctAnswer: 1
    },
    {
      id: "pr2",
      type: "multiple-choice",
      question: "The best way to open a presentation is:",
      options: [
        "Apologize for any potential issues",
        "Read your biography and credentials",
        "Start with a compelling hook or question",
        "Jump directly into data and statistics"
      ],
      correctAnswer: 2
    },
    {
      id: "pr3",
      type: "scenario",
      question: "How would you handle a hostile question during Q&A?",
      scenario: "An audience member asks: 'Your data is clearly cherry-picked. How can we trust any of this?'",
      rubric: ["Stays composed", "Acknowledges concern", "Provides evidence", "Offers follow-up"]
    },
    {
      id: "pr4",
      type: "multiple-choice",
      question: "How much content should be on each slide?",
      options: [
        "As much as possible to show thoroughness",
        "One key idea with supporting visuals",
        "Full paragraphs for those taking notes",
        "Only the title, you'll explain everything verbally"
      ],
      correctAnswer: 1
    },
    {
      id: "pr5",
      type: "voice-response",
      question: "Deliver your opening for a quarterly business review.",
      scenario: "You're presenting Q3 results to the executive team. Give a 20-second opening that hooks their attention.",
      rubric: ["Confident delivery", "Clear key message", "Engages audience", "Professional tone"]
    },
    {
      id: "pr6",
      type: "multiple-choice",
      question: "What should you do if your technology fails during a presentation?",
      options: [
        "Stop and wait for IT support",
        "Apologize repeatedly and show frustration",
        "Have a backup plan and continue confidently",
        "End the presentation early"
      ],
      correctAnswer: 2
    },
    {
      id: "pr7",
      type: "multiple-choice",
      question: "Eye contact during presentations should be:",
      options: [
        "Focused on your notes or slides",
        "Fixed on one friendly face",
        "Distributed across the entire audience",
        "Avoided to reduce nervousness"
      ],
      correctAnswer: 2
    },
    {
      id: "pr8",
      type: "scenario",
      question: "Close a sales pitch with a clear call to action.",
      scenario: "You've just finished presenting your product to a potential client. Deliver a compelling close.",
      rubric: ["Summarizes value", "Clear next steps", "Creates urgency", "Invites questions"]
    }
  ],
  "conflict": [
    {
      id: "cf1",
      type: "multiple-choice",
      question: "What is the first step in resolving workplace conflict?",
      options: [
        "Report to HR immediately",
        "Understand all perspectives involved",
        "Determine who is right and wrong",
        "Avoid the person until things cool down"
      ],
      correctAnswer: 1
    },
    {
      id: "cf2",
      type: "multiple-choice",
      question: "Which conflict resolution style focuses on finding middle ground?",
      options: ["Competing", "Avoiding", "Compromising", "Accommodating"],
      correctAnswer: 2
    },
    {
      id: "cf3",
      type: "scenario",
      question: "Mediate a disagreement between two team members.",
      scenario: "Two developers disagree on the architecture approach. One wants microservices, the other wants monolith. They've stopped collaborating.",
      rubric: ["Neutral stance", "Lets both speak", "Focuses on facts", "Finds common ground"]
    },
    {
      id: "cf4",
      type: "multiple-choice",
      question: "Using 'I' statements in conflict helps because:",
      options: [
        "It shows you're the authority",
        "It reduces defensiveness by focusing on your feelings",
        "It makes the other person feel guilty",
        "It's more grammatically correct"
      ],
      correctAnswer: 1
    },
    {
      id: "cf5",
      type: "scenario",
      question: "Address a colleague who takes credit for your work.",
      scenario: "In a meeting, your colleague presented your idea as their own. The manager praised them. You need to address this.",
      rubric: ["Stays professional", "Addresses privately", "States facts", "Proposes solution"]
    },
    {
      id: "cf6",
      type: "multiple-choice",
      question: "When emotions run high in a conflict, you should:",
      options: [
        "Match their emotional intensity",
        "Suggest taking a break to cool down",
        "Point out how irrational they're being",
        "Bring in more people to witness"
      ],
      correctAnswer: 1
    },
    {
      id: "cf7",
      type: "multiple-choice",
      question: "Collaboration as a conflict style means:",
      options: [
        "Giving in to keep the peace",
        "Working together to find a solution that satisfies all parties",
        "Avoiding the conflict entirely",
        "Pushing your solution aggressively"
      ],
      correctAnswer: 1
    },
    {
      id: "cf8",
      type: "multiple-choice",
      question: "After resolving a conflict, you should:",
      options: [
        "Pretend it never happened",
        "Document everything for HR",
        "Follow up to ensure the resolution is working",
        "Avoid the person to prevent recurrence"
      ],
      correctAnswer: 2
    }
  ]
};

// Default question bank for assessments not specifically defined
const defaultQuestions: Question[] = [
  {
    id: "def1",
    type: "multiple-choice",
    question: "What is the most important aspect of professional communication?",
    options: ["Speed", "Clarity and understanding", "Using technical terms", "Being brief"],
    correctAnswer: 1
  },
  {
    id: "def2",
    type: "scenario",
    question: "Describe how you would communicate a complex idea to a non-technical stakeholder.",
    scenario: "You need to explain a technical architecture decision to a business executive.",
    rubric: ["Uses analogies", "Avoids jargon", "Focuses on benefits", "Checks understanding"]
  },
  {
    id: "def3",
    type: "multiple-choice",
    question: "When is it appropriate to use informal communication in the workplace?",
    options: [
      "Never",
      "With close colleagues in appropriate settings",
      "Always, to build rapport",
      "Only in written communication"
    ],
    correctAnswer: 1
  },
  {
    id: "def4",
    type: "multiple-choice",
    question: "How should you prepare for an important business meeting?",
    options: [
      "Show up and improvise",
      "Review agenda, prepare talking points, and anticipate questions",
      "Write out everything you'll say word-for-word",
      "Only the meeting organizer needs to prepare"
    ],
    correctAnswer: 1
  },
  {
    id: "def5",
    type: "scenario",
    question: "How would you handle giving feedback to a senior colleague?",
    scenario: "A senior team member made a mistake in their report. You need to address it diplomatically.",
    rubric: ["Respectful tone", "Private setting", "Focuses on issue not person", "Offers solution"]
  }
];

const AssessmentQuiz = ({ assessment, onClose, onComplete }: AssessmentQuizProps) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);

  // Get questions for this assessment
  const questions = questionBanks[assessment.id] || defaultQuestions.slice(0, assessment.questions);
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    // Save transcript as answer
    if (voiceTranscript.trim()) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: voiceTranscript }));
    }
  };

  const handleAnswerSelect = (answer: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleTextAnswer = (text: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: text }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setVoiceTranscript("");
    } else {
      submitAssessment();
    }
  };

  const submitAssessment = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    let correctAnswers = 0;
    let scenarioScores: number[] = [];
    
    questions.forEach(q => {
      if (q.type === "multiple-choice" && answers[q.id] === q.correctAnswer) {
        correctAnswers++;
      } else if ((q.type === "scenario" || q.type === "voice-response") && answers[q.id]) {
        // For scenarios, we'll give partial credit based on answer length and rubric keywords
        const answer = String(answers[q.id]).toLowerCase();
        let rubricMatches = 0;
        q.rubric?.forEach(rubricItem => {
          if (answer.includes(rubricItem.toLowerCase().split(' ')[0])) {
            rubricMatches++;
          }
        });
        const scenarioScore = Math.min(100, (rubricMatches / (q.rubric?.length || 1)) * 100 + (answer.length > 50 ? 30 : 10));
        scenarioScores.push(scenarioScore);
      }
    });

    const mcScore = (correctAnswers / questions.filter(q => q.type === "multiple-choice").length) * 100 || 0;
    const scenarioAvg = scenarioScores.length > 0 
      ? scenarioScores.reduce((a, b) => a + b, 0) / scenarioScores.length 
      : 0;
    
    const overallScore = Math.round((mcScore * 0.6 + scenarioAvg * 0.4) || mcScore);

    const assessmentResult: AssessmentResult = {
      score: overallScore,
      maxScore: 100,
      percentage: overallScore,
      feedback: [
        overallScore >= 80 ? "Excellent understanding of the concepts!" : 
        overallScore >= 60 ? "Good grasp of fundamentals, some areas to improve." :
        "Review the material and try again.",
        `You answered ${correctAnswers}/${questions.filter(q => q.type === "multiple-choice").length} multiple choice correctly.`,
        scenarioScores.length > 0 ? `Scenario responses averaged ${Math.round(scenarioAvg)}%.` : ""
      ].filter(Boolean),
      timeSpent: timeElapsed
    };

    // Save to database
    if (user) {
      try {
        await supabase.from('quiz_results').insert({
          user_id: user.id,
          quiz_type: `assessment_${assessment.id}`,
          score: overallScore,
          max_score: 100,
          time_taken_seconds: timeElapsed,
          answers: answers as any
        });
      } catch (error) {
        console.error('Failed to save assessment result:', error);
      }
    }

    setResult(assessmentResult);
    setShowResults(true);
    setIsSubmitting(false);
  };

  if (showResults && result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              result.percentage >= 80 ? 'bg-green-500/20' :
              result.percentage >= 60 ? 'bg-yellow-500/20' :
              'bg-red-500/20'
            }`}>
              {result.percentage >= 80 ? (
                <Trophy className="w-10 h-10 text-green-500" />
              ) : result.percentage >= 60 ? (
                <CheckCircle className="w-10 h-10 text-yellow-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
            <p className="text-muted-foreground mb-6">{assessment.name}</p>
            
            <div className="text-5xl font-bold mb-2 text-gradient">{result.percentage}%</div>
            <p className="text-sm text-muted-foreground mb-6">
              Time: {formatTime(result.timeSpent)}
            </p>
            
            <div className="space-y-2 text-left bg-secondary/50 rounded-lg p-4 mb-6">
              {result.feedback.map((fb, i) => (
                <p key={i} className="text-sm text-muted-foreground">• {fb}</p>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setTimeElapsed(0);
                  setResult(null);
                }}
                className="flex-1 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div>
            <h2 className="font-semibold">{assessment.name}</h2>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {currentQuestion.scenario && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">Scenario:</p>
                  <p className="text-sm text-foreground">{currentQuestion.scenario}</p>
                </div>
              )}

              <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

              {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                <RadioGroup
                  value={String(answers[currentQuestion.id] ?? "")}
                  onValueChange={(val) => handleAnswerSelect(parseInt(val))}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                        answers[currentQuestion.id] === idx
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleAnswerSelect(idx)}
                    >
                      <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "scenario" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your response here..."
                    value={String(answers[currentQuestion.id] || "")}
                    onChange={(e) => handleTextAnswer(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Rubric points:</span>
                    {currentQuestion.rubric?.map((r, i) => (
                      <span key={i} className="bg-secondary px-2 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === "voice-response" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className="gap-2"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    {isRecording && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-muted-foreground">Recording...</span>
                      </div>
                    )}
                  </div>
                  
                  {voiceTranscript && (
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Your response:</p>
                      <p className="text-sm text-muted-foreground">{voiceTranscript}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Or type your response:
                  </p>
                  <Textarea
                    placeholder="Type your response here..."
                    value={String(answers[currentQuestion.id] || voiceTranscript || "")}
                    onChange={(e) => handleTextAnswer(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center bg-secondary/20">
          <p className="text-sm text-muted-foreground">
            {answers[currentQuestion.id] !== undefined ? "Answer saved" : "Select an answer"}
          </p>
          <Button
            onClick={goToNextQuestion}
            disabled={answers[currentQuestion.id] === undefined || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssessmentQuiz;
