import admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { StudentLesson } from '../src/types/database';

dotenv.config();

// Attempt to load the Firebase service account
let serviceAccount: any;
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('ERROR: Could not find firebase-service-account.json at the root of the project.');
  process.exit(1);
}

// Check for Gemini Key
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY or VITE_GEMINI_API_KEY is missing from .env file!');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: apiKey });

const WEEKS = [
  { week: 1, topic: 'Internet Architecture & Client-Server Models', difficulty: 'Beginner' },
  { week: 2, topic: 'HTTP Protocols, Methods, and Web APIs', difficulty: 'Beginner' },
  { week: 3, topic: 'HTML Semantic Structure & CSS Flexbox', difficulty: 'Beginner' },
  { week: 4, topic: 'JavaScript ES6 Foundations & Async/Await', difficulty: 'Moderate' },
  { week: 5, topic: 'Git Version Control & Branching', difficulty: 'Moderate' },
  { week: 6, topic: 'Relational vs NoSQL Database Concepts', difficulty: 'Moderate' },
  { week: 7, topic: 'Node.js & Express REST Routing', difficulty: 'Hard' },
  { week: 8, topic: 'JWT Authentication & Web Security', difficulty: 'Pro' }
];

const JSON_SCHEMA_EXAMPLE = `
[{
  "id": "SL_W1_D1",
  "title": "Understanding the Client",
  "concept_explanation": {
    "what_is_this": "...", "how_we_use_it": "...", "where_we_use_it": "...",
    "where_not_to_use_it": "...", "impact": "..."
  },
  "key_points": ["point 1", "point 2", "point 3"],
  "whiteboard_content": ["visual 1", "visual 2"],
  "interaction_questions": ["What is a client?"],
  "expected_answers": ["browser", "device"],
  "validation_logic": ["browser"],
  "correct_response": "Correct!",
  "wrong_response": "Incorrect.",
  "real_world_example": "Like ordering food.",
  "quizzes": [{
    "quiz_id": "Q_SL_W1_D1",
    "title": "Client Quiz",
    "questions": [{
      "question_id": "q1", "question_text": "...", "options": ["A","B","C","D"],
      "correct_answer": "A", "explanation": "..."
    }]
  }],
  "linked_scenario_ids": ["PS_placeholder"],
  "duration_estimate": 10,
  "difficulty_level": "Beginner",
  "part_number": 1
}]`;

async function generateWeekContent(weekObj: { week: number, topic: string, difficulty: string }) {
  console.log(`🤖 Generating Week ${weekObj.week} Content: ${weekObj.topic} (${weekObj.difficulty})...`);

  const prompt = `
Generate exactly 5 distinct structured JSON learning modules matching the 'StudentLesson' format.
These 5 modules represent 5 days of learning for Week ${weekObj.week}. 
The over-arching topic for this week is: "${weekObj.topic}".
The difficulty level must be strictly: "${weekObj.difficulty}".

Make the content highly educational, realistic for software development, and tailored to an Indian student tone (calm, un-rushed, deeply technical but accessible).

Output MUST be a valid JSON array of 5 objects matching this exact structure:
${JSON_SCHEMA_EXAMPLE}

Be sure the array is clean valid JSON, with absolutely no markdown code blocks backing it (or if you must, just standard JSON parseable format).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text || "[]";
    const data: StudentLesson[] = JSON.parse(jsonText);
    
    // Validate we got an array
    if (Array.isArray(data) && data.length > 0) {
      // Modify IDs to be truly unique
      data.forEach((lesson, index) => {
        lesson.id = `SL_W${weekObj.week}_D${index + 1}`;
        lesson.difficulty_level = weekObj.difficulty as any;
      });
      return data;
    } else {
      console.warn(`⚠️ Week ${weekObj.week} skipped - Received malformed JSON array.`);
      return [];
    }
  } catch (err) {
    console.error(`❌ Error generating Week ${weekObj.week}: `, err);
    return [];
  }
}

async function runBulkGeneration() {
  console.log('🚀 Starting 2-Month Bulk Extraction to Firebase...');

  for (const week of WEEKS) {
    const lessons = await generateWeekContent(week);
    
    if (lessons.length > 0) {
      console.log(`📦 Pushing ${lessons.length} lessons to Firestore for Week ${week.week}...`);
      const batch = db.batch();
      for (const lesson of lessons) {
        const docRef = db.collection('rebon_student_lessons').doc(lesson.id);
        batch.set(docRef, lesson);
      }
      await batch.commit();
      console.log(`✅ Week ${week.week} safely locked in Database!`);
    }

    // Wait 3 seconds between weeks to respect API rate limits
    console.log('⏳ Pausing briefly to respect Gemini API Limits...');
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('🎉 2-MONTH BULK STUDENT CURRICULUM SUCCESSFULLY GENERATED AND UPLOADED!');
}

runBulkGeneration();
