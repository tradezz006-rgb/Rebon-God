/**
 * Prepend a lesson_intro block to each Student Mode lesson (EN + Tanglish).
 * Idempotent — skips if lesson_intro already exists.
 * Run: node scripts/inject-lesson-intros.mjs
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

const INTROS = {
  1: {
    en: {
      heading: "WELCOME — DAY 1",
      board_text:
        "Student Mode · Day 1 of 5\n\nToday's focus:\n• What cloud computing actually is\n• Why companies moved to cloud\n• Regions, the AWS console, and scaling\n\nHow this class works:\n• I teach on the board while I speak\n• After each step, I ask a quick check — answer on your mic\n• At the end: summary + doubt session",
      ren_voice:
        "Welcome. I am Ren, and this is Day 1 of Student Mode. Before we touch IAM, VPCs, or any console tickets, we need a clear mental model of cloud itself — what it is, why it won, and how AWS is organized. Today we will move step by step. I will write on the board as I teach. After each idea, I will pause and ask you a short question — answer on your mic. Ready? Let's start with the foundation.",
    },
    tg: {
      heading: "WELCOME — DAY 1",
      board_text:
        "Student Mode · Day 1 of 5\n\nToday's focus:\n• What cloud computing actually is\n• Why companies moved to cloud\n• Regions, the AWS console, and scaling\n\nHow this class works:\n• I teach on the board while I speak\n• After each step, I ask a quick check — answer on your mic\n• At the end: summary + doubt session",
      ren_voice:
        "Welcome. Naan Ren. Ithu Student Mode Day 1. IAM, VPC, console tickets ellam apram. First cloud-a clear-a understand pannanum — enna, yen win aaguchu, AWS eppadi organize aaguchu. Step by step poguvom. Naan board-la ezhuthi teach panren. Oru idea mudinchaa, short question kekkuven — mic-la answer pannunga. Ready-aa? Foundation-la start panrom.",
    },
  },
  2: {
    en: {
      heading: "WELCOME — DAY 2",
      board_text:
        "Student Mode · Day 2 of 5\n\nYesterday: what cloud is and how AWS is organized.\nToday: Identity and Access Management (IAM)\n\nWe will cover:\n• Users, roles, and policies\n• Why root is dangerous for daily work\n• Least privilege and real IAM mistakes",
      ren_voice:
        "Welcome back. Day 2. Yesterday we built the cloud mental model — renting infrastructure, Regions, the console. Today we go inside the account itself. Who can sign in? What are they allowed to do? That is IAM — Identity and Access Management — and every secure AWS setup starts here. Same classroom rhythm: I teach, I write, then I check you on the mic. Let's begin.",
    },
    tg: {
      heading: "WELCOME — DAY 2",
      board_text:
        "Student Mode · Day 2 of 5\n\nYesterday: what cloud is and how AWS is organized.\nToday: Identity and Access Management (IAM)\n\nWe will cover:\n• Users, roles, and policies\n• Why root is dangerous for daily work\n• Least privilege and real IAM mistakes",
      ren_voice:
        "Welcome back. Day 2. Netru cloud mental model build pannom — rent, Regions, console. Inniku account-ku ulleye poguvom. Yaaru sign in panna mudiyum? Enna panna allow? Adhu IAM — Identity and Access Management. Secure AWS ellam ithula irundhu start aagum. Same rhythm: teach, board, mic check. Start panrom.",
    },
  },
  3: {
    en: {
      heading: "WELCOME — DAY 3",
      board_text:
        "Student Mode · Day 3 of 5\n\nYou know cloud and IAM.\nToday: Networking Basics — VPC\n\nWe will cover:\n• What a VPC is and why isolation matters\n• Public vs private subnets\n• Internet gateways and traffic paths",
      ren_voice:
        "Welcome to Day 3. You understand cloud and who gets into the account. Today we draw the walls — networking. VPC means Virtual Private Cloud: your private slice of AWS where you decide what is public, what stays private, and how traffic moves. This is the map every EC2 and database sits inside. I will teach, write, and check you as we go. Let's open the network.",
    },
    tg: {
      heading: "WELCOME — DAY 3",
      board_text:
        "Student Mode · Day 3 of 5\n\nYou know cloud and IAM.\nToday: Networking Basics — VPC\n\nWe will cover:\n• What a VPC is and why isolation matters\n• Public vs private subnets\n• Internet gateways and traffic paths",
      ren_voice:
        "Welcome Day 3. Cloud and IAM theriyum. Inniku walls draw panrom — networking. VPC na Virtual Private Cloud: AWS-la unga private slice — enna public, enna private, traffic eppadi move aagum. EC2 and database ellam indha map-ku ulleye irukkum. Teach, board, mic check. Network open panrom.",
    },
  },
  4: {
    en: {
      heading: "WELCOME — DAY 4",
      board_text:
        "Student Mode · Day 4 of 5\n\nToday: Compute and Storage — EC2 + S3\n\nWe will cover:\n• EC2 as rented virtual computers\n• S3 as object storage for files\n• How real apps use both together",
      ren_voice:
        "Welcome to Day 4. Identity and network are in place. Now the two services almost every app uses: EC2 for compute — a virtual computer that runs your code — and S3 for storage — files, images, backups. Once you can separate run versus store, AWS architecture starts to click. Same class flow. Let's build that mental model.",
    },
    tg: {
      heading: "WELCOME — DAY 4",
      board_text:
        "Student Mode · Day 4 of 5\n\nToday: Compute and Storage — EC2 + S3\n\nWe will cover:\n• EC2 as rented virtual computers\n• S3 as object storage for files\n• How real apps use both together",
      ren_voice:
        "Welcome Day 4. Identity and network ready. Inniku rendu services — almost every app use panradhu: EC2 compute — code run panna virtual computer — and S3 storage — files, images, backups. Run versus store clear aanaa, AWS architecture click aagum. Same class flow. Mental model build panrom.",
    },
  },
  5: {
    en: {
      heading: "WELCOME — DAY 5",
      board_text:
        "Student Mode · Day 5 of 5\n\nToday: Monitoring and Cost — CloudWatch + Billing\n\nWe will cover:\n• Metrics and alarms so you know when systems break\n• Cost Explorer and Budgets so spend does not surprise you\n• Closing the Student Mode foundation week",
      ren_voice:
        "Welcome to Day 5 — the last day of Student Mode foundations. You can describe cloud, IAM, networking, compute, and storage. Today we close the loop: CloudWatch so you see when the system is unhealthy, and Billing so you see when the spend is unhealthy. Engineers who skip this learn the hard way. Same rhythm — teach, board, mic checks, then summary and doubts. Let's finish strong.",
    },
    tg: {
      heading: "WELCOME — DAY 5",
      board_text:
        "Student Mode · Day 5 of 5\n\nToday: Monitoring and Cost — CloudWatch + Billing\n\nWe will cover:\n• Metrics and alarms so you know when systems break\n• Cost Explorer and Budgets so spend does not surprise you\n• Closing the Student Mode foundation week",
      ren_voice:
        "Welcome Day 5 — Student Mode foundation last day. Cloud, IAM, networking, compute, storage theriyum. Inniku loop close panrom: CloudWatch — system unhealthy-aa nu paakka, Billing — spend surprise aagama. Ithai skip panna engineers hard way-la learn panraanga. Same rhythm — teach, board, mic, summary, doubts. Strong-a mudikkalaam.",
    },
  },
};

function patch(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw);
  if (data.blocks?.[0]?.type === "lesson_intro") {
    console.log("skip (has intro)", path.basename(filePath));
    return;
  }
  const day = data.day;
  const lang = data.language === "tanglish" ? "tg" : "en";
  const pack = INTROS[day]?.[lang];
  if (!pack) {
    console.warn("no intro for", filePath);
    return;
  }
  const intro = {
    block: 0,
    type: "lesson_intro",
    heading: pack.heading,
    board_text: pack.board_text,
    ren_voice: pack.ren_voice,
    check_question: null,
  };
  data.blocks = [intro, ...data.blocks.map((b, i) => ({ ...b, block: i + 1 }))];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log("intro →", path.basename(filePath), "blocks=", data.blocks.length);
}

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const name of fs.readdirSync(root)) {
    if (!/^day\d_lesson_(english|tanglish)\.json$/.test(name)) continue;
    patch(path.join(root, name));
  }
}
