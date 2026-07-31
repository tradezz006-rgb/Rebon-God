export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TaskAssessment {
  id: string;
  title: string;
  prompt: string;
  timeLimit: number; // seconds
  evaluationCriteria: string[];
}

export interface NanoVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  category: "fundamentals" | "confidence" | "structure" | "professional" | "advanced";
  level: "beginner" | "moderate" | "pro" | "ultra_pro";
  videoUrl?: string;
  thumbnailUrl?: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
  taskAssessment: TaskAssessment;
}

export const learningContent: NanoVideo[] = [
  // BEGINNER LEVEL
  {
    id: "v1-intro-communication",
    title: "Introduction to Professional Communication",
    description: "Learn the fundamentals of professional speaking and why it matters in corporate settings.",
    duration: "8 min",
    durationSeconds: 480,
    category: "fundamentals",
    level: "beginner",
    keyPoints: [
      "The 3 pillars of professional communication",
      "Why first impressions matter",
      "Understanding your audience",
      "Setting communication goals"
    ],
    quiz: [
      {
        id: "q1",
        question: "What are the 3 pillars of professional communication?",
        options: [
          "Speed, Volume, Accent",
          "Clarity, Confidence, Connection",
          "Grammar, Vocabulary, Pronunciation",
          "Writing, Reading, Speaking"
        ],
        correctIndex: 1,
        explanation: "The 3 pillars are Clarity (being understood), Confidence (projecting authority), and Connection (engaging your audience)."
      },
      {
        id: "q2",
        question: "How quickly do people form first impressions in professional settings?",
        options: [
          "Within 7 seconds",
          "Within 1 minute",
          "Within 5 minutes",
          "After the first meeting"
        ],
        correctIndex: 0,
        explanation: "Research shows people form first impressions within just 7 seconds of meeting someone."
      },
      {
        id: "q3",
        question: "Why is understanding your audience important?",
        options: [
          "To use bigger words",
          "To speak faster",
          "To tailor your message effectively",
          "To avoid questions"
        ],
        correctIndex: 2,
        explanation: "Understanding your audience helps you tailor your message, tone, and approach for maximum impact."
      }
    ],
    taskAssessment: {
      id: "t1",
      title: "Self Introduction Practice",
      prompt: "Introduce yourself professionally as if you're meeting a new team member. Include your name, role, and what you're working on. Speak for 30-45 seconds.",
      timeLimit: 60,
      evaluationCriteria: ["Clear introduction", "Professional tone", "Structured response"]
    }
  },
  {
    id: "v2-building-confidence",
    title: "Building Confidence in Speech",
    description: "Techniques to overcome nervousness and speak with confidence in any situation.",
    duration: "10 min",
    durationSeconds: 600,
    category: "confidence",
    level: "beginner",
    keyPoints: [
      "Understanding speech anxiety",
      "Power poses and body language",
      "The pause technique",
      "Positive self-talk strategies"
    ],
    quiz: [
      {
        id: "q1",
        question: "What is the most common cause of speech anxiety?",
        options: [
          "Lack of vocabulary",
          "Fear of judgment",
          "Poor grammar",
          "Speaking too fast"
        ],
        correctIndex: 1,
        explanation: "Fear of judgment from others is the primary cause of speech anxiety in most people."
      },
      {
        id: "q2",
        question: "How can strategic pauses improve your speech?",
        options: [
          "They make you seem unsure",
          "They fill awkward silences",
          "They emphasize key points and give you time to think",
          "They shorten your presentation"
        ],
        correctIndex: 2,
        explanation: "Strategic pauses emphasize important points and give you time to gather your thoughts without using filler words."
      },
      {
        id: "q3",
        question: "What is a 'power pose'?",
        options: [
          "Crossing your arms",
          "Looking at the floor",
          "An expansive, open body posture",
          "Fidgeting with your hands"
        ],
        correctIndex: 2,
        explanation: "Power poses are expansive, open postures that can boost confidence and reduce stress hormones."
      }
    ],
    taskAssessment: {
      id: "t2",
      title: "Confident Opinion Sharing",
      prompt: "Share your opinion on a topic you feel strongly about. Practice using pauses and confident body language. Speak for 45-60 seconds.",
      timeLimit: 75,
      evaluationCriteria: ["Confident tone", "Strategic pauses", "Clear opinion statement"]
    }
  },
  {
    id: "v3-structuring-thoughts",
    title: "Structuring Your Thoughts",
    description: "Learn frameworks to organize your ideas for clear, impactful communication.",
    duration: "12 min",
    durationSeconds: 720,
    category: "structure",
    level: "beginner",
    keyPoints: [
      "The PREP framework (Point, Reason, Example, Point)",
      "The Rule of Three",
      "Beginning, Middle, End structure",
      "Signposting your ideas"
    ],
    quiz: [
      {
        id: "q1",
        question: "What does PREP stand for?",
        options: [
          "Practice, Review, Execute, Present",
          "Point, Reason, Example, Point",
          "Plan, Research, Explain, Prove",
          "Prepare, Rehearse, Engage, Perform"
        ],
        correctIndex: 1,
        explanation: "PREP stands for Point (state your main idea), Reason (explain why), Example (give evidence), Point (restate)."
      },
      {
        id: "q2",
        question: "Why is the 'Rule of Three' effective in communication?",
        options: [
          "Three is a lucky number",
          "People can easily remember three things",
          "It makes speeches shorter",
          "It's required in business"
        ],
        correctIndex: 1,
        explanation: "The human brain finds it easy to remember and process information in groups of three."
      },
      {
        id: "q3",
        question: "What is 'signposting' in communication?",
        options: [
          "Using hand gestures",
          "Verbal cues that guide listeners through your message",
          "Writing notes on a board",
          "Pointing at slides"
        ],
        correctIndex: 1,
        explanation: "Signposting uses verbal cues like 'firstly', 'in conclusion' to help listeners follow your structure."
      }
    ],
    taskAssessment: {
      id: "t3",
      title: "PREP Framework Practice",
      prompt: "Use the PREP framework to explain why teamwork is important in the workplace. Make your Point, give a Reason, provide an Example, and restate your Point.",
      timeLimit: 90,
      evaluationCriteria: ["Clear point statement", "Logical reasoning", "Relevant example", "Strong conclusion"]
    }
  },

  // MODERATE LEVEL
  {
    id: "v4-active-listening",
    title: "Active Listening Skills",
    description: "Master the art of listening to become a better communicator and collaborator.",
    duration: "10 min",
    durationSeconds: 600,
    category: "professional",
    level: "moderate",
    keyPoints: [
      "The difference between hearing and listening",
      "Non-verbal cues in listening",
      "Paraphrasing and clarifying",
      "Avoiding common listening barriers"
    ],
    quiz: [
      {
        id: "q1",
        question: "What percentage of communication is typically non-verbal?",
        options: ["25%", "55%", "75%", "93%"],
        correctIndex: 1,
        explanation: "Studies suggest about 55% of communication is body language, 38% is tone, and only 7% is actual words."
      },
      {
        id: "q2",
        question: "What is 'paraphrasing' in active listening?",
        options: [
          "Repeating exactly what someone said",
          "Restating someone's message in your own words",
          "Interrupting with your opinion",
          "Nodding while someone speaks"
        ],
        correctIndex: 1,
        explanation: "Paraphrasing involves restating the speaker's message in your own words to confirm understanding."
      },
      {
        id: "q3",
        question: "Which is a common barrier to active listening?",
        options: [
          "Making eye contact",
          "Planning your response while others speak",
          "Asking clarifying questions",
          "Nodding to show engagement"
        ],
        correctIndex: 1,
        explanation: "Planning your response instead of fully listening is a major barrier to active listening."
      }
    ],
    taskAssessment: {
      id: "t4",
      title: "Paraphrasing Practice",
      prompt: "I'll give you a statement: 'Our project deadline was moved up by two weeks, and we need to reprioritize our tasks.' Now paraphrase this and ask a clarifying question.",
      timeLimit: 45,
      evaluationCriteria: ["Accurate paraphrasing", "Relevant clarifying question", "Professional tone"]
    }
  },
  {
    id: "v5-handling-difficult-conversations",
    title: "Handling Difficult Conversations",
    description: "Navigate challenging discussions with professionalism and empathy.",
    duration: "15 min",
    durationSeconds: 900,
    category: "professional",
    level: "moderate",
    keyPoints: [
      "Preparing for difficult conversations",
      "Managing emotions under pressure",
      "The 'I' statement technique",
      "Finding common ground"
    ],
    quiz: [
      {
        id: "q1",
        question: "What is an 'I' statement?",
        options: [
          "A statement that starts with 'I think you're wrong'",
          "A statement that expresses your feelings without blaming others",
          "A statement about yourself",
          "A confident declaration"
        ],
        correctIndex: 1,
        explanation: "'I' statements express your feelings and needs without blaming or attacking the other person."
      },
      {
        id: "q2",
        question: "Before a difficult conversation, you should:",
        options: [
          "Avoid thinking about it",
          "Plan exactly what you'll say word-for-word",
          "Identify your goals and the other person's perspective",
          "Practice being confrontational"
        ],
        correctIndex: 2,
        explanation: "Understanding both your goals and the other person's perspective helps you navigate the conversation effectively."
      },
      {
        id: "q3",
        question: "When emotions run high in a conversation, you should:",
        options: [
          "Match the other person's energy",
          "Walk away immediately",
          "Take a brief pause and breathe",
          "Speak louder to be heard"
        ],
        correctIndex: 2,
        explanation: "Taking a brief pause and breathing helps you regulate emotions and respond thoughtfully."
      }
    ],
    taskAssessment: {
      id: "t5",
      title: "Difficult Conversation Roleplay",
      prompt: "A colleague missed an important deadline affecting your work. Use 'I' statements to address the situation professionally without being accusatory.",
      timeLimit: 60,
      evaluationCriteria: ["Used 'I' statements", "Professional tone", "Solution-oriented approach"]
    }
  },
  {
    id: "v6-email-communication",
    title: "Professional Email Writing",
    description: "Craft clear, effective emails that get results.",
    duration: "8 min",
    durationSeconds: 480,
    category: "professional",
    level: "moderate",
    keyPoints: [
      "Clear subject lines",
      "The inverted pyramid structure",
      "Professional tone and formatting",
      "Call-to-action clarity"
    ],
    quiz: [
      {
        id: "q1",
        question: "What makes an effective email subject line?",
        options: [
          "It should be vague to create curiosity",
          "It should be specific and action-oriented",
          "It should be as long as possible",
          "It should use all caps for emphasis"
        ],
        correctIndex: 1,
        explanation: "Effective subject lines are specific and action-oriented, helping recipients prioritize."
      },
      {
        id: "q2",
        question: "What is the 'inverted pyramid' structure?",
        options: [
          "Starting with details and ending with the main point",
          "Starting with the main point and then providing details",
          "A way to format bullet points",
          "Using a pyramid chart in emails"
        ],
        correctIndex: 1,
        explanation: "The inverted pyramid puts the most important information first, then supporting details."
      },
      {
        id: "q3",
        question: "Every professional email should include:",
        options: [
          "Multiple fonts for emphasis",
          "A clear call-to-action",
          "At least 5 paragraphs",
          "Lots of exclamation points"
        ],
        correctIndex: 1,
        explanation: "A clear call-to-action tells the recipient exactly what you need from them."
      }
    ],
    taskAssessment: {
      id: "t6",
      title: "Email Composition",
      prompt: "Verbally compose an email requesting a meeting with your manager to discuss a new project idea. Include the subject line, main points, and call-to-action.",
      timeLimit: 75,
      evaluationCriteria: ["Clear subject line", "Structured message", "Professional tone", "Clear call-to-action"]
    }
  },

  // PRO LEVEL
  {
    id: "v7-presentation-mastery",
    title: "Presentation Mastery",
    description: "Deliver impactful presentations that engage and persuade your audience.",
    duration: "15 min",
    durationSeconds: 900,
    category: "advanced",
    level: "pro",
    keyPoints: [
      "Opening hooks that capture attention",
      "Visual storytelling techniques",
      "Handling Q&A sessions",
      "Memorable closings"
    ],
    quiz: [
      {
        id: "q1",
        question: "What is the most effective way to start a presentation?",
        options: [
          "Apologizing for any mistakes in advance",
          "Reading your agenda slide",
          "Starting with a compelling hook (story, question, or statistic)",
          "Introducing yourself in detail"
        ],
        correctIndex: 2,
        explanation: "A compelling hook captures attention immediately and sets the tone for your presentation."
      },
      {
        id: "q2",
        question: "During Q&A, if you don't know an answer, you should:",
        options: [
          "Make up an answer",
          "Admit you don't know and offer to follow up",
          "Change the subject",
          "End the Q&A session"
        ],
        correctIndex: 1,
        explanation: "Honesty builds credibility. Offer to research and follow up with the correct information."
      },
      {
        id: "q3",
        question: "The 10-20-30 rule for presentations suggests:",
        options: [
          "10 slides, 20 minutes, 30-point font minimum",
          "10 minutes, 20 slides, 30 people max",
          "10 topics, 20 examples, 30 minutes",
          "10 slides, 20 seconds each, 30 minute total"
        ],
        correctIndex: 0,
        explanation: "The 10-20-30 rule (by Guy Kawasaki) recommends 10 slides, 20 minutes, and 30-point minimum font."
      }
    ],
    taskAssessment: {
      id: "t7",
      title: "Presentation Opening",
      prompt: "Deliver an opening hook for a presentation about why remote work is beneficial. Use a story, statistic, or thought-provoking question to capture attention.",
      timeLimit: 60,
      evaluationCriteria: ["Attention-grabbing hook", "Clear topic introduction", "Confident delivery"]
    }
  },
  {
    id: "v8-negotiation-skills",
    title: "Negotiation and Persuasion",
    description: "Learn to negotiate effectively while maintaining positive relationships.",
    duration: "14 min",
    durationSeconds: 840,
    category: "advanced",
    level: "pro",
    keyPoints: [
      "Understanding interests vs. positions",
      "BATNA (Best Alternative to Negotiated Agreement)",
      "Win-win negotiation strategies",
      "Persuasion techniques"
    ],
    quiz: [
      {
        id: "q1",
        question: "What is BATNA?",
        options: [
          "A negotiation tactic",
          "Your best alternative if negotiation fails",
          "A type of contract",
          "A meeting format"
        ],
        correctIndex: 1,
        explanation: "BATNA is your Best Alternative to a Negotiated Agreement - your fallback if negotiations fail."
      },
      {
        id: "q2",
        question: "In negotiation, 'interests' differ from 'positions' because:",
        options: [
          "Interests are more aggressive",
          "Positions are the underlying needs; interests are stated demands",
          "Interests are the underlying needs; positions are stated demands",
          "They are the same thing"
        ],
        correctIndex: 2,
        explanation: "Positions are what people say they want; interests are the underlying needs driving those positions."
      },
      {
        id: "q3",
        question: "A 'win-win' negotiation means:",
        options: [
          "You always get everything you want",
          "Both parties feel their core interests are met",
          "Splitting everything 50-50",
          "Avoiding conflict at all costs"
        ],
        correctIndex: 1,
        explanation: "Win-win negotiations satisfy the core interests of both parties, creating lasting agreements."
      }
    ],
    taskAssessment: {
      id: "t8",
      title: "Negotiation Scenario",
      prompt: "You want a raise but your manager says the budget is tight. Present your case for why you deserve the raise while acknowledging the budget constraints. Propose a win-win solution.",
      timeLimit: 90,
      evaluationCriteria: ["Clear value proposition", "Acknowledgment of constraints", "Creative win-win solution"]
    }
  },

  // ULTRA PRO LEVEL
  {
    id: "v9-executive-presence",
    title: "Executive Presence",
    description: "Develop the gravitas and impact of a senior leader.",
    duration: "12 min",
    durationSeconds: 720,
    category: "advanced",
    level: "ultra_pro",
    keyPoints: [
      "The three pillars of executive presence",
      "Strategic silence and timing",
      "Managing your personal brand",
      "Influencing without authority"
    ],
    quiz: [
      {
        id: "q1",
        question: "The three pillars of executive presence are:",
        options: [
          "Speed, Volume, Power",
          "Gravitas, Communication, Appearance",
          "Intelligence, Experience, Connections",
          "Confidence, Charisma, Control"
        ],
        correctIndex: 1,
        explanation: "Executive presence is built on Gravitas (how you act), Communication (how you speak), and Appearance (how you look)."
      },
      {
        id: "q2",
        question: "'Influencing without authority' means:",
        options: [
          "Being manipulative",
          "Gaining influence through expertise and relationships, not title",
          "Avoiding leadership roles",
          "Speaking louder than others"
        ],
        correctIndex: 1,
        explanation: "Influencing without authority means using expertise, relationships, and persuasion rather than positional power."
      },
      {
        id: "q3",
        question: "Strategic silence in leadership is used to:",
        options: [
          "Avoid answering questions",
          "Create tension and show disinterest",
          "Emphasize points and give others space to contribute",
          "Save time in meetings"
        ],
        correctIndex: 2,
        explanation: "Strategic silence emphasizes key points, shows thoughtfulness, and creates space for others."
      }
    ],
    taskAssessment: {
      id: "t9",
      title: "Executive Summary",
      prompt: "You need to brief the CEO on a project in 60 seconds. Deliver a concise executive summary covering: the project status, key wins, challenges, and what you need from leadership.",
      timeLimit: 75,
      evaluationCriteria: ["Concise delivery", "Clear structure", "Executive-level language", "Action-oriented"]
    }
  },
  {
    id: "v10-crisis-communication",
    title: "Crisis Communication",
    description: "Handle high-stakes communication during challenging situations.",
    duration: "15 min",
    durationSeconds: 900,
    category: "advanced",
    level: "ultra_pro",
    keyPoints: [
      "The SBAR framework for urgent communication",
      "Managing stakeholder emotions",
      "Transparency vs. speculation",
      "Recovery and follow-up communication"
    ],
    quiz: [
      {
        id: "q1",
        question: "What does SBAR stand for?",
        options: [
          "Situation, Background, Analysis, Resolution",
          "Situation, Background, Assessment, Recommendation",
          "Summary, Brief, Action, Report",
          "Status, Brief, Assessment, Response"
        ],
        correctIndex: 1,
        explanation: "SBAR: Situation (what's happening), Background (context), Assessment (your analysis), Recommendation (what to do)."
      },
      {
        id: "q2",
        question: "In crisis communication, you should prioritize:",
        options: [
          "Blaming the responsible party",
          "Speculation to fill information gaps",
          "Transparency about what you know and don't know",
          "Minimizing the situation"
        ],
        correctIndex: 2,
        explanation: "Transparency builds trust. Be honest about what you know and don't know, avoiding speculation."
      },
      {
        id: "q3",
        question: "After a crisis, follow-up communication should:",
        options: [
          "Never mention the crisis again",
          "Document lessons learned and share improvements made",
          "Blame individuals publicly",
          "Wait until people forget"
        ],
        correctIndex: 1,
        explanation: "Follow-up should document lessons learned and communicate improvements to rebuild trust."
      }
    ],
    taskAssessment: {
      id: "t10",
      title: "Crisis Brief",
      prompt: "A major system outage has affected customers for 2 hours. Use the SBAR framework to brief your leadership team on the situation and your recommended next steps.",
      timeLimit: 90,
      evaluationCriteria: ["SBAR structure", "Clear situation assessment", "Actionable recommendations", "Professional composure"]
    }
  }
];

// Get videos by level
export const getVideosByLevel = (level: string): NanoVideo[] => {
  const levelOrder = ["beginner", "moderate", "pro", "ultra_pro"];
  const userLevelIndex = levelOrder.indexOf(level);
  
  return learningContent.filter(video => {
    const videoLevelIndex = levelOrder.indexOf(video.level);
    return videoLevelIndex <= userLevelIndex;
  });
};

// Get recommended videos based on user scores
export const getRecommendedVideos = (
  scores: { fluency: number; clarity: number; confidence: number; structure: number },
  completedVideoIds: string[]
): NanoVideo[] => {
  const incompleteVideos = learningContent.filter(v => !completedVideoIds.includes(v.id));
  
  // Prioritize based on weak areas
  return incompleteVideos.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    if (a.category === "confidence" && scores.confidence < 5) scoreA += 10;
    if (a.category === "structure" && scores.structure < 5) scoreA += 10;
    if (a.category === "fundamentals" && scores.clarity < 5) scoreA += 10;
    
    if (b.category === "confidence" && scores.confidence < 5) scoreB += 10;
    if (b.category === "structure" && scores.structure < 5) scoreB += 10;
    if (b.category === "fundamentals" && scores.clarity < 5) scoreB += 10;
    
    return scoreB - scoreA;
  });
};

// Calculate score boost from completed assessments
export const calculateScoreBoost = (
  quizScore: number,
  maxQuizScore: number,
  taskScore: number
): number => {
  const quizPercentage = (quizScore / maxQuizScore) * 100;
  const avgScore = (quizPercentage + taskScore * 10) / 2;
  
  // Score boost ranges from 0.1 to 0.5 based on performance
  if (avgScore >= 90) return 0.5;
  if (avgScore >= 80) return 0.4;
  if (avgScore >= 70) return 0.3;
  if (avgScore >= 60) return 0.2;
  return 0.1;
};
