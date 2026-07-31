import type { PlacementItem } from "../types";

/** Placeholder pool for Gate 3 — Deep Craft entry (judgment). */
export const DEEP_CRAFT_ENTRY_POOL: PlacementItem[] = [
  {
    id: "GATE3-A-01",
    gate: "deep_craft_entry",
    type: "config_audit",
    difficulty: "architect",
    weight: 2,
    tests_topic: "cross_cutting",
    section: "A",
    scenario:
      "Full stack audit: ALB → EC2 ASG → RDS + S3 uploads. Find the highest-severity issue first.",
    broken_config: `ALB SG: 0.0.0.0/0:443 OK
EC2 SG: allows ALB SG:80 OK
RDS SG: allows 0.0.0.0/0:5432  ← ?
S3 bucket: public GetObject on /uploads/*
IAM deploy role: Action * Resource *
NAT Gateway: none — private subnet apps call Stripe over IGW? (no route)`,
    question: "What do you fix first under production load?",
    options: [
      "Rename the ALB for clarity",
      "Close RDS 0.0.0.0/0:5432 immediately — data exfil risk",
      "Upgrade instance types before any security change",
      "Delete the ASG to reduce cost",
    ],
    correct_index: 1,
    explanation:
      "Open database to the world is P0. Cost and naming wait; blast radius first.",
  },
  {
    id: "GATE3-B-02",
    gate: "deep_craft_entry",
    type: "debug_task",
    difficulty: "architect",
    weight: 2,
    tests_topic: "cross_cutting",
    section: "B",
    scenario: "Production is failing RIGHT NOW — triage under noise.",
    signals: [
      {
        source: "cloudwatch",
        label: "ALB 5xx",
        value: "12% · spike last 4 min",
        tone: "bad",
      },
      {
        source: "cloudwatch",
        label: "RDS CPU",
        value: "97% · connections 480/500",
        tone: "bad",
      },
      {
        source: "cloudtrail",
        label: "API",
        value: "Unusual RunInstances × 40 from new IAM user",
        tone: "warn",
      },
      {
        source: "cost_explorer",
        label: "Spend",
        value: "+₹1.8L forecast today vs baseline",
        tone: "warn",
      },
      {
        source: "user_reports",
        label: "Support",
        value: "Checkout timeouts · 'payment pending forever'",
        tone: "bad",
      },
    ],
    question: "What do you check FIRST?",
    options: [
      "Redesign the entire VPC from scratch",
      "RDS saturation / connection pool — matches checkout timeouts now",
      "Ignore RDS and chase the Cost Explorer spike first",
      "Disable CloudWatch alarms to reduce noise",
    ],
    correct_index: 1,
    explanation:
      "User pain + RDS CPU/connections pegged = check DB path first. Cost and rogue RunInstances matter, but restore checkout now.",
  },
  {
    id: "GATE3-B-03",
    gate: "deep_craft_entry",
    type: "debug_task",
    difficulty: "architect",
    weight: 2,
    tests_topic: "monitoring",
    section: "B",
    scenario: "Same incident — CEO asks for one sentence right now.",
    signals: [
      {
        source: "user_reports",
        label: "CEO",
        value: "Are we down? Tell me in one line.",
        tone: "bad",
      },
      {
        source: "cloudwatch",
        label: "Status",
        value: "Checkout 5xx elevated; DB CPU critical",
        tone: "bad",
      },
    ],
    question: "Best CEO sentence?",
    options: [
      "Everything is fine, ignore support tickets",
      "Checkout is degraded due to database saturation — we're scaling connections and will update in 15 minutes",
      "We need 6 weeks to rewrite the monolith",
      "AWS is fully down worldwide",
    ],
    correct_index: 1,
    explanation:
      "Honest, specific, time-boxed. No denial, no architecture manifesto in the first update.",
  },
  {
    id: "GATE3-C-04",
    gate: "deep_craft_entry",
    type: "architecture_choice",
    difficulty: "architect",
    weight: 2,
    tests_topic: "cross_cutting",
    section: "C",
    scenario:
      "Fintech MVP: 50k users India, PCI scope, ₹4L/month budget, 4 engineers, 8-week launch.",
    question: "Primary compute choice for the API?",
    options: [
      "Multi-region active-active EKS everywhere on day 1",
      "Single-region (ap-south-1) ECS/EC2 behind ALB with Multi-AZ RDS",
      "Only Lambda + DynamoDB with no VPC",
      "On-prem colo to avoid cloud bills",
    ],
    correct_index: 1,
    counter_argument:
      "Ren challenges: 'Single region is weak — one AZ outage kills you. Why not full multi-region now?'",
    response_type: "text",
    expected_defense_contains: [
      "budget",
      "team",
      "multi-az",
      "complexity",
      "later",
    ],
    review_flag_threshold: 0.7,
    explanation:
      "Day-1 multi-region is usually overbuild for 4 engineers / ₹4L. Multi-AZ in ap-south-1 is the senior call; multi-region later.",
  },
  {
    id: "GATE3-C-05",
    gate: "deep_craft_entry",
    type: "architecture_choice",
    difficulty: "architect",
    weight: 2,
    tests_topic: "iam",
    section: "C",
    scenario: "Contractors need temporary read of production logs in S3.",
    question: "Best access pattern?",
    options: [
      "Create long-lived IAM users with AdministratorAccess",
      "IAM role / Identity Center permission set, time-bound, least privilege on log prefix only",
      "Share root MFA device in Slack",
      "Make the log bucket public for two weeks",
    ],
    correct_index: 1,
    counter_argument:
      "Ren challenges: 'Just give them Admin for speed — we'll revoke later. Defend least privilege.'",
    response_type: "text",
    expected_defense_contains: [
      "least privilege",
      "temporary",
      "revoke",
      "blast radius",
      "audit",
    ],
    review_flag_threshold: 0.7,
    explanation:
      "Temporary scoped access with audit beats permanent Admin. Senior instinct = shrink blast radius.",
  },
];
