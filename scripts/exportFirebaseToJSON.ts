import admin from 'firebase-admin';
import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCurriculum() {
  console.log('Fetching Student Lessons from Firebase...');
  const lessonsSnap = await db.collection('rebon_student_lessons').get();
  const lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log('Fetching Professional Scenarios from Firebase...');
  const scenariosSnap = await db.collection('rebon_professional_scenarios').get();
  const scenarios = scenariosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const exportData = {
      rebon_student_lessons: lessons,
      rebon_professional_scenarios: scenarios
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, '../src/data/generatedCurriculum.json');
  
  writeFileSync(outPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ Successfully exported ${lessons.length} lessons and ${scenarios.length} scenarios to JSON!`);
}

exportCurriculum().then(() => process.exit(0)).catch(console.error);
