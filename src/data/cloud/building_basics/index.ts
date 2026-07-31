/**
 * BUILDING BASICS — CS2–CS7
 * Lessons: ./tanglish/cs2 … ./tanglish/cs7 (English stubs under ./english/)
 * Workspaces: ./cs2 … ./cs7 `{lessonId}_workspace.json` (pure English tickets)
 */
import {
  BUILDING_BASICS_FIRST_LESSON as PLAN_FIRST,
  BUILDING_BASICS_SESSION_IDS,
  BUILDING_BASICS_LESSONS,
} from "../curriculumPlan";
import { loadGlobLessons } from "../loadLessonJson";
import {
  loadWorkspaceGlob,
  getWorkspaceTasksForLesson,
} from "../loadWorkspaceJson";

export const BUILDING_BASICS_PACE = "building_basics" as const;
export const BUILDING_BASICS_FIRST_LESSON = PLAN_FIRST;

const bbLessonModules = import.meta.glob<
  { default: Record<string, unknown> } | Record<string, unknown>
>("./tanglish/cs{2,3,4,5,6,7}/*.json", { eager: true });

const bbWorkspaceModules = import.meta.glob<
  { default: Record<string, unknown> } | Record<string, unknown>
>("./cs{2,3,4,5,6,7}/*_workspace.json", { eager: true });

const byId = loadGlobLessons(bbLessonModules, "building_basics");

const workspaceById = loadWorkspaceGlob(
  bbWorkspaceModules as Record<
    string,
    | {
        default: {
          lesson_id?: string;
          total_tasks?: number;
          tasks?: Record<string, unknown>[];
        };
      }
    | {
        lesson_id?: string;
        total_tasks?: number;
        tasks?: Record<string, unknown>[];
      }
  >
);

/** Lessons that have a JSON file on disk (CS2–CS7 as content ships). */
export const buildingBasicsLessons = BUILDING_BASICS_LESSONS.filter(
  (entry) => byId[entry.lesson_id]
).map((entry) => {
  const lesson = byId[entry.lesson_id];
  const ws = workspaceById[entry.lesson_id];
  const workspace_tasks = ws?.tasks?.length
    ? ws.tasks
    : (lesson.workspace_tasks as unknown[]) || [];
  return {
    ...lesson,
    workspace_tasks,
    workspace_metadata: lesson.workspace_metadata || {
      workspace_id: `WS_${entry.lesson_id}`,
      lesson_id: entry.lesson_id,
      title: `${entry.lesson_id} workspace`,
      type: "scenario_task_set",
    },
  };
});

export const buildingBasicsWorkspaceTasks = {
  pace: "building_basics" as const,
  domain: "cloud",
  lessons: Object.fromEntries(
    Object.entries(workspaceById).map(([id, pack]) => [
      id,
      { workspace_tasks: pack.tasks, total_tasks: pack.total_tasks },
    ])
  ),
};

/** Story-mode act headers, keyed by lesson id (only story workspaces have one). */
export const buildingBasicsWorkspaceArcs = Object.fromEntries(
  Object.entries(workspaceById)
    .filter(([, pack]) => pack.arc)
    .map(([id, pack]) => [id, pack.arc!])
);

export function getBuildingBasicsWorkspaceArc(lessonId: string) {
  return buildingBasicsWorkspaceArcs[lessonId];
}

export function getBuildingBasicsWorkspaceTasks(lessonId: string) {
  return getWorkspaceTasksForLesson(
    Object.fromEntries(
      Object.entries(buildingBasicsWorkspaceTasks.lessons).map(([id, l]) => [
        id,
        { tasks: l.workspace_tasks },
      ])
    ),
    lessonId
  );
}

export const BUILDING_BASICS_LESSON_ORDER = buildingBasicsLessons.map(
  (l) => l.lesson_id
);

const SESSION_META: Record<
  string,
  { session_name: string; session_description: string }
> = {
  CS2: {
    session_name: "CS2 — IAM Hands-on",
    session_description:
      "Users, groups, policies, roles, least privilege, MFA, Organizations.",
  },
  CS3: {
    session_name: "CS3 — Networking",
    session_description: "VPC, subnets, gateways, security groups, Route 53.",
  },
  CS4: {
    session_name: "CS4 — Compute",
    session_description: "EC2, AMIs, load balancing, Auto Scaling, pricing.",
  },
  CS5: {
    session_name: "CS5 — Storage",
    session_description: "S3, EBS, EFS, Glacier.",
  },
  CS6: {
    session_name: "CS6 — Monitoring",
    session_description: "CloudWatch, CloudTrail, Config, Trusted Advisor.",
  },
  CS7: {
    session_name: "CS7 — Portfolio Project",
    session_description: "Design, build, monitor, document, present.",
  },
};

export const buildingBasicsSessions = BUILDING_BASICS_SESSION_IDS.map(
  (sessionId) => {
    const meta = SESSION_META[sessionId];
    const lessons = buildingBasicsLessons.filter(
      (l) => l.section_id === sessionId
    );
    return {
      session_id: sessionId,
      session_name: meta.session_name,
      session_description: meta.session_description,
      pace: BUILDING_BASICS_PACE,
      program: "Rebon Student Mode",
      domain: "cloud",
      language: "tanglish",
      total_lessons: lessons.length,
      lessons,
    };
  }
);

export function getBuildingBasicsLesson(id: string) {
  return buildingBasicsLessons.find(
    (l) => l.lesson_id === id || l.id === id
  );
}

export { BUILDING_BASICS_SESSION_IDS };

export default buildingBasicsSessions;
