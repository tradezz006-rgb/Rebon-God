import admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { studentLessonsSeed } from '../src/data/seed/studentMode';
import { professionalScenariosSeed } from '../src/data/seed/professionalMode';
import { aiCompanionTasksSeed } from '../src/data/seed/aiCompanionMode';

// Load env just in case
dotenv.config();

// Attempt to load the service account
let serviceAccount: any;
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('ERROR: Could not find firebase-service-account.json at the root of the project.');
  console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
  console.log('Starting Firebase Database Seed...');
  
  try {
    // 1. Seed Student Lessons
    console.log(`Uploading ${studentLessonsSeed.length} Student Lessons...`);
    const studentBatch = db.batch();
    for (const lesson of studentLessonsSeed) {
      const docRef = db.collection('rebon_student_lessons').doc(lesson.id);
      studentBatch.set(docRef, lesson);
    }
    await studentBatch.commit();
    console.log('✅ Student lessons seeded successfully.');

    // 2. Seed Professional Scenarios
    console.log(`Uploading ${professionalScenariosSeed.length} Professional Scenarios...`);
    const proBatch = db.batch();
    for (const scenario of professionalScenariosSeed) {
      const docRef = db.collection('rebon_professional_scenarios').doc(scenario.id);
      proBatch.set(docRef, scenario);
    }
    await proBatch.commit();
    console.log('✅ Professional Scenarios seeded successfully.');

    // 3. Seed AI Companion Tasks
    console.log(`Uploading ${aiCompanionTasksSeed.length} AI Companion Tasks...`);
    const aiBatch = db.batch();
    for (const task of aiCompanionTasksSeed) {
      const docRef = db.collection('rebon_ai_companion_tasks').doc(task.task_id);
      aiBatch.set(docRef, task);
    }
    await aiBatch.commit();
    console.log('✅ AI Companion Tasks seeded successfully.');

    console.log('🎉 WHOLE INIT SEED COMPLETED SUCCESSFULLY!');
    
  } catch (err) {
    console.error('❌ Failed to seed Firebase database:', err);
  }
}

seedDatabase();
