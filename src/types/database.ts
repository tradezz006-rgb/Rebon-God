export type DifficultyLevel = 'Beginner' | 'Moderate' | 'Hard' | 'Pro';

export interface AVA_TeachingFramework {
  what_is_this: string;
  how_we_use_it: string;
  where_we_use_it: string;
  where_not_to_use_it: string;
  impact: string;
}

export interface QuizQuestion {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  quiz_id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface AVA_TeachingFramework {
  what_is_this: string;
  how_we_use_it: string;
  where_we_use_it: string;
  where_not_to_use_it: string;
  impact: string;
}

export interface CoreConcept {
  concept_id: string;
  concept_name: string;
  full_explanation: string;
  analogy: string;
  why_companies_care: string;
  common_wrong_belief: string;
  correction: string;
}

export interface StudentLesson {
  id?: string; // Old format
  title?: string; // Old format
  concept_explanation?: AVA_TeachingFramework; // Old format
  key_points?: string[]; // Old format
  whiteboard_content?: string[]; // Old format
  interaction_questions?: string[]; // Old format
  expected_answers?: string[]; // Old format
  validation_logic?: string[]; // Old format
  correct_response?: string; // Old format
  wrong_response?: string; // Old format
  real_world_example?: string; // Old format
  quizzes?: Quiz[]; // Old format
  linked_scenario_ids?: string[]; // Old format
  
  // New format
  lesson_id?: string;
  lesson_title?: string;
  part?: string | null;
  week?: number;
  prerequisite_lessons?: string[];
  emotional_outcome?: string;
  lesson_purpose?: string;
  core_concepts?: CoreConcept[];

  duration_estimate?: number; // e.g., 10 (minutes)
  difficulty_level?: DifficultyLevel;
  part_number?: number; // For splitting > 15 min lessons
  ava_teaching_duration_minutes?: number;
  estimated_duration_minutes?: number;
  ava_flow?: {
    hook?: string;
    teach_sequence?: string[];
    understanding_checks?: string[];
    closing?: string;
    interactive_moments?: InteractiveMoment[];
  };
  ava_session?: {
    intro: {
      ava_speaks: string;
      board: any;
    };
    segments: {
      id: number;
      title: string;
      ava_speaks: string;
      board_actions: any[];
      interactive_moment?: any;
    }[];
    lesson_summary: {
      ava_speaks: string;
      board: any;
      coming_next?: string;
    };
  };
}

export type InteractiveMomentType = 'true_false' | 'quiz_tab' | 'drag_drop' | 'fill_blank' | 'scenario_card' | 'matching' | 'code_challenge' | 'live_demo';

export interface InteractiveMoment {
  at_minute: number;
  type: InteractiveMomentType;
  trigger: string;
  content: any; // We can type this more strictly later if needed based on the 8 types
}

export interface ProfessionalScenario {
  id: string;
  role: string; // e.g., "Full Stack Developer"
  problem_statement: string;
  company_context: string;
  required_skills: string[];
  steps_to_solve: string[];
  common_mistakes: string[];
  hints_level_1: string[];
  hints_level_2: string[];
  final_solution: string; // The correct code or explanation
  evaluation_metrics: string[]; // What the hidden AI checks for score
  time_expected: number; // e.g., 45 (minutes)
  difficulty_level: DifficultyLevel;
}

export interface AICompanionTask {
  task_id: string;
  scenario_link: string; // ID of the Professional Scenario this helps with
  without_ai_approach: string;
  with_ai_approach: string;
  correct_prompt_examples: string[];
  bad_prompt_examples: string[];
  ai_output_validation_steps: string[];
  when_not_to_use_ai: string;
  tool_used: 'ChatGPT' | 'Github Copilot' | 'Claude' | 'Gemini';
}
