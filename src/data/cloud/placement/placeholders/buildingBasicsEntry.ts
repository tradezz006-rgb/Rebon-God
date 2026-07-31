import type { PlacementItem } from "../types";

/** Placeholder pool for Gate 1 — Building Basics entry (knowledge). */
export const BUILDING_BASICS_ENTRY_POOL: PlacementItem[] = [
  {
    id: "GATE1-Q-01",
    gate: "building_basics_entry",
    type: "quiz",
    difficulty: "easy",
    weight: 1,
    tests_topic: "fundamentals",
    question:
      "What is the fundamental idea of cloud computing vs buying physical servers?",
    options: [
      "Data floats in the sky without hardware",
      "You rent physical servers from a provider and pay for what you use",
      "Cloud means free unlimited compute forever",
      "You must own a data center in every country",
    ],
    correct_index: 1,
    explanation:
      "Cloud = renting real servers in provider data centers. Pay-as-you-go, not magic in the sky.",
  },
  {
    id: "GATE1-Q-02",
    gate: "building_basics_entry",
    type: "quiz",
    difficulty: "easy",
    weight: 1,
    tests_topic: "fundamentals",
    question:
      "Your app in us-east-1 feels slow for Mumbai users. What is the most likely first cause?",
    options: [
      "IAM policy is wrong",
      "Wrong region — latency from physics",
      "S3 bucket name is too long",
      "CloudWatch is disabled",
    ],
    correct_index: 1,
    explanation:
      "Latency is physics. Serve Indian users from ap-south-1 (Mumbai), not Virginia.",
  },
  {
    id: "GATE1-SC-03",
    gate: "building_basics_entry",
    type: "scenario_task",
    difficulty: "medium",
    weight: 1,
    tests_topic: "iam",
    scenario:
      "A startup shares the AWS root account password with all interns 'to move fast.'",
    question: "Why will Ren reject this immediately?",
    options: [
      "Root login is slower than IAM",
      "Root is the master key — one leak = full account takeover and bill risk",
      "IAM cannot create users without root password sharing",
      "AWS bans more than 3 people on one account",
    ],
    correct_index: 1,
    explanation:
      "Never share root. Create IAM users with least privilege. One leaked root password = game over.",
  },
  {
    id: "GATE1-SC-04",
    gate: "building_basics_entry",
    type: "scenario_task",
    difficulty: "medium",
    weight: 1,
    tests_topic: "storage",
    scenario:
      "Myntra needs to store 50M product images with fast retrieval across India.",
    question: "Which service matches the problem?",
    options: [
      "Put images on EC2 local disks",
      "Store objects in Amazon S3 buckets",
      "Put image binaries inside RDS rows",
      "Email images to users as attachments",
    ],
    correct_index: 1,
    explanation:
      "S3 = infinite object storage for files. EC2 disks are not durable shared image storage.",
  },
  {
    id: "GATE1-OR-05",
    gate: "building_basics_entry",
    type: "order_task",
    difficulty: "medium",
    weight: 1,
    tests_topic: "monitoring",
    question:
      "Order the CloudWatch flow from raw signal to engineer notification.",
    items: [
      "Metric records CPU % over time",
      "Alarm threshold set at CPU > 85%",
      "Alarm state goes ALARM",
      "SNS/PagerDuty notifies on-call",
    ],
    correct_order: [0, 1, 2, 3],
    explanation:
      "Metric → Alarm rule → ALARM state → notification. Metric alone is not an alert.",
  },
  {
    id: "GATE1-Q-06",
    gate: "building_basics_entry",
    type: "quiz",
    difficulty: "easy",
    weight: 1,
    tests_topic: "fundamentals",
    question: "In the shared responsibility model, who secures the guest OS patching on EC2?",
    options: [
      "Always AWS only",
      "The customer",
      "Neither — OS patches themselves",
      "Only if you buy Support Business",
    ],
    correct_index: 1,
    explanation:
      "AWS secures the cloud; you secure IN the cloud — including guest OS on EC2.",
  },
  {
    id: "GATE1-SC-07",
    gate: "building_basics_entry",
    type: "scenario_task",
    difficulty: "medium",
    weight: 1,
    tests_topic: "networking",
    scenario:
      "Razorpay puts a public web server and a card database in the same public subnet.",
    question: "What is the safer VPC pattern?",
    options: [
      "Both public — easier debugging",
      "Web in public subnet, database in private subnet",
      "Both private with no internet path for the web tier",
      "No VPC — use account root networking",
    ],
    correct_index: 1,
    explanation:
      "Reception (public) for web; vault (private) for sensitive data stores.",
  },
];
