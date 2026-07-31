export interface PhoenixTicketMeta {
  label: string;
  category: "incident" | "infra" | "finops" | "compliance" | "security";
  priority: "P1" | "P2" | "P3";
}

export interface LessonMission {
  lessonId: string;
  title: string;
  architectureLevel: number;
  renIntro: string;
  missionBrief: string;
  completionRen: string;
  completionHeadline: string;
  tickets: Record<string, PhoenixTicketMeta>;
}

export const PHOENIX_COMPANY = {
  name: "FreshBite",
  tagline: "Chennai Food Delivery Startup",
  crisis:
    "Peak lunch hour crash. On-prem servers down. 40,000 orders lost in 90 minutes. CEO mandates AWS migration in 30 days.",
  goal: "Build production-ready AWS architecture in ap-south-1 — secure, cost-controlled, and fast for Indian users.",
};

export const SESSION_FINALE = {
  renSpeaks:
    "Project Phoenix live! FreshBite architecture deployed — Mumbai region, Multi-AZ, budget alerts, security hardened. Day 1 at any company, this is exactly what you'll open.",
  headline: "ARCHITECTURE DEPLOYED · STARTUP SAVED",
};

export const LESSON_MISSIONS: Record<string, LessonMission> = {
  "C1.1": {
    lessonId: "C1.1",
    title: "Cloud Foundations & First Compute",
    architectureLevel: 1,
    renIntro:
      "FreshBite servers crashed during lunch rush. First job: understand cloud economics and stop the ₹80K ghost EC2 bleed.",
    missionBrief: "Close FinOps incidents and prove cloud beats on-prem for variable traffic.",
    completionRen: "First EC2 node is live. CapEx is gone. Auto-scaling path is clear.",
    completionHeadline: "Compute layer online",
    tickets: {
      "C1.1-T1": { label: "TICKET-101: CapEx → OpEx shift", category: "compliance", priority: "P3" },
      "C1.1-T2": { label: "TICKET-102: Physical DC verification", category: "compliance", priority: "P3" },
      "C1.1-T3": { label: "FIN-201: 4hr batch cost model", category: "finops", priority: "P2" },
      "C1.1-T4": { label: "SCALE-301: Flash sale spike", category: "infra", priority: "P2" },
      "C1.1-T5": { label: "INV-80K: Ghost EC2 instances", category: "incident", priority: "P1" },
    },
  },
  "C1.2": {
    lessonId: "C1.2",
    title: "Global Infrastructure & Regions",
    architectureLevel: 2,
    renIntro:
      "Users getting 240ms latency because someone deployed in us-east-1. Wire Mumbai region and Multi-AZ before next lunch rush.",
    missionBrief: "Fix region placement, high availability, and CDN edge strategy.",
    completionRen: "Mumbai region active. Two AZs connected. CloudFront edge ready for global users.",
    completionHeadline: "Multi-AZ Mumbai region live",
    tickets: {
      "C1.2-T1": { label: "AUDIT-401: Region definition", category: "compliance", priority: "P3" },
      "C1.2-T2": { label: "ARCH-402: EU client region pick", category: "infra", priority: "P1" },
      "C1.2-T3": { label: "DR-403: Single-AZ outage", category: "incident", priority: "P1" },
      "C1.2-T4": { label: "CDN-404: Global video delivery", category: "infra", priority: "P2" },
      "C1.2-T5": { label: "LAT-405: 240ms latency debug", category: "incident", priority: "P1" },
    },
  },
  "C1.3": {
    lessonId: "C1.3",
    title: "Console Navigation & Account Ops",
    architectureLevel: 3,
    renIntro:
      "New hire thought all resources vanished — wrong region. Learn the console cockpit and kill the ₹18K ghost resources.",
    missionBrief: "Navigate AWS Console like a day-one cloud engineer.",
    completionRen: "Console ops solid. Billing visible. Ghost resources hunted across regions.",
    completionHeadline: "Console & billing cockpit ready",
    tickets: {
      "C1.3-T1": { label: "OPS-501: Missing EC2 triage", category: "incident", priority: "P2" },
      "C1.3-T2": { label: "OPS-502: Global search shortcut", category: "compliance", priority: "P3" },
      "C1.3-T3": { label: "OPS-503: Account ID & billing", category: "finops", priority: "P2" },
      "C1.3-T4": { label: "INV-18K: Cross-region leak", category: "incident", priority: "P1" },
    },
  },
  "C1.4": {
    lessonId: "C1.4",
    title: "Billing, Cost Explorer & Budgets",
    architectureLevel: 4,
    renIntro:
      "Month 1 bill hit ₹4.7 lakh. No budget alerts. Your job: understand cost drivers and lock FinOps controls before Phoenix goes live.",
    missionBrief: "Master Cost Explorer, data transfer billing, and budget alert thresholds.",
    completionRen: "Budget shields active. Cost leaks identified. FinOps guardrails deployed.",
    completionHeadline: "FinOps controls deployed",
    tickets: {
      "C1.4-T1": { label: "FIN-601: Stopped vs EBS cost", category: "finops", priority: "P2" },
      "C1.4-T2": { label: "FIN-602: Data transfer IN/OUT", category: "finops", priority: "P2" },
      "C1.4-T3": { label: "FIN-603: Transfer spike RCA", category: "incident", priority: "P1" },
      "C1.4-T4": { label: "FIN-604: Region pricing delta", category: "finops", priority: "P3" },
      "C1.4-T5": { label: "FIN-605: Budget alert tiers", category: "finops", priority: "P1" },
      "C1.4-T6": { label: "FIN-606: INR vs USD alert bug", category: "incident", priority: "P1" },
    },
  },
  "C1.5": {
    lessonId: "C1.5",
    title: "Shared Responsibility & Security",
    architectureLevel: 5,
    renIntro:
      "Security audit before go-live. Misconfigured Security Groups almost killed FreshBite. Harden IAM and prove who owns what.",
    missionBrief: "Close security gaps under the AWS Shared Responsibility Model.",
    completionRen: "Security groups locked. Shared responsibility clear. Phoenix is production-ready.",
    completionHeadline: "Security hardened · Phoenix complete",
    tickets: {
      "C1.5-T1": { label: "SEC-701: AWS vs customer scope", category: "compliance", priority: "P2" },
      "C1.5-T2": { label: "SEC-702: App code breach owner", category: "compliance", priority: "P2" },
      "C1.5-T3": { label: "SEC-703: Audit violations", category: "security", priority: "P1" },
      "C1.5-T4": { label: "SEC-704: SG 0.0.0.0/0 misuse", category: "security", priority: "P1" },
      "C1.5-T5": { label: "SEC-705: RDS breach legal response", category: "incident", priority: "P1" },
      "C1.5-T6": { label: "SEC-706: SOC 2 misconception", category: "compliance", priority: "P3" },
    },
  },
};

const CATEGORY_LABELS: Record<PhoenixTicketMeta["category"], string> = {
  incident: "Active Incidents",
  infra: "Infrastructure Planning",
  finops: "FinOps & Billing",
  compliance: "Compliance & Audits",
  security: "Security & IAM",
};

export function buildTicketSidebar(
  tasks: { task_id: string }[],
  lessonId: string
): { category: string; items: { taskId: string; label: string; priority: string }[] }[] {
  const mission = LESSON_MISSIONS[lessonId];
  const grouped: Record<string, { taskId: string; label: string; priority: string }[]> = {};

  tasks.forEach((task) => {
    const meta = mission?.tickets[task.task_id];
    const catKey = meta?.category ?? "compliance";
    const catLabel = CATEGORY_LABELS[catKey];
    if (!grouped[catLabel]) grouped[catLabel] = [];
    grouped[catLabel].push({
      taskId: task.task_id,
      label: meta?.label ?? task.task_id,
      priority: meta?.priority ?? "P3",
    });
  });

  const order = ["Active Incidents", "Infrastructure Planning", "FinOps & Billing", "Security & IAM", "Compliance & Audits"];
  return order
    .filter((c) => grouped[c]?.length)
    .map((category) => ({ category, items: grouped[category] }));
}

export function getPhoenixProgressLevel(): number {
  const lessons = ["C1.1", "C1.2", "C1.3", "C1.4", "C1.5"];
  let level = 0;
  for (const id of lessons) {
    if (localStorage.getItem(`phoenix_progress_${id}`) === "true") level++;
    else break;
  }
  return level;
}

export function markLessonComplete(lessonId: string) {
  localStorage.setItem(`phoenix_progress_${lessonId}`, "true");
}

/** Architecture node unlocked when a workspace ticket is resolved */
export const TASK_ARCHITECTURE_UNLOCKS: Record<string, { node: string; label: string }> = {
  "C1.1-T1": { node: "economics", label: "CapEx → OpEx validated" },
  "C1.1-T4": { node: "autoscale", label: "Auto-scaling path open" },
  "C1.1-T5": { node: "ec2", label: "First EC2 node online" },
  "C1.2-T2": { node: "region", label: "Region placement set" },
  "C1.2-T3": { node: "multiaz", label: "Multi-AZ connected" },
  "C1.2-T4": { node: "cloudfront", label: "CloudFront edge live" },
  "C1.3-T2": { node: "console", label: "Console ops ready" },
  "C1.3-T4": { node: "hunt", label: "Cross-region hunt done" },
  "C1.4-T1": { node: "costexplorer", label: "Cost Explorer active" },
  "C1.4-T5": { node: "billing", label: "Budget alerts armed" },
  "C1.5-T4": { node: "security", label: "Security groups hardened" },
};

export function getUnlockedNodes(completedTaskIds: string[]): string[] {
  return completedTaskIds
    .map((id) => TASK_ARCHITECTURE_UNLOCKS[id]?.node)
    .filter(Boolean) as string[];
}
