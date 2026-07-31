const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

if (!SARVAM_API_KEY) {
  console.error("SARVAM_API_KEY not found in .env");
  process.exit(1);
}

const sourceFile = path.join(__dirname, '../src/data/sessions/session1 tanglish.json');
const outputBaseDir = path.join(__dirname, '../public/audio/session1');

if (!fs.existsSync(outputBaseDir)) {
  fs.mkdirSync(outputBaseDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const manifest = {};

async function generateSpeech(text, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping (already exists): ${outputPath}`);
    return;
  }
  
  console.log(`Generating: ${outputPath}`);
  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: "ta-IN",
        speaker: "priya",
        model: "bulbul:v3",
        speech_sample_rate: 22050,
        enable_preprocessing: true
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Failed to generate ${outputPath}:`, err);
      return;
    }

    const json = await response.json();
    if (json.audios && json.audios.length > 0) {
      const audioBase64 = json.audios[0];
      fs.writeFileSync(outputPath, Buffer.from(audioBase64, 'base64'));
      console.log(`Saved: ${outputPath}`);
    } else {
      console.error(`No audio returned for ${outputPath}`);
    }
  } catch (err) {
    console.error(`Error generating ${outputPath}:`, err);
  }
  
  // Throttle slightly to avoid rate limits
  await new Promise(r => setTimeout(r, 500));
}

async function processLesson(lesson) {
  const lessonId = lesson.lesson_id;
  const lessonDir = path.join(outputBaseDir, lessonId);
  if (!fs.existsSync(lessonDir)) {
    fs.mkdirSync(lessonDir, { recursive: true });
  }

  manifest[lessonId] = {
    blocks: {}
  };

  const getAudioPath = (filename) => path.join(lessonDir, filename);
  const getPublicUrl = (filename) => `/audio/session1/${lessonId}/${filename}`;

  // 1. Intro
  if (lesson.ava_lesson_intro?.ava_speaks) {
    const file = 'intro.mp3';
    await generateSpeech(lesson.ava_lesson_intro.ava_speaks, getAudioPath(file));
    manifest[lessonId].intro = getPublicUrl(file);
  }

  // 2. Blocks
  if (lesson.blocks) {
    for (let i = 0; i < lesson.blocks.length; i++) {
      const block = lesson.blocks[i];
      const blockIndex = i + 1;
      const bType = block.block_type;
      const blockManifest = {};

      // main speak
      if (block.ava_speaks) {
        // e.g. block_1_concept_intro.mp3
        const file = `block_${blockIndex}_${bType}.mp3`;
        await generateSpeech(block.ava_speaks, getAudioPath(file));
        blockManifest.main = getPublicUrl(file);
      }

      // concept_intro inline_questions
      if (bType === 'concept_intro' && block.inline_questions) {
        for (let j = 0; j < block.inline_questions.length; j++) {
          const iq = block.inline_questions[j];
          const qNum = j + 1;
          if (iq.ava_correct) {
            const file = `iq_${qNum}_correct.mp3`;
            await generateSpeech(iq.ava_correct, getAudioPath(file));
            blockManifest[`iq_${qNum}_correct`] = getPublicUrl(file);
          }
          if (iq.ava_wrong) {
            const file = `iq_${qNum}_wrong.mp3`;
            await generateSpeech(iq.ava_wrong, getAudioPath(file));
            blockManifest[`iq_${qNum}_wrong`] = getPublicUrl(file);
          }
        }
      }

      // live_build steps
      if (bType === 'live_build' && block.editor_session?.steps) {
        for (let j = 0; j < block.editor_session.steps.length; j++) {
          const step = block.editor_session.steps[j];
          const stepNum = j + 1;
          if (step.ava_narration) {
            const file = `block_${blockIndex}_step_${stepNum}.mp3`;
            await generateSpeech(step.ava_narration, getAudioPath(file));
            blockManifest[`step_${stepNum}`] = getPublicUrl(file);
          }
        }
      }

      // student_try correct/hint
      if (bType === 'student_try') {
        const solExp = block.ava_solution?.explanation;
        if (solExp) {
          const file = `block_${blockIndex}_correct.mp3`;
          await generateSpeech(solExp, getAudioPath(file));
          blockManifest.correct = getPublicUrl(file);
        }
        const hints = block.hints?.join('. ');
        if (hints) {
          const file = `block_${blockIndex}_hint.mp3`;
          await generateSpeech(hints, getAudioPath(file));
          blockManifest.hint = getPublicUrl(file);
        }
      }

      // mini_challenge answers
      if (bType === 'mini_challenge' && block.challenges) {
        for (let j = 0; j < block.challenges.length; j++) {
          const challenge = block.challenges[j];
          const cNum = j + 1;
          if (challenge.answer) { // Using answer as explanation? Wait, the user brief says "challenge_1_answer.mp3". Yes.
            const file = `challenge_${cNum}_answer.mp3`;
            // I should use AVA's feedback, but it's not defined, or maybe I should use `challenge.answer` since it is the Tanglish explanation
            await generateSpeech(challenge.answer, getAudioPath(file));
            blockManifest[`challenge_${cNum}_answer`] = getPublicUrl(file);
          }
        }
      }

      manifest[lessonId].blocks[blockIndex] = blockManifest;
    }
  }

  // 3. Summary
  if (lesson.lesson_summary?.ava_speaks) {
    const file = 'summary.mp3';
    await generateSpeech(lesson.lesson_summary.ava_speaks, getAudioPath(file));
    manifest[lessonId].summary = getPublicUrl(file);
  }
}

async function main() {
  for (const lesson of data.lessons) {
    console.log(`\nProcessing Lesson ${lesson.lesson_id}...`);
    await processLesson(lesson);
  }

  fs.writeFileSync(path.join(outputBaseDir, 'voice_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log("\nDone! Manifest saved to voice_manifest.json");
}

main().catch(console.error);
