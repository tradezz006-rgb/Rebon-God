/**
 * Injects live classroom checks + end doubt prompt into Student Mode lesson JSON.
 * Run: node scripts/inject-live-checks.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(__dirname, "../src/data/cloud/student_mode"),
  path.resolve(
    __dirname,
    "../../../Rebon God/commu-craft-coach-main/commu-craft-coach-main/src/data/cloud/student_mode"
  ),
];

const CHECKS = {
  1: {
    en: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "In one sentence: what is cloud computing?\n\nSpeak your answer on the mic.",
        ren_voice:
          "Okay, pause with me for a second. Quick check — in your own words, what is cloud computing? Turn your mic on and answer me. Think of the electricity bill idea if you need it.",
        question: "What is cloud computing?",
        accept_keywords: [
          "rent",
          "internet",
          "aws",
          "utility",
          "pay",
          "server",
          "infrastructure",
          "cloud",
          "provider",
          "don't buy",
          "do not buy",
          "someone else",
        ],
        ren_correct:
          "Yes — that's it. Cloud means you rent computers and storage over the internet instead of buying and racking your own machines. Good. Let's keep going.",
        ren_wrong:
          "Close. Remember: cloud is renting infrastructure over the internet — like an electricity bill for computers — you don't buy the physical servers. Hold that idea. Continuing.",
        ren_hint: "Electricity grid, not your own generator.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "One more quick quiz while this is fresh. Why do most startups choose cloud instead of buying servers? Look at the options on the board — tap the right one, or say A, B, C, or D into your mic.",
        question:
          "Why do most startups choose cloud instead of buying physical servers?",
        options: [
          "Cloud has zero ongoing cost forever",
          "No huge upfront cost — scale up or down as demand changes",
          "Cloud means you never need engineers",
          "Physical servers are illegal for startups",
        ],
        correct_index: 1,
        ren_correct:
          "Exactly — no huge upfront cost, and you scale with demand. That's why cloud wins for new products. Moving on.",
        ren_wrong:
          "Not quite. The big win is avoiding huge upfront hardware cost and scaling up or down with demand. That's option B. Let's continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about today's cloud topic.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Before we wrap Day 1 — do you have any doubts about what I just taught on cloud computing? Turn your mic on and ask me. If you're clear, say no doubts or all clear.",
      },
    },
    tg: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "In one sentence: what is cloud computing?\n\nSpeak your answer on the mic.",
        ren_voice:
          "Okay, oru second pause pannalam. Quick check — ungala words-la, cloud computing enna? Mic on panni answer pannunga. Electricity bill example use pannalam.",
        question: "What is cloud computing?",
        accept_keywords: [
          "rent",
          "internet",
          "aws",
          "utility",
          "pay",
          "server",
          "infrastructure",
          "cloud",
          "provider",
          "vaangala",
          "vaanga",
          "vera",
        ],
        ren_correct:
          "Yes — correct. Cloud na internet moolama infrastructure rent panradhu — physical server vaangi potu maintain panrathu illa. Nalla irukku. Continue panrom.",
        ren_wrong:
          "Close. Oru reminder: cloud na internet la infrastructure rent — electricity bill madhiri computers-ku. Physical server vaanga vendam. Hold panni continue panrom.",
        ren_hint: "Electricity grid idea — own generator illa.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Inniku oru quick quiz. Startups yen cloud choose panraanga physical server vaangama? Board-la options paathutu right one select pannunga — illaina mic-la A, B, C, D sollunga.",
        question:
          "Why do most startups choose cloud instead of buying physical servers?",
        options: [
          "Cloud has zero ongoing cost forever",
          "No huge upfront cost — scale up or down as demand changes",
          "Cloud means you never need engineers",
          "Physical servers are illegal for startups",
        ],
        correct_index: 1,
        ren_correct:
          "Exactly — upfront cost illa, demand ku thagundhu scale aagum. Adhaan cloud win. Next.",
        ren_wrong:
          "Illaya. Big win na huge upfront hardware cost avoid panradhu, demand ku scale. Option B. Continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about today's cloud topic.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Day 1 wrap panna munadi — cloud computing paththi naan teach pannathula ethavathu doubt irukkaa? Mic on panni keelungka. Clear na 'no doubts' or 'all clear' sollunga.",
      },
    },
  },
  2: {
    en: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What does IAM control in AWS?\n\nSpeak your answer on the mic.",
        ren_voice:
          "Quick check. What does IAM control in AWS? Tell me on the mic — who gets in, and what they're allowed to do.",
        question: "What does IAM control?",
        accept_keywords: [
          "identity",
          "access",
          "permission",
          "who",
          "user",
          "policy",
          "login",
          "allow",
          "auth",
        ],
        ren_correct:
          "Yes — IAM is identity and access: who can sign in, and what they're allowed to do. Perfect. Continuing.",
        ren_wrong:
          "IAM stands for Identity and Access Management — who can enter the account and what actions they're allowed. Keep that. Let's continue.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz time. Should you use the root account for daily work? Tap or say A, B, C, or D.",
        question: "Should you use the AWS root account for daily work?",
        options: [
          "Yes — root is the fastest way to work every day",
          "No — create IAM users and avoid root for daily tasks",
          "Only if you share the password with the whole team",
          "Root and IAM are the same thing",
        ],
        correct_index: 1,
        ren_correct:
          "Correct — never use root for daily work. Create IAM users with least privilege. Moving on.",
        ren_wrong:
          "Root is for rare break-glass moments only. Daily work = IAM users. That's B. Continuing.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about IAM.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Any doubts about IAM — users, policies, root account? Mic on and ask, or say no doubts if you're clear.",
      },
    },
    tg: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What does IAM control in AWS?\n\nSpeak your answer on the mic.",
        ren_voice:
          "Quick check. AWS-la IAM enna control panum? Mic-la sollunga — yar enter aagalam, avanga enna panna allow.",
        question: "What does IAM control?",
        accept_keywords: [
          "identity",
          "access",
          "permission",
          "who",
          "user",
          "policy",
          "login",
          "allow",
          "auth",
          "yar",
          "enna",
        ],
        ren_correct:
          "Yes — IAM na identity and access: yar sign in, enna panna allow. Super. Continue.",
        ren_wrong:
          "IAM = Identity and Access Management — account-ku yar enter, enna actions allow. Hold panni continue.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. Daily work-ku root account use pannalama? Tap or A B C D sollunga.",
        question: "Should you use the AWS root account for daily work?",
        options: [
          "Yes — root is the fastest way to work every day",
          "No — create IAM users and avoid root for daily tasks",
          "Only if you share the password with the whole team",
          "Root and IAM are the same thing",
        ],
        correct_index: 1,
        ren_correct:
          "Correct — daily work-ku root vendaam. IAM users with least privilege. Next.",
        ren_wrong:
          "Root rare break-glass mattum. Daily = IAM users. Option B. Continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about IAM.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "IAM paththi — users, policies, root — ethavathu doubt irukkaa? Mic-la keelungka, illaina no doubts sollunga.",
      },
    },
  },
  3: {
    en: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What is a VPC in plain words?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. In plain words — what is a VPC? Answer on your mic.",
        question: "What is a VPC?",
        accept_keywords: [
          "network",
          "virtual",
          "private",
          "isolated",
          "your own",
          "aws network",
          "vpc",
          "subnet",
        ],
        ren_correct:
          "Yes — a VPC is your private virtual network inside AWS where you place resources. Good. Continuing.",
        ren_wrong:
          "A VPC is your own private virtual network in AWS — like a fenced neighborhood for your resources. Hold that. Continuing.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. Where should a public web server usually sit — public subnet or private? Tap or say the letter.",
        question: "A public-facing web server usually belongs in a:",
        options: [
          "Private subnet with no route to the internet",
          "Public subnet with a route to an Internet Gateway",
          "Only on your laptop, never in AWS",
          "IAM policy, not a network",
        ],
        correct_index: 1,
        ren_correct:
          "Right — public subnet with a path through an Internet Gateway. Let's continue.",
        ren_wrong:
          "Public-facing means public subnet plus Internet Gateway. That's B. Moving on.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about VPC / networking.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Any doubts on VPC, subnets, or gateways? Ask on the mic, or say no doubts.",
      },
    },
    tg: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What is a VPC in plain words?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. Simple-aa — VPC enna? Mic-la answer pannunga.",
        question: "What is a VPC?",
        accept_keywords: [
          "network",
          "virtual",
          "private",
          "isolated",
          "aws",
          "vpc",
          "subnet",
          "private network",
        ],
        ren_correct:
          "Yes — VPC na AWS-la unga private virtual network. Nalla. Continue.",
        ren_wrong:
          "VPC = AWS-la unga private virtual network — resources-ku oru fenced neighborhood. Continue.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. Public web server usually enga — public subnet-aa private-aa? Letter sollunga or tap pannunga.",
        question: "A public-facing web server usually belongs in a:",
        options: [
          "Private subnet with no route to the internet",
          "Public subnet with a route to an Internet Gateway",
          "Only on your laptop, never in AWS",
          "IAM policy, not a network",
        ],
        correct_index: 1,
        ren_correct:
          "Correct — public subnet + Internet Gateway. Continue.",
        ren_wrong:
          "Public-facing = public subnet + IGW. Option B. Continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about VPC / networking.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "VPC, subnets, gateways paththi doubt irukkaa? Mic-la keelungka, illaina no doubts.",
      },
    },
  },
  4: {
    en: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What is EC2 used for?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. What do you use EC2 for? Answer on the mic.",
        question: "What is EC2?",
        accept_keywords: [
          "virtual",
          "server",
          "compute",
          "machine",
          "instance",
          "computer",
          "vm",
          "ec2",
        ],
        ren_correct:
          "Yes — EC2 is virtual servers you rent in AWS. Good. Continuing.",
        ren_wrong:
          "EC2 gives you virtual machines — compute instances — in the cloud. Hold that. Continuing.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. S3 is mainly for what — running apps or storing objects? Tap or say the letter.",
        question: "Amazon S3 is primarily used for:",
        options: [
          "Running virtual servers like EC2",
          "Object storage for files, images, backups, and static assets",
          "Replacing IAM users",
          "Creating VPC subnets",
        ],
        correct_index: 1,
        ren_correct:
          "Yes — S3 is object storage. EC2 is compute. Clear split. Moving on.",
        ren_wrong:
          "S3 stores objects — files and assets. Compute is EC2. Answer is B. Continuing.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about EC2 or S3.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Doubts on EC2 or S3? Ask on the mic, or say no doubts if clear.",
      },
    },
    tg: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What is EC2 used for?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. EC2 enna-ku use panrom? Mic-la sollunga.",
        question: "What is EC2?",
        accept_keywords: [
          "virtual",
          "server",
          "compute",
          "machine",
          "instance",
          "computer",
          "vm",
          "ec2",
        ],
        ren_correct:
          "Yes — EC2 na AWS-la virtual servers rent. Super. Continue.",
        ren_wrong:
          "EC2 = cloud-la virtual machines / compute instances. Hold panni continue.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. S3 mainly enna — apps run panna-vaa, files store panna-vaa? Letter sollunga.",
        question: "Amazon S3 is primarily used for:",
        options: [
          "Running virtual servers like EC2",
          "Object storage for files, images, backups, and static assets",
          "Replacing IAM users",
          "Creating VPC subnets",
        ],
        correct_index: 1,
        ren_correct:
          "Yes — S3 object storage. EC2 compute. Clear. Next.",
        ren_wrong:
          "S3 files/objects store. Compute = EC2. Option B. Continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about EC2 or S3.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "EC2 or S3 paththi doubt irukkaa? Mic-la keelungka, illaina no doubts.",
      },
    },
  },
  5: {
    en: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What does CloudWatch help you do?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. What does CloudWatch help you do? Answer on the mic.",
        question: "What is CloudWatch for?",
        accept_keywords: [
          "monitor",
          "metric",
          "alarm",
          "log",
          "watch",
          "alert",
          "observ",
          "cloudwatch",
        ],
        ren_correct:
          "Yes — CloudWatch monitors metrics, logs, and alarms so you see what's happening. Continuing.",
        ren_wrong:
          "CloudWatch is monitoring — metrics, logs, alarms. Without it you're flying blind. Continuing.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. Who is responsible for watching your AWS bill so costs don't surprise you? Tap or say the letter.",
        question: "Cost awareness in AWS means:",
        options: [
          "AWS deletes resources automatically so you never pay",
          "You review billing and budgets — cost is part of the engineer's job",
          "Only Finance can open Cost Explorer",
          "CloudWatch replaces Billing entirely",
        ],
        correct_index: 1,
        ren_correct:
          "Exactly — you own cost awareness with budgets and billing views. Wrapping the teaching soon.",
        ren_wrong:
          "Engineers watch cost too — Billing and Budgets. That's B. Continuing.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about CloudWatch or billing.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "Any doubts about CloudWatch or cost and billing? Ask on the mic, or say no doubts.",
      },
    },
    tg: {
      voice: {
        type: "check_voice",
        heading: "QUICK CHECK — Are you with me?",
        board_text:
          "What does CloudWatch help you do?\n\nSpeak on the mic.",
        ren_voice:
          "Quick check. CloudWatch enna help panum? Mic-la sollunga.",
        question: "What is CloudWatch for?",
        accept_keywords: [
          "monitor",
          "metric",
          "alarm",
          "log",
          "watch",
          "alert",
          "observ",
          "cloudwatch",
        ],
        ren_correct:
          "Yes — CloudWatch metrics, logs, alarms — enna nadakuthu nu paakalam. Continue.",
        ren_wrong:
          "CloudWatch = monitoring — metrics, logs, alarms. Illana blind. Continue.",
      },
      quiz: {
        type: "check_quiz",
        heading: "QUICK QUIZ — Pick one",
        board_text: "Select the best answer (tap or say A, B, C, or D).",
        ren_voice:
          "Quiz. AWS bill surprise aagama yar paakanum? Letter sollunga or tap.",
        question: "Cost awareness in AWS means:",
        options: [
          "AWS deletes resources automatically so you never pay",
          "You review billing and budgets — cost is part of the engineer's job",
          "Only Finance can open Cost Explorer",
          "CloudWatch replaces Billing entirely",
        ],
        correct_index: 1,
        ren_correct:
          "Exactly — billing and budgets unga job-oda part. Soon wrap.",
        ren_wrong:
          "Engineers-um cost paakanum — Billing and Budgets. Option B. Continue.",
      },
      doubt: {
        type: "doubt_prompt",
        heading: "ANY DOUBTS?",
        board_text:
          "Ask Ren anything about CloudWatch or billing.\nOr say \"no doubts\" / \"all clear\".",
        ren_voice:
          "CloudWatch or billing paththi doubt irukkaa? Mic-la keelungka, illaina no doubts.",
      },
    },
  },
};

function patchLesson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw);
  const day = data.day;
  const lang = data.language === "tanglish" ? "tg" : "en";
  const pack = CHECKS[day]?.[lang];
  if (!pack) {
    console.warn("No checks for", filePath);
    return;
  }

  // Strip previously injected interactive blocks so re-run is idempotent
  const teach = data.blocks.filter(
    (b) =>
      b.type !== "check_voice" &&
      b.type !== "check_quiz" &&
      b.type !== "doubt_prompt"
  );

  // Insert voice check after first teach block, quiz after third (how), doubt at end
  const out = [];
  teach.forEach((b, i) => {
    out.push(b);
    if (i === 0) out.push(pack.voice);
    if (i === 2) out.push(pack.quiz);
  });
  out.push(pack.doubt);
  data.blocks = out;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log("patched", path.basename(filePath), "→", out.length, "blocks");
}

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const name of fs.readdirSync(root)) {
    if (!/^day\d_lesson_(english|tanglish)\.json$/.test(name)) continue;
    patchLesson(path.join(root, name));
  }
}
