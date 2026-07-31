import admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { ProfessionalScenario } from '../src/types/database';

dotenv.config();

let serviceAccount: any;
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('ERROR: Could not find firebase-service-account.json');
  process.exit(1);
}

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is missing from .env file!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const ai = new GoogleGenAI({ apiKey: apiKey });

const SCENARIO_SCHEMA_EXAMPLE = `
{
  "id": "PS_W1_D1",
  "role": "Junior Full Stack Developer",
  "problem_statement": "A highly specific problem based explicitly on the lesson.",
  "company_context": "Simulated workplace setting.",
  "required_skills": ["skill 1", "skill 2"],
  "steps_to_solve": ["step 1", "step 2", "step 3"],
  "common_mistakes": ["mistake 1", "mistake 2"],
  "hints_level_1": ["hint 1"],
  "hints_level_2": ["hint 2"],
  "final_solution": "The correct implementation or output.",
  "evaluation_metrics": ["metric 1", "metric 2"],
  "time_expected": 30,
  "difficulty_level": "Beginner"
}`;

async function generateScenarioForLesson(lesson: any) {
  const prompt = `
Generate exactly ONE distinct structured JSON scenario matching the 'ProfessionalScenario' format.
This scenario MUST specifically test the user on the exact key points and concepts taught in this exact lesson:
Lesson Title: "${lesson.title}"
Lesson Difficulty: "${lesson.difficulty_level}"
Lesson Key Points: ${JSON.stringify(lesson.key_points)}

The problem MUST make the student prove they learned this exact lesson's concepts in a simulated workplace environment.
Output MUST be a single valid JSON object matching this exact structure:
${SCENARIO_SCHEMA_EXAMPLE}

Be sure it is pure valid JSON, absolutely no markdown code blocks backing it.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text || "{}";
    const data: ProfessionalScenario = JSON.parse(jsonText);
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Enforce tight linking
        data.id = `PS_${lesson.id}`; 
        data.difficulty_level = lesson.difficulty_level;
        return data;
    }
    return null;
  } catch (err) {
    console.error(`❌ Error generating Scenario for ${lesson.title}: `, err);
    return null;
  }
}

async function runScenarioGeneration() {
  console.log('🚀 Starting Scenario Gap-Filler Script...');
  
  const lessonsSnapshot = await db.collection('rebon_student_lessons').get();
  const lessons = lessonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${lessons.length} lessons. Generating tight scenarios for each...`);

  let count = 0;
  for (const lesson of lessons) {
    count++;
    console.log(`[${count}/${lessons.length}] Generating Scenario for ${lesson.id}: ${lesson.title}...`);
    
    const scenario = await generateScenarioForLesson(lesson);
    
    if (scenario) {
      // 1. Save Scenario to Firebase
      await db.collection('rebon_professional_scenarios').doc(scenario.id).set(scenario);
      
      // 2. Update the original StudentLesson to link perfectly to this specific scenario
      await db.collection('rebon_student_lessons').doc(lesson.id).update({
        linked_scenario_ids: [scenario.id]
      });
      
      console.log(`✅ successfully linked ${scenario.id}`);
    } else {
      console.warn(`⚠️ Skipped ${lesson.id} due to malformed response.`);
    }

    // Rate limiting precaution (roughly 30 requests per minute tolerance)
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🎉 SCENARIO LINKING 100% COMPLETE!');
}

runScenarioGeneration();
