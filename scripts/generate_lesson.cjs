const fs = require('fs');
const path = require('path');
const https = require('https');

const nvidiaKey = "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";
console.log("Using API Key:", nvidiaKey.substring(0, 10) + "..." + nvidiaKey.substring(nvidiaKey.length - 4));
const RULES_PATH = path.join(__dirname, '../src/data/sessions/Lesson_Rules.json');

async function generateLesson(lessonId) {
    const rulesStr = fs.readFileSync(RULES_PATH, 'utf8');
    const rules = JSON.parse(rulesStr);

    let targetLesson = null;
    let targetSectionId = null;
    let targetSection = null;

    for (const [sectionId, section] of Object.entries(rules.curriculum)) {
        if (section.lessons && section.lessons[lessonId]) {
            targetLesson = section.lessons[lessonId];
            targetSectionId = sectionId;
            targetSection = section;
            break;
        }
    }

    if (!targetLesson) {
        console.error(`Lesson ${lessonId} not found in curriculum.`);
        return;
    }

    const systemPrompt = rules.system_prompt;
    const userPrompt = `
Generate the lesson JSON for the following lesson.
Section: ${targetSection.section_name} (${targetSectionId})
Lesson ID: ${lessonId}
Title: ${targetLesson.title}
Prerequisites: ${targetLesson.prerequisites}
Key Concepts: ${targetLesson.key_concepts.join(", ")}
Company Story: ${targetLesson.company_story}
Mistake: ${targetLesson.mistake}
Mini Challenge Topics: ${targetLesson.mini_challenge_topics.join(", ")}
Workspace Tasks: ${targetLesson.workspace_count} total tasks, types: ${targetLesson.workspace_types.join(", ")}

CRITICAL DURATION RULE: We DO NOT want a 30-minute duration for every lesson. Limit the maximum duration to 20 minutes, and scale it down dynamically depending on the topic. If 5 minutes is enough to teach the concept, make it a 5-minute lesson. If it needs 15 or 17 minutes, use that. DO NOT artificially bloat the content. Keep explanations concise and impactful.

IMPORTANT: Follow this exact schema and output valid JSON ONLY:
${JSON.stringify(rules.lesson_schema, null, 2)}

Refer to these workspace task types for the workspace section:
${JSON.stringify(rules.workspace_task_types, null, 2)}

Refer to these board action types:
${JSON.stringify(rules.board_action_types, null, 2)}
`;

    const requestData = JSON.stringify({
        model: "meta/llama-3.1-70b-instruct", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.6,
        stream: true
    });

    const options = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Length': Buffer.byteLength(requestData),
            'Accept': 'text/event-stream'
        }
    };

    console.log(`Calling NVIDIA API for ${lessonId} (Streaming Mode)...`);

    const req = https.request(options, (res) => {
        let fullContent = '';

        if (res.statusCode !== 200) {
            let errorBody = '';
            res.on('data', (chunk) => { errorBody += chunk; });
            res.on('end', () => {
                console.error(`API Error: ${res.statusCode}`, errorBody);
            });
            return;
        }

        res.on('data', (chunk) => {
            const lines = chunk.toString('utf8').split('\\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                            fullContent += parsed.choices[0].delta.content;
                        }
                    } catch (e) {
                        // ignore unparseable chunks
                    }
                }
            }
        });

        res.on('end', () => {
            console.log("\\nStream complete. Parsing JSON...");
            try {
                // Find JSON boundaries in case the model output markdown blocks
                let jsonString = fullContent.trim();
                if (jsonString.startsWith('\`\`\`json')) {
                    jsonString = jsonString.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
                }

                const parsedContent = JSON.parse(jsonString);
                const outPath = path.join(__dirname, '../src/data/sessions/session1 tanglish.json');
                
                let existingData = [];
                if (fs.existsSync(outPath)) {
                    try {
                        const content = fs.readFileSync(outPath, 'utf8');
                        if (content.trim() !== '') {
                            const parsed = JSON.parse(content);
                            if (Array.isArray(parsed)) {
                                existingData = parsed;
                            } else if (parsed.lessons) {
                                existingData = parsed.lessons;
                                if (lessonId === 'C1.1' && existingData.some(l => l.lesson_id === '1.1')) {
                                    existingData = [];
                                }
                            }
                        }
                    } catch(e) {
                        existingData = [];
                    }
                }

                const existingIndex = existingData.findIndex(l => l.lesson_id === lessonId);
                if (existingIndex >= 0) {
                    existingData[existingIndex] = parsedContent;
                } else {
                    existingData.push(parsedContent);
                }

                fs.writeFileSync(outPath, JSON.stringify(existingData, null, 2));
                console.log(`Success! Saved lesson to ${outPath}`);
            } catch (e) {
                console.error("Failed to parse the API response into JSON. The model might have output markdown formatting.", e.message);
                console.error("First 500 chars:", fullContent.substring(0, 500));
                console.error("Last 500 chars:", fullContent.substring(fullContent.length - 500));
                
                // Fallback save raw content to debug
                fs.writeFileSync(path.join(__dirname, '../src/data/sessions/debug_raw_output.txt'), fullContent);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Request failed: ${e.message}`);
    });
    
    req.write(requestData);
    req.end();
}

generateLesson(process.argv[2] || 'C1.1');
