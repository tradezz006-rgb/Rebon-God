export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          overall_score: number | null
          recommended_topic: string | null
          scenario_type: string | null
          topic: string | null
          transcript: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_score?: number | null
          recommended_topic?: string | null
          scenario_type?: string | null
          topic?: string | null
          transcript?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_score?: number | null
          recommended_topic?: string | null
          scenario_type?: string | null
          topic?: string | null
          transcript?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      code_submissions: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          passed: boolean | null
          question_id: string
          quiz_id: string
          tests_passed: number | null
          tests_total: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language: string
          passed?: boolean | null
          question_id: string
          quiz_id: string
          tests_passed?: number | null
          tests_total?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          passed?: boolean | null
          question_id?: string
          quiz_id?: string
          tests_passed?: number | null
          tests_total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      corporate_scenarios: {
        Row: {
          completed: boolean | null
          context: string
          created_at: string
          feedback: string | null
          goal: string
          id: string
          scenario_name: string
          scenario_type: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          context: string
          created_at?: string
          feedback?: string | null
          goal: string
          id?: string
          scenario_name: string
          scenario_type: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          context?: string
          created_at?: string
          feedback?: string | null
          goal?: string
          id?: string
          scenario_name?: string
          scenario_type?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenges: Json
          created_at: string | null
          id: string
          problem_1_completed: boolean | null
          problem_2_completed: boolean | null
          problem_3_completed: boolean | null
          problem_4_completed: boolean | null
          problem_5_completed: boolean | null
          total_xp_earned: number | null
          user_id: string
        }
        Insert: {
          challenge_date: string
          challenges?: Json
          created_at?: string | null
          id?: string
          problem_1_completed?: boolean | null
          problem_2_completed?: boolean | null
          problem_3_completed?: boolean | null
          problem_4_completed?: boolean | null
          problem_5_completed?: boolean | null
          total_xp_earned?: number | null
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenges?: Json
          created_at?: string | null
          id?: string
          problem_1_completed?: boolean | null
          problem_2_completed?: boolean | null
          problem_3_completed?: boolean | null
          problem_4_completed?: boolean | null
          problem_5_completed?: boolean | null
          total_xp_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      fullstack_profiles: {
        Row: {
          assessment_completed: boolean | null
          backend_score: number | null
          code_quality_score: number | null
          created_at: string
          devops_score: number | null
          frontend_score: number | null
          fullstack_level: string | null
          id: string
          overall_score: number | null
          problem_solving_score: number | null
          system_design_score: number | null
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_completed?: boolean | null
          backend_score?: number | null
          code_quality_score?: number | null
          created_at?: string
          devops_score?: number | null
          frontend_score?: number | null
          fullstack_level?: string | null
          id?: string
          overall_score?: number | null
          problem_solving_score?: number | null
          system_design_score?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_completed?: boolean | null
          backend_score?: number | null
          code_quality_score?: number | null
          created_at?: string
          devops_score?: number | null
          frontend_score?: number | null
          fullstack_level?: string | null
          id?: string
          overall_score?: number | null
          problem_solving_score?: number | null
          system_design_score?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fullstack_scenario_progress: {
        Row: {
          code_score: number | null
          communication_score: number | null
          completed_at: string
          created_at: string
          duration_seconds: number | null
          feedback_summary: string | null
          id: string
          overall_score: number | null
          scenario_id: string
          user_id: string
        }
        Insert: {
          code_score?: number | null
          communication_score?: number | null
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          feedback_summary?: string | null
          id?: string
          overall_score?: number | null
          scenario_id: string
          user_id: string
        }
        Update: {
          code_score?: number | null
          communication_score?: number | null
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          feedback_summary?: string | null
          id?: string
          overall_score?: number | null
          scenario_id?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          created_at: string
          id: string
          marked_understood: boolean | null
          quiz_passed: boolean | null
          replay_count: number | null
          total_seconds: number
          updated_at: string
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          marked_understood?: boolean | null
          quiz_passed?: boolean | null
          replay_count?: number | null
          total_seconds: number
          updated_at?: string
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          marked_understood?: boolean | null
          quiz_passed?: boolean | null
          replay_count?: number | null
          total_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_completed: boolean | null
          clarity_score: number | null
          communication_level: string | null
          confidence_score: number | null
          created_at: string
          domain: string | null
          filler_words_score: number | null
          fluency_score: number | null
          full_name: string | null
          grammar_score: number | null
          id: string
          overall_score: number | null
          path_type: string | null
          structure_score: number | null
          tone_score: number | null
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_completed?: boolean | null
          clarity_score?: number | null
          communication_level?: string | null
          confidence_score?: number | null
          created_at?: string
          domain?: string | null
          filler_words_score?: number | null
          fluency_score?: number | null
          full_name?: string | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          path_type?: string | null
          structure_score?: number | null
          tone_score?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_completed?: boolean | null
          clarity_score?: number | null
          communication_level?: string | null
          confidence_score?: number | null
          created_at?: string
          domain?: string | null
          filler_words_score?: number | null
          fluency_score?: number | null
          full_name?: string | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          path_type?: string | null
          structure_score?: number | null
          tone_score?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          max_score: number
          quiz_type: string
          score: number
          time_taken_seconds: number | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          max_score: number
          quiz_type: string
          score: number
          time_taken_seconds?: number | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          max_score?: number
          quiz_type?: string
          score?: number
          time_taken_seconds?: number | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: []
      }
      scenario_progress: {
        Row: {
          clarity_score: number | null
          completed_at: string
          confidence_score: number | null
          created_at: string
          duration_seconds: number | null
          feedback_summary: string | null
          filler_words_score: number | null
          fluency_score: number | null
          grammar_score: number | null
          id: string
          overall_score: number | null
          scenario_id: string
          structure_score: number | null
          tone_score: number | null
          user_id: string
        }
        Insert: {
          clarity_score?: number | null
          completed_at?: string
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback_summary?: string | null
          filler_words_score?: number | null
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          scenario_id: string
          structure_score?: number | null
          tone_score?: number | null
          user_id: string
        }
        Update: {
          clarity_score?: number | null
          completed_at?: string
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback_summary?: string | null
          filler_words_score?: number | null
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          overall_score?: number | null
          scenario_id?: string
          structure_score?: number | null
          tone_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          streak_badge: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak_badge?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak_badge?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_hidden_metrics: {
        Row: {
          ai_hints_used: number | null
          created_at: string
          id: string
          learning_speed: number | null
          precision_score: number | null
          skill_radar: Json | null
          strong_areas: Json | null
          updated_at: string
          user_id: string
          weak_areas: Json | null
        }
        Insert: {
          ai_hints_used?: number | null
          created_at?: string
          id?: string
          learning_speed?: number | null
          precision_score?: number | null
          skill_radar?: Json | null
          strong_areas?: Json | null
          updated_at?: string
          user_id: string
          weak_areas?: Json | null
        }
        Update: {
          ai_hints_used?: number | null
          created_at?: string
          id?: string
          learning_speed?: number | null
          precision_score?: number | null
          skill_radar?: Json | null
          strong_areas?: Json | null
          updated_at?: string
          user_id?: string
          weak_areas?: Json | null
        }
        Relationships: []
      }
      user_roadmaps: {
        Row: {
          completed_lessons: Json
          created_at: string
          current_level: string
          id: string
          roadmap_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: Json
          created_at?: string
          current_level: string
          id?: string
          roadmap_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: Json
          created_at?: string
          current_level?: string
          id?: string
          roadmap_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_library: {
        Row: {
          average_rating: number | null
          created_at: string | null
          difficulty: string | null
          duration_seconds: number | null
          format: string | null
          id: string
          title: string
          topic: string | null
          url: string | null
          view_count: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          format?: string | null
          id?: string
          title: string
          topic?: string | null
          url?: string | null
          view_count?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          format?: string | null
          id?: string
          title?: string
          topic?: string | null
          url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          ava_feedback: string | null
          clarity_score: number | null
          confidence_score: number | null
          created_at: string
          duration_seconds: number | null
          filler_words_count: number | null
          fluency_score: number | null
          grammar_score: number | null
          id: string
          scenario_id: string | null
          session_type: string
          structure_score: number | null
          tone_score: number | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          ava_feedback?: string | null
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          filler_words_count?: number | null
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          scenario_id?: string | null
          session_type: string
          structure_score?: number | null
          tone_score?: number | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          ava_feedback?: string | null
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          filler_words_count?: number | null
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          scenario_id?: string | null
          session_type?: string
          structure_score?: number | null
          tone_score?: number | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xp_levels: {
        Row: {
          level_name: string | null
          level_number: number | null
          next_level_xp: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          level_name?: string | null
          level_number?: number | null
          next_level_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          level_name?: string | null
          level_number?: number | null
          next_level_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
