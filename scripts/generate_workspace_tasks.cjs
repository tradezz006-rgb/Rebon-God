const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_PATH = path.join(__dirname, '../.env');
function readEnvKey(name) {
    if (process.env[name]) return process.env[name];
    if (!fs.existsSync(ENV_PATH)) return "";
    const line = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/).find((l) => l.startsWith(name + "="));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}
const groqKey = readEnvKey("VITE_GROQ_API_KEY") || readEnvKey("GROQ_API_KEY");

if (!groqKey) {
    console.error("VITE_GROQ_API_KEY (or GROQ_API_KEY) not found in .env");
    process.exit(1);
}

const SESSION_FILE = path.join(__dirname, '../src/data/sessions/session1 tanglish.json');

async function callGroqAPI(prompt) {
    const requestData = JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are an expert curriculum developer generating JSON for workspace tasks. Output ONLY valid JSON, starting with { and ending with }.`
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`API Error ${res.statusCode}: ${body}`));
                } else {
                    try {
                        const parsed = JSON.parse(body);
                        const content = parsed.choices[0].message.content;
                        resolve(JSON.parse(content));
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}\\nBody: ${body}`));
                    }
                }
            });
        });
        req.on('error', reject);
        req.write(requestData);
        req.end();
    });
}

async function generateTasksForLesson(lesson) {
    console.log(`Generating tasks for Lesson ${lesson.lesson_id} - ${lesson.lesson_title}...`);
    
    // Difficulty enforcement based on lesson ID
    let difficultyRule = "easy to medium (Foundational level). Do not use 'hard' or 'expert' for this lesson.";
    if (lesson.lesson_id.startsWith('C4') || lesson.lesson_id.startsWith('C5')) {
        difficultyRule = "medium to hard.";
    } else if (lesson.lesson_id.startsWith('C6') || lesson.lesson_id.startsWith('C7')) {
        difficultyRule = "hard to expert.";
    }
    // Session 1 is 1.x
    if (lesson.lesson_id.startsWith('1.')) {
        difficultyRule = "easy to medium (Foundational level). Do not use 'hard' or 'expert' for this foundational lesson.";
    }

    const prompt = `
Generate the fully fleshed-out workspace interactive tasks based on the following spec.
Lesson ID: ${lesson.lesson_id}
Lesson Title: ${lesson.lesson_title}

DIFFICULTY ENFORCEMENT: 
For this lesson, the difficulty must be strictly: ${difficultyRule}
If the spec asks for "hard", downgrade it to "medium" if this is a foundational lesson.

REQUIREMENTS FOR EACH TASK:
1. Must include a 'ui_component' field mapped accurately:
   - quiz -> "MultipleChoiceComponent"
   - scenario_task -> "ConsoleInteractionComponent"
   - config_audit -> "SecurityConfigAuditComponent"
   - cost_analysis -> "BillingCalculatorComponent"
   - match_task -> "MatchComponent"
   - order_task -> "OrderComponent"
   - code_task -> "CodeSandboxComponent"
   - output_predict -> "OutputPredictComponent"
   - debug_task -> "DebugComponent"
   (Default to MultipleChoiceComponent if unsure, but match correctly based on task type).
2. Must include 'ava_feedback_correct' (Tanglish spoken by Ren when student gets it right).
3. Must include 'ava_feedback_wrong' (Tanglish spoken by Ren when student gets it wrong).
4. For 'quiz', 'output_predict', 'debug_task': include 'options' (array of strings) and 'correct_index' (integer).
5. For 'match_task': include 'left_items' (array), 'right_items' (array), and 'correct_pairs' (array of [leftIdx, rightIdx]).
6. For 'order_task': include 'steps' (array of strings scrambled) and 'correct_order' (array of integers matching the chronological order of the steps).
7. For 'code_task': include 'starter_code' (string) and 'expected_output' or validation logic if any.
8. Include 'whiteboard_heading' and 'whiteboard_points' (English) for the UI whiteboard.

Here is the SPEC:
${JSON.stringify(lesson.workspace_tasks_spec, null, 2)}

OUTPUT SCHEMA:
Return a JSON object with a single key "workspace_tasks" containing an array of the fully fleshed-out task objects.
{
  "workspace_tasks": [
    {
      "task_number": 1,
      "type": "quiz",
      "ui_component": "MultipleChoiceComponent",
      "difficulty": "easy",
      "topic": "...",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 1,
      "ava_feedback_correct": "Tanglish explanation...",
      "ava_feedback_wrong": "Tanglish correction...",
      "whiteboard_heading": "...",
      "whiteboard_points": ["..."]
    },
    ...
  ]
}
`;

    try {
        const result = await callGroqAPI(prompt);
        return result.workspace_tasks;
    } catch (e) {
        console.error(`Failed to generate tasks for ${lesson.lesson_id}:`, e);
        return null;
    }
}

async function run() {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch (e) {
        console.error("Failed to read session file:", e);
        process.exit(1);
    }

    const lessons = Array.isArray(data) ? data : (data.lessons || []);

    for (const lesson of lessons) {
        if (!lesson.workspace_tasks_spec) {
            console.log(`Skipping ${lesson.lesson_id}, no spec found.`);
            continue;
        }
        
        // Skip if already generated and has the new fields (ui_component)
        if (lesson.workspace_tasks && lesson.workspace_tasks.length > 0 && lesson.workspace_tasks[0].ui_component) {
            console.log(`Skipping ${lesson.lesson_id}, tasks already generated.`);
            continue;
        }

        const tasks = await generateTasksForLesson(lesson);
        if (tasks) {
            lesson.workspace_tasks = tasks;
            fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
            console.log(`✅ Saved workspace_tasks for ${lesson.lesson_id}`);
            // Wait 8 seconds to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
    }
    console.log("All done!");
}

run();
