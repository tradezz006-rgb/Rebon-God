import { Cloud, Code, Database, Globe, Lock, Settings, Server, Terminal } from "lucide-react";
import { fresherLessons } from "./cloud/fresher";

export interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  personality: string;
}

export interface Scenario {
  id: string;
  type: string;
  name: string;
  context: string;
  goal: string;
  icon: any;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  category: string;
  duration: string;
  participants: Participant[];
  setting: "meeting" | "interview" | "presentation" | "call" | "boardroom" | "debugging";
  tasks?: any[]; // The specific problems/scenarios for this lesson
}

export interface Assessment {
  id: string;
  name: string;
  description: string;
  icon: any;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  duration: string;
  questionCount: number;
}

// Generate scenarios from the lesson JSON workspace tasks.
export const scenarios: Scenario[] = [];
export const assessments: Assessment[] = [];

if (fresherLessons.length > 0) {
  fresherLessons.forEach((lessonData: any) => {
    const lessonId = lessonData.lesson_id;
    if (lessonData && lessonData.workspace_tasks && lessonData.workspace_tasks.length > 0) {
      
      const difficultyMap: Record<string, "Beginner" | "Intermediate" | "Advanced" | "Expert"> = {
        "easy": "Beginner",
        "medium": "Intermediate",
        "hard": "Advanced",
        "expert": "Expert"
      };

      // Determine max difficulty across tasks
      let maxDiffStr = "Beginner";
      lessonData.workspace_tasks.forEach((task: any) => {
        if (task.difficulty === "medium" && maxDiffStr === "Beginner") maxDiffStr = "Intermediate";
        if (task.difficulty === "hard" && (maxDiffStr === "Beginner" || maxDiffStr === "Intermediate")) maxDiffStr = "Advanced";
        if (task.difficulty === "expert") maxDiffStr = "Expert";
      });

      scenarios.push({
        id: lessonId,
        type: "cloud_workspace",
        name: `Lesson ${lessonId} Challenge`,
        context: `Apply your knowledge from Lesson ${lessonId} in this interactive cloud engineering sandbox.`,
        goal: `Complete all ${lessonData.workspace_tasks.length} tasks to solidify your cloud foundation.`,
        icon: Cloud,
        difficulty: maxDiffStr as any,
        category: "Cloud Challenge",
        duration: "15 min",
        participants: [],
        setting: "debugging",
        tasks: lessonData.workspace_tasks,
      });
    }
  });
}
