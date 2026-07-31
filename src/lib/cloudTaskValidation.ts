export interface CloudTask {
  task_id: string;
  type: string;
  ui_component?: string;
  correct_index?: number;
  solution?: string;
  question?: string;
  acceptance_keywords?: string[];
}

const CONSOLE_KEYWORDS: Record<string, string[]> = {
  "C1.1-T3": ["ec2", "terminate", "pay", "hour", "rent", "opx", "4 hour"],
  "C1.1-T4": ["auto-scal", "scale", "ec2", "traffic", "spike", "elastic"],
  "C1.2-T2": ["eu-central", "eu-west", "frankfurt", "london", "europe", "eu-", "latency", "user", "client"],
  "C1.2-T3": ["multi-az", "multiaz", "multi az", "availability zone", "failover", "single point"],
  "C1.2-T4": ["cloudfront", "edge", "cdn", "cache"],
  "C1.3-T3": ["account menu", "billing", "top-right", "profile", "dropdown", "account id"],
  "C1.4-T2": ["cloudfront", "s3", "transfer", "egress", "cache", "origin", "cdn"],
  "C1.4-T4": ["tag", "cost allocation", "cost explorer", "owner", "environment"],
  "C1.5-T5": ["shared responsibility", "customer", "security group", "cannot sue", "misconfigur"],
};

const DEBUG_KEYWORDS: Record<string, string[]> = {
  "C1.1-T5": ["terminate", "budget", "alert"],
  "C1.2-T5": ["us-east-1", "region", "ap-south-1", "mumbai"],
  "C1.3-T4": ["resource group", "region", "us-east", "terminate", "global"],
  "C1.4-T3": ["subscriber", "notification", "anomaly", "budget", "alert", "finance"],
  "C1.4-T6": ["currency", "inr", "usd", "rupee", "dollar", "threshold"],
  "C1.5-T3": ["customer", "responsibility"],
  "C1.5-T4": ["customer", "shared responsibility", "security group", "0.0.0.0"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  const matched = keywords.filter((k) => n.includes(k.toLowerCase()));
  return matched.length >= Math.min(2, keywords.length);
}

export function validateQuizAnswer(task: CloudTask, selectedIndex: number): boolean {
  return selectedIndex === task.correct_index;
}

export function validateConsoleAnswer(task: CloudTask, answer: string): { valid: boolean; hint?: string } {
  const keywords = task.acceptance_keywords ?? CONSOLE_KEYWORDS[task.task_id];
  if (!keywords?.length) {
    if (task.solution && answer.trim().length >= 20) {
      return { valid: matchesKeywords(answer, task.solution.split(/\s+/).slice(0, 8)) };
    }
    return { valid: false, hint: "Give a complete technical answer — region, service, or action." };
  }
  if (matchesKeywords(answer, keywords)) return { valid: true };
  return { valid: false, hint: "Answer missing key concepts. Check Mission Objectives and try again." };
}

export function validateDebugAnswer(task: CloudTask, answer: string): { valid: boolean; hint?: string } {
  const keywords = task.acceptance_keywords ?? DEBUG_KEYWORDS[task.task_id];
  if (!keywords?.length) {
    if (task.solution) return { valid: matchesKeywords(answer, normalize(task.solution).split(" ").slice(0, 6)) };
    return { valid: answer.trim().length >= 15 };
  }
  if (matchesKeywords(answer, keywords)) return { valid: true };
  return { valid: false, hint: "Root cause or fix incomplete. Name the AWS service or action required." };
}

export function validateFreeTextAnswer(task: CloudTask, answer: string): { valid: boolean; hint?: string } {
  if (task.type === "cost_analysis") {
    return validateConsoleAnswer(task, answer);
  }
  if (task.type === "debug_task" || task.type === "config_audit") {
    return validateDebugAnswer(task, answer);
  }
  if (task.type === "scenario_task" || task.ui_component === "ConsoleInteractionComponent") {
    return validateConsoleAnswer(task, answer);
  }
  return { valid: answer.trim().length >= 10 };
}
