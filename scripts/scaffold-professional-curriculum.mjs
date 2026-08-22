/**
 * One-shot scaffold for Professional Mode curriculum files.
 * Run: node scripts/scaffold-professional-curriculum.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "data", "cloud", "professional_mode");
const lessonsDir = path.join(root, "lessons");
const wsDir = path.join(root, "workspace", "english");
fs.mkdirSync(lessonsDir, { recursive: true });
fs.mkdirSync(wsDir, { recursive: true });

const sessions = [
  {
    session: "PM-0",
    title: "AWS Console Orientation",
    description:
      "Control-room literacy — nav, region, Account ID, search, global vs regional.",
    lessons: [
      {
        id: "PM-0.1",
        title: "AWS Console Orientation",
        duration_minutes: 20,
        topics: [
          "Top navigation: logo, Services, search, region, account",
          "How regions work — Mumbai ap-south-1 primary",
          "Account ID — type it every time before real work",
          "Breadcrumbs and search-first navigation",
          "Six core services; global (IAM) vs regional (EC2/S3/VPC/CloudWatch)",
        ],
        ren_nav: [
          "Top nav tour",
          "Region switch demo",
          "Search to IAM",
          "Services menu categories",
        ],
      },
    ],
  },
  {
    session: "PM-1",
    title: "IAM — Identity and Access Management",
    description:
      "Users, roles, policies, Access Denied, CloudTrail — least privilege first.",
    lessons: [
      {
        id: "PM-1.1",
        title: "Users, Groups, and the Principle of Least Privilege",
        duration_minutes: 20,
        topics: [
          "IAM Users vs Groups",
          "Least Privilege",
          "Reading Effect/Action/Resource",
          "Create User 4 steps",
          "Add user to group",
        ],
        ren_nav: [
          "IAM → Users → Create User",
          "IAM → Groups → Create Group",
          "User detail Permissions",
        ],
      },
      {
        id: "PM-1.2",
        title: "IAM Roles: How Services Get Permissions",
        duration_minutes: 20,
        topics: [
          "Roles vs Users",
          "Trust vs permission policy",
          "No hardcoded keys",
          "EC2 role with S3 read",
          "Cross-account roles",
        ],
        ren_nav: [
          "IAM → Roles → Create Role → EC2",
          "Attach AmazonS3ReadOnlyAccess",
        ],
      },
      {
        id: "PM-1.3",
        title: "IAM Policies: Writing and Reading Them",
        duration_minutes: 20,
        topics: [
          "Policy JSON structure",
          "AWS vs customer managed",
          "Scoped actions/resources",
          "ARN structure",
          "Explicit Deny wins",
        ],
        ren_nav: [
          "IAM → Policies → Create Policy JSON",
          "Attach to group",
          "Access Advisor",
        ],
      },
      {
        id: "PM-1.4",
        title: "Debugging Access Denied",
        duration_minutes: 20,
        topics: [
          "Four reasons for Access Denied",
          "Reading the error",
          "Policy Simulator",
          "Access Advisor unused perms",
        ],
        ren_nav: [
          "Trigger Access Denied",
          "Identify missing policy",
          "Add scoped permission",
          "Verify",
        ],
      },
      {
        id: "PM-1.5",
        title: "CloudTrail: The Audit Record",
        duration_minutes: 20,
        topics: [
          "Every API call recorded",
          "Filter events",
          "Read event fields",
          "Find who deleted a SG",
        ],
        ren_nav: [
          "CloudTrail → Event History",
          "Filter by username",
          "Read CreateUser / DeleteGroup",
        ],
      },
    ],
  },
  {
    session: "PM-2",
    title: "VPC — Virtual Private Cloud",
    description:
      "Private network design, custom VPC, security groups, connectivity troubleshooting.",
    lessons: [
      {
        id: "PM-2.1",
        title: "VPC Architecture: The Building Blocks",
        duration_minutes: 20,
        topics: [
          "VPC as private network",
          "CIDR /16 and /24",
          "Public vs private subnets",
          "SG vs NACL",
        ],
        ren_nav: ["VPC dashboard", "Subnets", "Route tables", "Security Groups"],
      },
      {
        id: "PM-2.2",
        title: "Building a VPC From Scratch",
        duration_minutes: 20,
        topics: [
          "Never use default VPC",
          "Create VPC 10.0.0.0/16",
          "Public/private subnets",
          "IGW + routes",
        ],
        ren_nav: [
          "Create VPC",
          "Create subnets",
          "Create/attach IGW",
          "Update public RT",
        ],
      },
      {
        id: "PM-2.3",
        title: "Security Groups in Practice",
        duration_minutes: 20,
        topics: [
          "SG as gates",
          "Rule anatomy",
          "web-sg vs db-sg",
          "SG ID as source",
        ],
        ren_nav: ["Create web-sg", "Create db-sg from web-sg"],
      },
      {
        id: "PM-2.4",
        title: "Troubleshooting Connectivity",
        duration_minutes: 20,
        topics: [
          "5-check internet path",
          "VPC Flow Logs",
          "Wrong subnet scenario",
        ],
        ren_nav: [
          "Broken EC2 no internet",
          "Fix missing IGW route",
          "Flow Logs",
        ],
      },
    ],
  },
  {
    session: "PM-3",
    title: "EC2 — Elastic Compute Cloud",
    description: "Launch correctly, ASG, ALB, right-sizing and troubleshooting.",
    lessons: [
      {
        id: "PM-3.1",
        title: "Launching EC2 Correctly",
        duration_minutes: 20,
        topics: [
          "Instance types",
          "Launch wizard fields",
          "Private subnet",
          "IAM role not keys",
          "Session Manager",
        ],
        ren_nav: [
          "Launch Instance",
          "Pending→running",
          "Connect Session Manager",
        ],
      },
      {
        id: "PM-3.2",
        title: "Auto Scaling Groups",
        duration_minutes: 20,
        topics: [
          "Min/Max/Desired",
          "Target tracking",
          "Launch Template",
          "Health replace",
        ],
        ren_nav: [
          "Create Launch Template",
          "Create ASG",
          "Target tracking 60% CPU",
        ],
      },
      {
        id: "PM-3.3",
        title: "Application Load Balancer",
        duration_minutes: 20,
        topics: [
          "ALB vs NLB",
          "Target Groups",
          "Health checks",
          "Public ALB / private EC2",
        ],
        ren_nav: ["Create ALB", "Target Group", "Health check"],
      },
      {
        id: "PM-3.4",
        title: "Right-Sizing and Troubleshooting",
        duration_minutes: 20,
        topics: [
          "Read CW metrics",
          "Wrong type signs",
          "Change type stop/start",
          "Status checks",
        ],
        ren_nav: ["Monitoring tab", "Stop→change type→start"],
      },
    ],
  },
  {
    session: "PM-4",
    title: "S3 — Simple Storage Service",
    description: "Object storage security, lifecycle cost control, access incidents.",
    lessons: [
      {
        id: "PM-4.1",
        title: "S3 Fundamentals and Security",
        duration_minutes: 20,
        topics: [
          "Objects not folders",
          "Global unique names",
          "Block Public Access",
          "Bucket vs IAM policy",
          "SSE encryption",
        ],
        ren_nav: [
          "Create bucket",
          "Permissions BPA",
          "Encryption",
          "Bucket policy for EC2 role",
        ],
      },
      {
        id: "PM-4.2",
        title: "Lifecycle Rules and Cost Control",
        duration_minutes: 20,
        topics: ["Storage classes", "Lifecycle transitions", "Cost impact"],
        ren_nav: ["Management → lifecycle", "30d IA / 90d Glacier"],
      },
      {
        id: "PM-4.3",
        title: "Access Control and Incidents",
        duration_minutes: 20,
        topics: [
          "Pre-signed URLs",
          "Accidental public",
          "Access Analyzer",
          "CORS",
          "Lock down public bucket",
        ],
        ren_nav: [
          "Find public bucket",
          "Enable BPA",
          "Access logs",
          "Pre-signed URL",
        ],
      },
    ],
  },
  {
    session: "PM-5",
    title: "CloudWatch — Monitoring",
    description: "Dashboards, alarms, Logs Insights, incident tracing.",
    lessons: [
      {
        id: "PM-5.1",
        title: "Dashboards and Metrics",
        duration_minutes: 20,
        topics: [
          "Auto metrics",
          "Key metrics per service",
          "Dashboards",
          "Namespaces",
        ],
        ren_nav: ["Create Dashboard", "EC2/ALB widgets"],
      },
      {
        id: "PM-5.2",
        title: "Alarms",
        duration_minutes: 20,
        topics: [
          "OK/ALARM/INSUFFICIENT_DATA",
          "5-step create",
          "Datapoints 3 of 5",
          "SNS",
          "Composite",
        ],
        ren_nav: ["Create CPU alarm", "SNS subscribe"],
      },
      {
        id: "PM-5.3",
        title: "Logs Insights and Incident Tracing",
        duration_minutes: 20,
        topics: [
          "Log groups",
          "Insights query",
          "Alarm→metrics→logs",
          "Metric vs log",
        ],
        ren_nav: [
          "Log Groups",
          "Insights ERROR query",
          "Correlate with CPU",
        ],
      },
    ],
  },
  {
    session: "PM-6",
    title: "Cost Explorer and Budgets",
    description: "Read spend like an engineer; budgets and anomaly detection.",
    lessons: [
      {
        id: "PM-6.1",
        title: "Reading Cost Explorer Like an Engineer",
        duration_minutes: 20,
        topics: [
          "Group by service/resource/region",
          "Common waste patterns",
        ],
        ren_nav: [
          "Cost Explorer last 3 months",
          "Drill EC2",
          "Idle resources",
        ],
      },
      {
        id: "PM-6.2",
        title: "Budgets and Anomaly Detection",
        duration_minutes: 20,
        topics: [
          "80% alert",
          "Forecast alert",
          "Anomaly Detection",
          "Tagging",
        ],
        ren_nav: [
          "Create Budget $500",
          "80%/100% alerts",
          "Anomaly Detection",
        ],
      },
    ],
  },
];

function lessonStub(lesson, session, lang) {
  return {
    lesson_id: lesson.id,
    lesson_title: lesson.title,
    session_id: session.session,
    session_name: session.title,
    mode: "professional",
    language: lang,
    duration_minutes: lesson.duration_minutes,
    status: "stub",
    content_status: "awaiting_author_data",
    outline: {
      teaching_points: lesson.topics,
      ren_navigates: lesson.ren_nav,
      notes:
        "Fill whiteboard_intro, console_segments, and closing from Claude schema/data pass.",
    },
    company: {
      name: "Finova Technologies",
      description: "PLACEHOLDER — replace with authored company context",
      your_role: "Cloud Infrastructure Engineer",
      aws_accounts: ["finova-prod", "finova-staging", "finova-dev"],
      current_account: "finova-dev",
      manager: "Arjun Mehta (Infrastructure Lead)",
    },
    whiteboard_intro: {
      duration_seconds: 0,
      board_text: "",
      ren_voice: "",
    },
    console_segments: [],
    closing: {
      ren_voice: "",
      free_ask: {
        prompt: "",
        ren_response_template: "",
        ren_closing: "",
      },
    },
  };
}

const curriculum = {
  mode: "professional",
  mastery_standard:
    "Student can sit next to a real cloud engineer, take a ticket, open the real AWS console, and handle it independently.",
  totals: { lessons: 22, workspace_tasks: 77, estimated_hours: 36.7 },
  topics: sessions.map((s) => ({
    session: s.session,
    title: s.title,
    description: s.description,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      duration_minutes: l.duration_minutes,
      available: false,
      languages: ["english", "tanglish"],
    })),
  })),
};

// Migrate old console PM-1.1 → PM-0.1 english if needed
const existingPm11 = path.join(lessonsDir, "PM-1.1_english.json");
const pm01Path = path.join(lessonsDir, "PM-0.1_english.json");
if (fs.existsSync(existingPm11)) {
  const raw = JSON.parse(fs.readFileSync(existingPm11, "utf8"));
  const looksLikeConsole =
    /console navigation/i.test(String(raw.lesson_title || "")) ||
    (Array.isArray(raw.console_segments) &&
      raw.console_segments.length > 0 &&
      /navigation bar/i.test(JSON.stringify(raw.console_segments[0] || {})));
  if (looksLikeConsole) {
    if (!fs.existsSync(pm01Path)) {
      const migrated = {
        ...raw,
        lesson_id: "PM-0.1",
        lesson_title: "AWS Console Orientation",
        session_id: "PM-0",
        session_name: "AWS Console Orientation",
        _migrated_from: "PM-1.1_english.json (previous console navigation lesson)",
      };
      fs.writeFileSync(pm01Path, JSON.stringify(migrated, null, 2) + "\n");
    }
  }
}

for (const s of sessions) {
  for (const l of s.lessons) {
    for (const lang of ["english", "tanglish"]) {
      const file = path.join(lessonsDir, `${l.id}_${lang}.json`);
      if (l.id === "PM-0.1" && lang === "english" && fs.existsSync(file)) {
        const cur = JSON.parse(fs.readFileSync(file, "utf8"));
        if (Array.isArray(cur.console_segments) && cur.console_segments.length) {
          continue;
        }
      }
      if (fs.existsSync(file)) {
        const cur = JSON.parse(fs.readFileSync(file, "utf8"));
        if (
          cur.status !== "stub" &&
          Array.isArray(cur.console_segments) &&
          cur.console_segments.length
        ) {
          // Replace old console content sitting on PM-1.1 with IAM stub
          if (
            l.id === "PM-1.1" &&
            lang === "english" &&
            /console navigation/i.test(String(cur.lesson_title || ""))
          ) {
            fs.writeFileSync(
              file,
              JSON.stringify(lessonStub(l, s, lang), null, 2) + "\n"
            );
          }
          continue;
        }
      }
      fs.writeFileSync(
        file,
        JSON.stringify(lessonStub(l, s, lang), null, 2) + "\n"
      );
    }
  }
}

const workspace = [
  ...[
    ["PRO-CONSOLE-T01", 8, "Navigate to IAM using the search bar"],
    ["PRO-CONSOLE-T02", 8, "Switch region to us-east-1 and find EC2"],
    ["PRO-CONSOLE-T03", 8, "Find your Account ID on this console"],
    [
      "PRO-CONSOLE-T04",
      8,
      "Navigate to S3 — notice multi-region bucket list",
    ],
    [
      "PRO-CONSOLE-T05",
      8,
      "Ticket: fix Mumbai VPC — first action before touching anything",
    ],
  ].map(([id, min, title], i) => ({
    id,
    min,
    title,
    service: "console",
    session: "PM-0",
    approach: "orientation",
    source_lesson: "PM-0.1",
    n: i + 1,
  })),
  ...[
    [
      "PRO-IAM-T01",
      10,
      "create_from_scratch",
      "Create developer IAM user (console, Developers group, no Admin)",
    ],
    [
      "PRO-IAM-T02",
      10,
      "create_from_scratch",
      "Create read-only analyst user (S3 + CloudWatch read)",
    ],
    [
      "PRO-IAM-T03",
      15,
      "create_from_scratch",
      "Create EC2 deployment role with S3 write to one bucket",
    ],
    [
      "PRO-IAM-T04",
      15,
      "create_from_scratch",
      "Create cross-account role (dev assumes ops in prod)",
    ],
    [
      "PRO-IAM-T05",
      15,
      "debug_and_fix",
      "ananya.data Access Denied on S3 — find and fix",
    ],
    [
      "PRO-IAM-T06",
      15,
      "debug_and_fix",
      "EC2 cannot write S3 — missing instance profile",
    ],
    [
      "PRO-IAM-T07",
      20,
      "debug_and_fix",
      "Developer has EC2 terminate — remove only that permission",
    ],
    [
      "PRO-IAM-T08",
      20,
      "debug_and_fix",
      "Service account has AdministratorAccess — replace with scoped policy",
    ],
    [
      "PRO-IAM-T09",
      25,
      "security_incident",
      "Deactivate contractor who left 3 weeks ago",
    ],
    [
      "PRO-IAM-T10",
      25,
      "security_incident",
      "Leaked access key on GitHub — deactivate, rotate, CloudTrail check",
    ],
    [
      "PRO-IAM-T11",
      30,
      "security_incident",
      "Audit all AdministratorAccess users and recommend replacements",
    ],
    [
      "PRO-IAM-T12",
      30,
      "security_incident",
      "CloudTrail report: who deleted production S3 bucket",
    ],
    [
      "PRO-IAM-T13",
      30,
      "real_ticket",
      "Ticket: onboard 5 backend developers with scoped access",
    ],
    [
      "PRO-IAM-T14",
      35,
      "real_ticket",
      "Ticket: CFO unknown charges — find IAM actor for unauthorized resources",
    ],
    [
      "PRO-IAM-T15",
      40,
      "real_ticket",
      "Ticket: MFA disabled users + access keys older than 90 days",
    ],
    [
      "PRO-IAM-T16",
      15,
      "design_decision",
      "Write minimum DynamoDB read + S3 write policy JSON",
    ],
    [
      "PRO-IAM-T17",
      20,
      "design_decision",
      "Design group structure for frontend/backend/data teams",
    ],
    [
      "PRO-IAM-T18",
      25,
      "design_decision",
      "Third-party security tool read-only role + scoped trust",
    ],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "iam",
    session: "PM-1",
    approach,
    source_lesson:
      i < 4
        ? "PM-1.1"
        : i < 8
          ? "PM-1.4"
          : i < 12
            ? "PM-1.5"
            : i < 15
              ? "PM-1.1"
              : "PM-1.3",
    n: i + 1,
  })),
  ...[
    [
      "PRO-VPC-T01",
      15,
      "create_from_scratch",
      "Create VPC 10.0.0.0/16 + public/private + IGW + routes",
    ],
    [
      "PRO-VPC-T02",
      20,
      "create_from_scratch",
      "Add second AZ public+private subnets and routes",
    ],
    [
      "PRO-VPC-T03",
      20,
      "create_from_scratch",
      "3-tier SGs: ALB, app, RDS with correct rules",
    ],
    ["PRO-VPC-T04", 15, "debug_and_fix", "EC2 no internet — missing IGW route"],
    [
      "PRO-VPC-T05",
      20,
      "debug_and_fix",
      "Laptop can reach DB but EC2 app cannot — SG rule",
    ],
    [
      "PRO-VPC-T06",
      20,
      "debug_and_fix",
      "Subnet supposed private but accepts internet — fix",
    ],
    [
      "PRO-VPC-T07",
      25,
      "debug_and_fix",
      "Two EC2s cannot reach each other — NACL",
    ],
    ["PRO-VPC-T08", 20, "security", "Audit SGs for 0.0.0.0/0 on 22 or 3306"],
    [
      "PRO-VPC-T09",
      25,
      "security",
      "DB SG opened to world — lock down + document",
    ],
    [
      "PRO-VPC-T10",
      30,
      "security",
      "Fintech 3-tier VPC from scratch — no public RDS",
    ],
    [
      "PRO-VPC-T11",
      25,
      "real_ticket",
      "Microservice to private RDS without direct internet",
    ],
    [
      "PRO-VPC-T12",
      30,
      "real_ticket",
      "Replace unrestricted SSH with Session Manager",
    ],
    [
      "PRO-VPC-T13",
      35,
      "real_ticket",
      "New AZ redundancy — match existing network",
    ],
    ["PRO-VPC-T14", 40, "real_ticket", "Full network audit before launch"],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "vpc",
    session: "PM-2",
    approach,
    source_lesson: `PM-2.${Math.min(4, Math.floor(i / 3) + 1)}`,
    n: i + 1,
  })),
  ...[
    [
      "PRO-EC2-T01",
      15,
      "create_from_scratch",
      "Launch AL2023 t3.medium private subnet + IAM role",
    ],
    [
      "PRO-EC2-T02",
      20,
      "create_from_scratch",
      "Launch Template Ubuntu + nginx user data",
    ],
    [
      "PRO-EC2-T03",
      20,
      "create_from_scratch",
      "ASG min2 max8 desired2 CPU70% multi-AZ",
    ],
    [
      "PRO-EC2-T04",
      15,
      "debug_and_fix",
      "App slow — CPU 91% — right-size instance",
    ],
    [
      "PRO-EC2-T05",
      20,
      "debug_and_fix",
      "ALB not sending traffic — unhealthy target",
    ],
    [
      "PRO-EC2-T06",
      20,
      "debug_and_fix",
      "ASG not scaling at 85% CPU — fix policy",
    ],
    [
      "PRO-EC2-T07",
      25,
      "debug_and_fix",
      "Instance missing IAM role — attach without downtime",
    ],
    ["PRO-EC2-T08", 25, "incident_response", "502 errors — ALB/EC2 root cause"],
    [
      "PRO-EC2-T09",
      30,
      "incident_response",
      "Unauthorized EC2 in us-east-1 — find and terminate",
    ],
    [
      "PRO-EC2-T10",
      35,
      "incident_response",
      "Cost spike — idle EC2 CPU <2%",
    ],
    [
      "PRO-EC2-T11",
      25,
      "architecture",
      "Variable traffic API — ASG + ALB + type",
    ],
    ["PRO-EC2-T12", 30, "architecture", "Multi-AZ without downtime"],
    [
      "PRO-EC2-T13",
      40,
      "architecture",
      "Full deploy LT→ASG→ALB→scale verify",
    ],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "ec2",
    session: "PM-3",
    approach,
    source_lesson: `PM-3.${Math.min(4, Math.floor(i / 3) + 1)}`,
    n: i + 1,
  })),
  ...[
    [
      "PRO-S3-T01",
      10,
      "create_and_configure",
      "Create bucket Mumbai BPA ON SSE-S3 versioning ON",
    ],
    [
      "PRO-S3-T02",
      15,
      "create_and_configure",
      "Lifecycle 30 IA / 90 Glacier / delete 365",
    ],
    [
      "PRO-S3-T03",
      15,
      "create_and_configure",
      "Bucket policy — only app-server role can read",
    ],
    [
      "PRO-S3-T04",
      15,
      "debug_and_security",
      "Public access warning — find and fix",
    ],
    ["PRO-S3-T05", 20, "debug_and_security", "Pre-signed URL valid 2 hours"],
    [
      "PRO-S3-T06",
      20,
      "debug_and_security",
      "S3 cost spike — lifecycle for old Standard objects",
    ],
    [
      "PRO-S3-T07",
      25,
      "debug_and_security",
      "Public customer data bucket — lock + incident report",
    ],
    [
      "PRO-S3-T08",
      20,
      "real_ticket",
      "Backup system S3 with 1yr retention lifecycle",
    ],
    [
      "PRO-S3-T09",
      30,
      "real_ticket",
      "Compliance: all buckets encrypted + versioned",
    ],
    [
      "PRO-S3-T10",
      35,
      "real_ticket",
      "Private images viewable up to 1 hour",
    ],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "s3",
    session: "PM-4",
    approach,
    source_lesson: `PM-4.${Math.min(3, Math.floor(i / 3) + 1)}`,
    n: i + 1,
  })),
  ...[
    [
      "PRO-CW-T01",
      15,
      "build_monitoring",
      "Web app dashboard: CPU, ALB requests/errors, network",
    ],
    [
      "PRO-CW-T02",
      15,
      "build_monitoring",
      "ALB 5XX >10 in 5m — 3 of 5 datapoints + SNS",
    ],
    [
      "PRO-CW-T03",
      20,
      "build_monitoring",
      "Composite alarm CPU>80% AND 5XX>5",
    ],
    ["PRO-CW-T04", 15, "investigate", "3am alarm — when spike started/ended"],
    [
      "PRO-CW-T05",
      20,
      "investigate",
      "Logs Insights ERROR 14:00–14:30 yesterday",
    ],
    ["PRO-CW-T06", 25, "investigate", "2hr degradation — full incident trace"],
    [
      "PRO-CW-T07",
      25,
      "investigate",
      "Too many false alarms — fix single datapoint",
    ],
    [
      "PRO-CW-T08",
      20,
      "real_ticket",
      "S3 spend over $500/month billing alarm",
    ],
    [
      "PRO-CW-T09",
      30,
      "real_ticket",
      "New API monitoring pack + on-call email",
    ],
    [
      "PRO-CW-T10",
      35,
      "real_ticket",
      "Tuesday outage — what should have alarmed",
    ],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "cloudwatch",
    session: "PM-5",
    approach,
    source_lesson: `PM-5.${Math.min(3, Math.floor(i / 3) + 1)}`,
    n: i + 1,
  })),
  ...[
    ["PRO-COST-T01", 10, "read_and_analyse", "Top 3 services by cost this month"],
    ["PRO-COST-T02", 15, "read_and_analyse", "EC2 +$200 MoM — what changed"],
    [
      "PRO-COST-T03",
      15,
      "fix_waste",
      "Unattached EBS volumes — list cost delete",
    ],
    ["PRO-COST-T04", 20, "fix_waste", "Unattached Elastic IPs — release"],
    [
      "PRO-COST-T05",
      20,
      "real_ticket",
      "Bill $800 vs $500 — find unexpected $300",
    ],
    [
      "PRO-COST-T06",
      25,
      "real_ticket",
      "Budget 80%/100% of $1000 + anomaly day >$100",
    ],
    [
      "PRO-COST-T07",
      30,
      "real_ticket",
      "Quarterly idle resource audit + savings report",
    ],
  ].map(([id, min, approach, title], i) => ({
    id,
    min,
    title,
    service: "cost",
    session: "PM-6",
    approach,
    source_lesson: `PM-6.${i < 4 ? 1 : 2}`,
    n: i + 1,
  })),
];

const catalog = {
  mode: "professional",
  language: "english",
  status: "stub_catalog",
  total_tasks: workspace.length,
  tasks: workspace.map((t) => ({
    task_id: t.id,
    service: t.service,
    session: t.session,
    source_lesson: t.source_lesson,
    approach: t.approach,
    duration_minutes: t.min,
    title: t.title,
    file: `workspace/english/${t.id}.json`,
  })),
};

for (const t of workspace) {
  const file = path.join(wsDir, `${t.id}.json`);
  if (fs.existsSync(file)) {
    const cur = JSON.parse(fs.readFileSync(file, "utf8"));
    if (cur.status !== "stub" && cur.success_criteria) continue;
  }
  const stub = {
    task_id: t.id,
    task_number: t.n,
    type: "ops_console",
    status: "stub",
    content_status: "awaiting_author_data",
    difficulty: t.min >= 30 ? "hard" : t.min >= 20 ? "medium" : "easy",
    environment: "aws_console",
    service: t.service,
    session: t.session,
    source_lesson: t.source_lesson,
    approach: t.approach,
    duration_minutes: t.min,
    title: t.title,
    brief: t.title,
    language: "english",
    ticket: null,
    account_gate: null,
    console_seed: null,
    success_criteria: null,
    notes:
      "Fill ticket, account_gate, seed state, and success_criteria after Claude schema/data pass.",
  };
  fs.writeFileSync(file, JSON.stringify(stub, null, 2) + "\n");
}

// Mark PM-0.1 available in curriculum if content exists
const pm01 = path.join(lessonsDir, "PM-0.1_english.json");
if (fs.existsSync(pm01)) {
  const cur = JSON.parse(fs.readFileSync(pm01, "utf8"));
  if (Array.isArray(cur.console_segments) && cur.console_segments.length) {
    const topic = curriculum.topics.find((t) => t.session === "PM-0");
    const lesson = topic?.lessons.find((l) => l.id === "PM-0.1");
    if (lesson) lesson.available = true;
  }
}

fs.writeFileSync(
  path.join(root, "_curriculum.json"),
  JSON.stringify(curriculum, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(root, "_workspace_catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n"
);

const lessonCount = fs
  .readdirSync(lessonsDir)
  .filter((f) => f.endsWith(".json")).length;
const wsCount = fs.readdirSync(wsDir).filter((f) => f.endsWith(".json")).length;

console.log(
  JSON.stringify(
    {
      curriculum_sessions: curriculum.topics.length,
      curriculum_lessons: curriculum.topics.reduce(
        (n, t) => n + t.lessons.length,
        0
      ),
      lesson_files: lessonCount,
      workspace_files: wsCount,
      catalog_tasks: catalog.total_tasks,
    },
    null,
    2
  )
);
