import type { PlacementItem } from "../types";

/** Placeholder pool for Gate 2 — Working Level entry (practice). */
export const WORKING_LEVEL_ENTRY_POOL: PlacementItem[] = [
  {
    id: "GATE2-CA-01",
    gate: "working_level_entry",
    type: "config_audit",
    difficulty: "hard",
    weight: 2,
    tests_topic: "iam",
    scenario: "Audit this IAM policy attached to a payment-service role.",
    broken_config: `{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}`,
    question: "What is the primary issue?",
    options: [
      "Missing Sid field",
      "Violates least privilege — full admin on all resources",
      "JSON is invalid so AWS rejects it anyway",
      "Should use Deny instead of Allow for payments",
    ],
    correct_index: 1,
    explanation:
      "Action * + Resource * = admin. Payment roles need narrow actions on specific ARNs.",
  },
  {
    id: "GATE2-DA-02",
    gate: "working_level_entry",
    type: "debug_task",
    difficulty: "hard",
    weight: 2,
    tests_topic: "networking",
    error_shown:
      "ConnectTimeoutError: dial tcp 10.0.2.44:5432: i/o timeout\nSecurityGroup: sg-web allows 0.0.0.0/0:443\nRDS is in private subnet, SG allows only sg-bastion:5432",
    question: "Most likely root cause?",
    options: [
      "RDS instance type is too small",
      "App SG is not allowed on RDS SG — only bastion is",
      "S3 bucket policy blocks Postgres",
      "CloudTrail is disabled",
    ],
    correct_index: 1,
    explanation:
      "DB timeout with SG only allowing bastion means the app SG was never authorized on port 5432.",
  },
  {
    id: "GATE2-SC-03",
    gate: "working_level_entry",
    type: "scenario_task",
    difficulty: "medium",
    weight: 1,
    tests_topic: "compute",
    scenario:
      "ASG min=2 max=2 during a flash sale; CPU pegged at 100% on both instances.",
    question: "Best immediate fix?",
    options: [
      "Delete the ASG and run one huge instance forever",
      "Raise max capacity / scaling policy so ASG can add instances",
      "Turn off CloudWatch to reduce CPU",
      "Move RDS into the public subnet",
    ],
    correct_index: 1,
    explanation:
      "min=max=2 means no scale-out headroom. Raise max and use CPU-based scaling.",
  },
  {
    id: "GATE2-CA-04",
    gate: "working_level_entry",
    type: "config_audit",
    difficulty: "hard",
    weight: 2,
    tests_topic: "storage",
    broken_config: `Bucket policy Principal: "*"
Action: s3:GetObject
Resource: arn:aws:s3:::customer-kyc-docs/*
Block Public Access: all OFF`,
    question: "Highest severity finding?",
    options: [
      "Bucket name is not globally unique enough",
      "KYC objects are world-readable — public GetObject with BPA off",
      "Missing Intelligent-Tiering",
      "Versioning should be disabled for KYC",
    ],
    correct_index: 1,
    explanation:
      "Sensitive KYC data must never be Principal *. Enable BPA and use private + signed access.",
  },
  {
    id: "GATE2-AC-05",
    gate: "working_level_entry",
    type: "architecture_choice",
    difficulty: "hard",
    weight: 1,
    tests_topic: "monitoring",
    scenario:
      "You need to know within 1 minute if checkout API 5xx spikes above 2%.",
    question: "Which approach proves on-call readiness?",
    options: [
      "Weekly CSV export from Cost Explorer",
      "CloudWatch metric + alarm + PagerDuty/SNS to on-call",
      "Manual dashboard staring during business hours only",
      "Disable alarms to avoid noise",
    ],
    correct_index: 1,
    explanation:
      "Metric + alarm + paging is the production pattern. Weekly exports are not incident response.",
  },
  {
    id: "GATE2-DA-06",
    gate: "working_level_entry",
    type: "debug_task",
    difficulty: "hard",
    weight: 2,
    tests_topic: "iam",
    error_shown:
      "AccessDenied: User: arn:aws:iam::123:user/deploy is not authorized to perform: ec2:RunInstances on resource: ... because no identity-based policy allows the ec2:RunInstances action",
    question: "Correct fix path?",
    options: [
      "Share root password with deploy user",
      "Attach a least-privilege policy allowing ec2:RunInstances on required resources",
      "Open security group 0.0.0.0/0 on all ports",
      "Delete the IAM user and use anonymous access",
    ],
    correct_index: 1,
    explanation:
      "AccessDenied means missing Allow. Fix with scoped IAM policy — never root sharing.",
  },
];
