/**
 * Complete cloud lesson catalog — 43 lessons.
 * Fresher = CS1 + CS1B (10)
 * Building Basics = CS2–CS7 (33)
 * Building Basics lesson plan (CS2–CS7). Content ships as JSON under building_basics/.
 */

export type PaceId = "fresher" | "building_basics";

export interface LessonPlanEntry {
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  section_name: string;
  pace: PaceId;
  duration_minutes: number;
  prerequisites: string;
  workspace_task_count: number;
}

export const CLOUD_LESSON_PLAN: LessonPlanEntry[] = [
  // ── FRESHER · CS1 ──────────────────────────────────────────────
  {
    lesson_id: "C1.1",
    lesson_title: "What is Cloud Computing",
    section_id: "CS1",
    section_name: "Cloud Foundations",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "None",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C1.2",
    lesson_title: "AWS Global Infrastructure",
    section_id: "CS1",
    section_name: "Cloud Foundations",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1.1",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C1.3",
    lesson_title: "AWS Console Navigation",
    section_id: "CS1",
    section_name: "Cloud Foundations",
    pace: "fresher",
    duration_minutes: 17,
    prerequisites: "C1.2",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C1.4",
    lesson_title: "Billing, Cost Explorer, and Budget Alerts",
    section_id: "CS1",
    section_name: "Cloud Foundations",
    pace: "fresher",
    duration_minutes: 20,
    prerequisites: "C1.3",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C1.5",
    lesson_title: "Shared Responsibility Model",
    section_id: "CS1",
    section_name: "Cloud Foundations",
    pace: "fresher",
    duration_minutes: 17,
    prerequisites: "C1.4",
    workspace_task_count: 5,
  },
  // ── FRESHER · CS1B ─────────────────────────────────────────────
  {
    lesson_id: "C1B.1",
    lesson_title: "EC2 — Rented Computers",
    section_id: "CS1B",
    section_name: "Core Services Awareness",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1.5",
    workspace_task_count: 4,
  },
  {
    lesson_id: "C1B.2",
    lesson_title: "S3 — Cloud Hard Drives",
    section_id: "CS1B",
    section_name: "Core Services Awareness",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1B.1",
    workspace_task_count: 3,
  },
  {
    lesson_id: "C1B.3",
    lesson_title: "IAM — Keycard Access",
    section_id: "CS1B",
    section_name: "Core Services Awareness",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1B.2",
    workspace_task_count: 3,
  },
  {
    lesson_id: "C1B.4",
    lesson_title: "VPC — Private Floors",
    section_id: "CS1B",
    section_name: "Core Services Awareness",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1B.3",
    workspace_task_count: 3,
  },
  {
    lesson_id: "C1B.5",
    lesson_title: "CloudWatch — Alarm Systems",
    section_id: "CS1B",
    section_name: "Core Services Awareness",
    pace: "fresher",
    duration_minutes: 18,
    prerequisites: "C1B.4",
    workspace_task_count: 3,
  },
  // ── BUILDING BASICS · CS2 ──────────────────────────────────────
  {
    lesson_id: "C2.1a",
    lesson_title: "IAM Users and Groups",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "CS1B complete (Fresher transition passed)",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C2.1b",
    lesson_title: "IAM Policies and Roles",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C2.1a",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C2.2",
    lesson_title: "Writing IAM Policies",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C2.1b",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C2.3",
    lesson_title: "Principle of Least Privilege",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C2.2",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C2.4",
    lesson_title: "IAM Roles for Services",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C2.3",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C2.5",
    lesson_title: "MFA, Password Policies, AWS Organizations",
    section_id: "CS2",
    section_name: "IAM Hands-on",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C2.4",
    workspace_task_count: 6,
  },
  // ── BUILDING BASICS · CS3 ──────────────────────────────────────
  {
    lesson_id: "C3.1",
    lesson_title: "VPC Fundamentals",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "CS2 complete",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C3.2a",
    lesson_title: "Subnets — Public vs Private",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C3.1",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C3.2b",
    lesson_title: "Multi-AZ Design and High Availability",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 17,
    prerequisites: "C3.2a",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C3.3",
    lesson_title: "Internet Gateway, NAT Gateway, Route Tables",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C3.2b",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C3.4",
    lesson_title: "Security Groups vs NACLs",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C3.3",
    workspace_task_count: 7,
  },
  {
    lesson_id: "C3.5",
    lesson_title: "VPC Peering and Transit Gateway",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C3.4",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C3.6",
    lesson_title: "Route 53 — DNS on AWS",
    section_id: "CS3",
    section_name: "Networking",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C3.5",
    workspace_task_count: 5,
  },
  // ── BUILDING BASICS · CS4 ──────────────────────────────────────
  {
    lesson_id: "C4.1",
    lesson_title: "EC2 Instance Types",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "CS3 complete",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C4.2a",
    lesson_title: "Launching EC2 Instances",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C4.1",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C4.2b",
    lesson_title: "Managing EC2 Instances",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 17,
    prerequisites: "C4.2a",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C4.3",
    lesson_title: "AMIs, Snapshots, and Launch Templates",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C4.2b",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C4.4",
    lesson_title: "Elastic Load Balancing",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C4.3",
    workspace_task_count: 7,
  },
  {
    lesson_id: "C4.5",
    lesson_title: "Auto Scaling Groups",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C4.4",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C4.6",
    lesson_title: "EC2 Pricing Models",
    section_id: "CS4",
    section_name: "Compute",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C4.5",
    workspace_task_count: 6,
  },
  // ── BUILDING BASICS · CS5 ──────────────────────────────────────
  {
    lesson_id: "C5.1a",
    lesson_title: "S3 Basics — Buckets and Objects",
    section_id: "CS5",
    section_name: "Storage",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "CS4 complete",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C5.1b",
    lesson_title: "S3 Storage Classes and Lifecycle",
    section_id: "CS5",
    section_name: "Storage",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C5.1a",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C5.2",
    lesson_title: "S3 Security",
    section_id: "CS5",
    section_name: "Storage",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "C5.1b",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C5.3",
    lesson_title: "EBS Volumes",
    section_id: "CS5",
    section_name: "Storage",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C5.2",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C5.4",
    lesson_title: "EFS and S3 Glacier Vault",
    section_id: "CS5",
    section_name: "Storage",
    pace: "building_basics",
    duration_minutes: 17,
    prerequisites: "C5.3",
    workspace_task_count: 5,
  },
  // ── BUILDING BASICS · CS6 ──────────────────────────────────────
  {
    lesson_id: "C6.1",
    lesson_title: "CloudWatch Metrics and Logs",
    section_id: "CS6",
    section_name: "Monitoring",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "CS5 complete",
    workspace_task_count: 6,
  },
  {
    lesson_id: "C6.2",
    lesson_title: "CloudWatch Alarms and SNS",
    section_id: "CS6",
    section_name: "Monitoring",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C6.1",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C6.3",
    lesson_title: "CloudTrail — Audit Logging",
    section_id: "CS6",
    section_name: "Monitoring",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C6.2",
    workspace_task_count: 5,
  },
  {
    lesson_id: "C6.4",
    lesson_title: "AWS Config and Trusted Advisor",
    section_id: "CS6",
    section_name: "Monitoring",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C6.3",
    workspace_task_count: 5,
  },
  // ── BUILDING BASICS · CS7 ──────────────────────────────────────
  {
    lesson_id: "C7.1",
    lesson_title: "Design a 3-Tier Architecture",
    section_id: "CS7",
    section_name: "Portfolio Project",
    pace: "building_basics",
    duration_minutes: 20,
    prerequisites: "CS6 complete",
    workspace_task_count: 4,
  },
  {
    lesson_id: "C7.2",
    lesson_title: "Build the Network Layer",
    section_id: "CS7",
    section_name: "Portfolio Project",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C7.1",
    workspace_task_count: 4,
  },
  {
    lesson_id: "C7.3",
    lesson_title: "Deploy the Application Layer",
    section_id: "CS7",
    section_name: "Portfolio Project",
    pace: "building_basics",
    duration_minutes: 19,
    prerequisites: "C7.2",
    workspace_task_count: 4,
  },
  {
    lesson_id: "C7.4",
    lesson_title: "Monitor, Document, and Present",
    section_id: "CS7",
    section_name: "Portfolio Project",
    pace: "building_basics",
    duration_minutes: 18,
    prerequisites: "C7.3",
    workspace_task_count: 4,
  },
];

export const FRESHER_LESSONS = CLOUD_LESSON_PLAN.filter((l) => l.pace === "fresher");
export const BUILDING_BASICS_LESSONS = CLOUD_LESSON_PLAN.filter(
  (l) => l.pace === "building_basics"
);

export const TOTAL_LESSON_COUNT = CLOUD_LESSON_PLAN.length; // 43

export const SESSION_ORDER = [
  "CS1",
  "CS1B",
  "CS2",
  "CS3",
  "CS4",
  "CS5",
  "CS6",
  "CS7",
] as const;

export const FRESHER_SESSION_IDS = ["CS1", "CS1B"] as const;
export const BUILDING_BASICS_SESSION_IDS = [
  "CS2",
  "CS3",
  "CS4",
  "CS5",
  "CS6",
  "CS7",
] as const;

export const BUILDING_BASICS_FIRST_LESSON = "C2.1a";

export function assertPlanCounts() {
  if (TOTAL_LESSON_COUNT !== 43) {
    throw new Error(`Expected 43 lessons, got ${TOTAL_LESSON_COUNT}`);
  }
  if (FRESHER_LESSONS.length !== 10) {
    throw new Error(`Expected 10 fresher lessons, got ${FRESHER_LESSONS.length}`);
  }
  if (BUILDING_BASICS_LESSONS.length !== 33) {
    throw new Error(
      `Expected 33 building_basics lessons, got ${BUILDING_BASICS_LESSONS.length}`
    );
  }
}
