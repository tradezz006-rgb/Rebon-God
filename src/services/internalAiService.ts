import { supabase } from "@/integrations/supabase/client";
import { NanoVideo } from "@/data/learningContent";
import { geminiGenerateJson } from "@/lib/geminiClient";
import { logger } from "@/lib/logger";

type SkillRadar = {
  communication: number;
  technical: number;
  problem_solving: number;
  confidence: number;
};

type LessonEvalAnalysis = {
  learning_speed?: number;
  precision_score?: number;
  updated_radar?: SkillRadar;
  strong_areas?: string[];
  weak_areas?: string[];
  makeup_lesson?: NanoVideo | null;
};

export const internalAiService = {
  /**
   * Generates a completely dynamic, personalized 5-lesson curriculum based on the
   * user's initial assessment scores, tailoring the content specifically to their weak areas.
   */
  async generateInitialRoadmap(userId: string, assessmentData: unknown) {
    logger.info("internalAi", "Analyzing assessment data and generating roadmap...");

    const prompt = `You are an expert Educational AI Architect. 
    Analyze the following user assessment data: ${JSON.stringify(assessmentData)}
    
    Create a personalized 5-lesson curriculum (Roadmap) for this student to transition into the professional world.
    
    Output ONLY a valid JSON array of objects matching this exact structure for each lesson:
    {
       "id": "unique-id-string",
       "title": "Lesson Title",
       "description": "What they will learn",
       "duration": "10 min",
       "durationSeconds": 600,
       "category": "fundamentals" | "confidence" | "structure" | "professional" | "advanced",
       "level": "beginner" | "moderate" | "pro" | "ultra_pro",
       "keyPoints": ["point 1", "point 2"],
       "quiz": [
          { "id": "q1", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }
       ],
       "taskAssessment": {
          "id": "t1", "title": "Task Title", "prompt": "Task instructions for the whiteboard", "timeLimit": 60, "evaluationCriteria": ["c1", "c2"]
       }
    }
    
    Make the lessons adaptive to their weaknesses and realistic for a corporate/tech context. Return ONLY JSON.`;

    try {
      const roadmapData = await geminiGenerateJson<NanoVideo[]>({
        prompt,
        temperature: 0.7,
      });
      const roadmap = Array.isArray(roadmapData) ? roadmapData : [];

      const { error: dbError } = await supabase.from("user_roadmaps").upsert({
        user_id: userId,
        current_level: "Student",
        roadmap_json: roadmap,
        completed_lessons: [],
      });

      if (dbError) {
        logger.error("internalAi", "Error saving roadmap to DB", dbError);
      }
      return roadmap;
    } catch (err) {
      logger.error("internalAi", "Failed to generate/parse roadmap JSON", err);
      return [];
    }
  },

  /**
   * Silently tracks learning metrics after a lesson and dynamically modifies the skill
   * radar and future syllabus without the user seeing it directly.
   */
  async evaluateLessonPerformance(
    userId: string,
    lessonId: string,
    metrics: {
      timeSpentSeconds: number;
      hintsUsed: number;
      quizScore: number;
      maxScore: number;
      struggles: string[];
    }
  ) {
    logger.info("internalAi", "Evaluating lesson performance in background...");

    const { data: metricsData } = await supabase
      .from("user_hidden_metrics")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: roadmapData } = await supabase
      .from("user_roadmaps")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const currentRadar: SkillRadar = (metricsData?.skill_radar as SkillRadar) || {
      communication: 50,
      technical: 50,
      problem_solving: 50,
      confidence: 50,
    };

    const prompt = `You are a hidden AI Analytics Engine. 
     The user just finished lesson ${lessonId} with these metrics:
     ${JSON.stringify(metrics)}
     
     Current Skill Radar: ${JSON.stringify(currentRadar)}
     
     Evaluate their learning speed, precision, and adjust their skill radar (0-100 scale for technical, communication, problem_solving, confidence) based on the metrics. 
     A high time Spent with low quizScore indicates they struggled. Good score fast means they are strong.
     Identify 2 strong areas and 2 weak areas based on their stats and struggles array.
     
     If their performance is poor (score < 60%), suggest ONE new makeup 'NanoVideo' object to inject into their roadmap JSON to reinforce the topic. If good, return "null" for the makeup_lesson.
     
     Return ONLY a JSON object:
     {
        "learning_speed": 1.5,
        "precision_score": 85.5,
        "updated_radar": { "technical": 50, "communication": 60, "problem_solving": 55, "confidence": 40 },
        "strong_areas": ["string"],
        "weak_areas": ["string"],
        "makeup_lesson": null
     }
     `;

    try {
      const analysis = await geminiGenerateJson<LessonEvalAnalysis>({
        prompt,
        temperature: 0.4,
      });

      await supabase.from("user_hidden_metrics").upsert({
        user_id: userId,
        learning_speed: analysis.learning_speed || 0,
        precision_score: analysis.precision_score || 0,
        ai_hints_used: (metricsData?.ai_hints_used || 0) + metrics.hintsUsed,
        skill_radar: analysis.updated_radar || currentRadar,
        strong_areas: analysis.strong_areas || [],
        weak_areas: analysis.weak_areas || [],
      });

      if (roadmapData) {
        const completed = [
          ...((roadmapData.completed_lessons as string[]) || []),
          lessonId,
        ];
        let currentRoadmap: unknown[] = Array.isArray(roadmapData.roadmap_json)
          ? [...(roadmapData.roadmap_json as unknown[])]
          : [];

        if (analysis.makeup_lesson) {
          logger.info("internalAi", "Inserting dynamic makeup lesson");
          currentRoadmap.push(analysis.makeup_lesson);
        }

        await supabase
          .from("user_roadmaps")
          .update({
            completed_lessons: completed,
            roadmap_json: currentRoadmap,
          })
          .eq("user_id", userId);
      }

      return analysis;
    } catch (err) {
      logger.error("internalAi", "Failed to parse analytics JSON", err);
      return null;
    }
  },
};
