import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || Deno.env.get('VITE_GROQ_API_KEY') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY') || '';
const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY') || 'sk_ilxzhypm_NiVrvhKEqiZPTHwZIZU9noUn';

// R2 Configuration
const R2_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY') || '';
const R2_SECRET_KEY = Deno.env.get('CLOUDFLARE_R2_SECRET_KEY') || '';
const R2_ENDPOINT = Deno.env.get('CLOUDFLARE_R2_ENDPOINT') || '';
const R2_BUCKET = Deno.env.get('CLOUDFLARE_R2_BUCKET') || 'rebon-audio';
const AUDIO_CDN_BASE_URL = Deno.env.get('AUDIO_CDN_BASE_URL') || 'https://audio.rebon.in';

// Initialize Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, question, context, lesson_id, block_number, block_type, step_number, question_number, response_type, text } = await req.json();

    // ─────────────────────────────────────────────────────────────────────────
    // PILLAR 1: GET LESSON AUDIO LOOKUP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'get_lesson_audio') {
      if (!lesson_id) {
        return new Response(JSON.stringify({ error: "Missing lesson_id" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Build search query based on available parameters
      let query = supabase
        .from('audio_files')
        .select('*')
        .eq('lesson_id', lesson_id)
        .eq('audio_type', block_type ? 'block' : (response_type ? 'iq' : (step_number ? 'block' : (question_number ? 'challenge' : 'summary'))));

      if (block_number !== undefined) query = query.eq('block_number', block_number);
      if (block_type !== undefined) query = query.eq('block_type', block_type);
      if (step_number !== undefined) query = query.eq('step_number', step_number);
      if (question_number !== undefined) query = query.eq('question_number', question_number);
      if (response_type !== undefined) query = query.eq('response_type', response_type);

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Supabase query error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      return new Response(JSON.stringify({ found: !!data, audio: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PILLAR 1.5: DYNAMIC AUDIO SYNTHESIS & CACHE (SYSTEM WIDE DIALOGUE SPEECH)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'synthesize') {
      if (!text) {
        return new Response(JSON.stringify({ error: "Missing text" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const cleanedText = text
        .replace(/\bAVA\b/g, 'Ren')
        .replace(/\bAva\b/g, 'Ren')
        .replace(/\bava\b/g, 'ren');

      const textNormal = cleanedText
        .toLowerCase()
        .trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .replace(/\s+/g, " ");

      const utf8 = new TextEncoder().encode(textNormal);
      const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const textHashShort = hashHex.substring(0, 12);

      // Check cache first in audio_files table (lesson_id = 'synthesis')
      const { data: cacheHit, error: cacheErr } = await supabase
        .from('audio_files')
        .select('*')
        .eq('lesson_id', 'synthesis')
        .eq('r2_key', `synthesis/${textHashShort}.mp3`)
        .maybeSingle();

      if (cacheHit) {
        console.log(`🎯 SYNTHESIS CACHE HIT for text: "${cleanedText.substring(0, 40)}..."`);
        return new Response(JSON.stringify({
          source: 'cache_hit',
          cdn_url: cacheHit.cdn_url
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`🔊 Calling Sarvam Bulbul V3 for dynamic synthesis of: "${cleanedText.substring(0, 40)}..."`);
      let base64Audio = "";
      try {
        const sarvamResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: [cleanedText],
            target_language_code: "ta-IN",
            speaker: "Priya",
            model: "bulbul:v3",
            speech_sample_rate: 22050,
            enable_preprocessing: true
          })
        });

        if (sarvamResponse.ok) {
          const sarvamData = await sarvamResponse.json();
          base64Audio = sarvamData.audios?.[0] || "";
        } else {
          const errMsg = await sarvamResponse.text();
          console.error(`Sarvam synthesis failed with status ${sarvamResponse.status}:`, errMsg);
        }
      } catch (err) {
        console.error("Sarvam synthesis API exception:", err);
      }

      if (!base64Audio) {
        return new Response(JSON.stringify({ error: "Voice synthesis failed" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      const filename = `${textHashShort}.mp3`;
      const r2Key = `synthesis/${filename}`;
      const cdnUrl = `${AUDIO_CDN_BASE_URL}/${r2Key}`;

      // Asynchronous background Cloudflare R2 upload and DB insertion
      EdgeRuntime.waitUntil((async () => {
        try {
          if (R2_ACCESS_KEY && R2_SECRET_KEY && R2_ENDPOINT) {
            const { S3Client, PutObjectCommand } = await import("https://esm.sh/@aws-sdk/client-s3@3.540.0");
            const s3Client = new S3Client({
              region: "auto",
              endpoint: R2_ENDPOINT,
              credentials: {
                accessKeyId: R2_ACCESS_KEY,
                secretAccessKey: R2_SECRET_KEY,
              },
            });

            const binaryVal = atob(base64Audio);
            const binaryLen = binaryVal.length;
            const buffer = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
              buffer[i] = binaryVal.charCodeAt(i);
            }

            await s3Client.send(new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: r2Key,
              Body: buffer,
              ContentType: "audio/mpeg",
              CacheControl: "public, max-age=31536000"
            }));
            console.log(`☁️ Dynamic synthesis audio successfully uploaded to Cloudflare R2: ${r2Key}`);
          }

          // Save cache entry in Supabase audio_files table
          const { error: dbErr } = await supabase
            .from('audio_files')
            .insert({
              lesson_id: 'synthesis',
              audio_type: 'synthesis',
              r2_key: r2Key,
              cdn_url: cdnUrl,
              char_count: cleanedText.length,
              sarvam_called: true
            });

          if (dbErr) console.error("Database save failed for dynamic synthesis:", dbErr.message);
          else console.log(`💾 Cache record registered in audio_files for synthesis of: "${cleanedText.substring(0, 40)}..."`);
        } catch (bgErr) {
          console.error("Background dynamic synthesis save failed:", bgErr);
        }
      })());

      return new Response(JSON.stringify({
        source: 'live_synthesis',
        audio_base64: base64Audio,
        cdn_url: cdnUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PILLAR 2 & 3: ASK REN (QA VOICE CACHE / SIMILARITY / LIVE GENERATION)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'ask_ren') {
      if (!question) {
        return new Response(JSON.stringify({ error: "Missing question" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const lessonId = context?.lesson_id || context?.currentLesson || 'general';
      const sectionId = context?.section_id || 'S1';

      // 1. Normalize the question text
      const questionNormal = question
        .toLowerCase()
        .trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .replace(/\s+/g, " ");

      // 2. Generate SHA-256 hash of the normalized question
      const utf8 = new TextEncoder().encode(questionNormal);
      const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const questionHashShort = hashHex.substring(0, 12);

      // 3. PILLAR 2 CACHE HIT CHECK (Exact Hash Match)
      const { data: cacheHit, error: cacheErr } = await supabase
        .from('qa_voice_cache')
        .select('*')
        .eq('question_hash', hashHex)
        .maybeSingle();

      if (cacheHit) {
        console.log(`🎯 CACHE HIT (EXACT MATCH) for question: "${question}"`);
        
        // Background task to increment served_count
        EdgeRuntime.waitUntil(
          supabase
            .from('qa_voice_cache')
            .update({ 
              served_count: (cacheHit.served_count || 0) + 1,
              last_served_at: new Date().toISOString()
            })
            .eq('id', cacheHit.id)
        );

        return new Response(JSON.stringify({
          source: 'cache_hit_exact',
          answer_text: cacheHit.answer_text,
          whiteboard_text: cacheHit.whiteboard_text || "- Concept Clarified",
          cdn_url: cacheHit.cdn_url,
          r2_key: cacheHit.r2_key
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. PILLAR 2 SEMANTIC SIMILARITY CHECK
      let similarityHit: any = null;
      let embedding: number[] | null = null;

      try {
        // Generate embedding using Gemini API (since Deno Supabase.ai may not be present in all runtimes)
        const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: questionNormal }] }
          })
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          const rawEmbedding = embedData.embedding?.values;
          
          if (rawEmbedding && rawEmbedding.length > 0) {
            embedding = rawEmbedding.slice(0, 384);
            while (embedding.length < 384) embedding.push(0);

            // Call pgvector match RPC function
            const { data: matches, error: matchErr } = await supabase.rpc('match_qa_voice', {
              query_embedding: embedding,
              match_threshold: 0.88,
              match_count: 1
            });

            if (!matchErr && matches && matches.length > 0) {
              similarityHit = matches[0];
            }
          }
        }
      } catch (embedError) {
        console.error("Semantic search failed, continuing to live generation:", embedError);
      }

      if (similarityHit) {
        console.log(`🧠 SEMANTIC HIT (Similarity: ${similarityHit.similarity.toFixed(4)}) for: "${question}"`);

        // Background task to increment served_count
        EdgeRuntime.waitUntil(
          supabase
            .from('qa_voice_cache')
            .update({ 
              served_count: (similarityHit.served_count || 0) + 1,
              last_served_at: new Date().toISOString()
            })
            .eq('id', similarityHit.id)
        );

        return new Response(JSON.stringify({
          source: 'cache_hit_semantic',
          answer_text: similarityHit.answer_text,
          whiteboard_text: similarityHit.whiteboard_text || "- Concept Clarified",
          cdn_url: similarityHit.cdn_url,
          similarity: similarityHit.similarity
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 5. PILLAR 3: LIVE GENERATION (CACHE MISS)
      console.log(`⚡ CACHE MISS for question: "${question}". Live generating...`);

      // A. Call Groq (llama-3.3-70b-versatile) for natural hybrid Tanglish
      const systemPrompt = `You are Ren, a senior AI mentor for the Rebon learning system. 
You are a warm, calm, helpful Indian AI teacher who teaches engineering in Tanglish (Tamil + English code-switching).
Your current lesson context is: "${context?.currentLessonText || 'General fullstack dev concepts'}".

Constraint 1: Spoken answer length MUST absolutely be 2 to 4 lines maximum (extremely short for TTS).
Constraint 2: Do NOT give direct answers. Give hints, guides, and explain concepts simply.
Constraint 3: Speak in conversational romanized Tanglish (e.g., "intha concept-ai paarungka, details update pannunga"). Mixing technical terms in English is required.
Constraint 4: Do NOT use Tamil script letters. Speak entirely in Romanized letters.
Constraint 5: Provide a 4-5 word summary for the digital whiteboard using bullets (-) and arrows (->).

Respond STRICTLY in JSON format:
{
  "spokenAnswer": "...",
  "whiteboardText": "..."
}`;

      let generatedJson: any = null;
      let spokenAnswer = "";
      let whiteboardText = "";
      let groqCalled = false;

      if (GROQ_API_KEY) {
        try {
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question }
              ],
              max_tokens: 250,
              response_format: { type: "json_object" },
              temperature: 0.3
            })
          });

          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            const content = groqData.choices?.[0]?.message?.content || "";
            generatedJson = JSON.parse(content);
            spokenAnswer = generatedJson.spokenAnswer || "";
            whiteboardText = generatedJson.whiteboardText || "";
            groqCalled = true;
          }
        } catch (groqErr) {
          console.error("Groq call failed, falling back to Gemini:", groqErr);
        }
      }

      // Fallback to Gemini if Groq is unavailable or failed
      if (!spokenAnswer && GEMINI_API_KEY) {
        try {
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: question }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            generatedJson = JSON.parse(content);
            spokenAnswer = generatedJson.spokenAnswer || "";
            whiteboardText = generatedJson.whiteboardText || "";
          }
        } catch (geminiErr) {
          console.error("Fallback Gemini call failed too:", geminiErr);
        }
      }

      // Final fallback
      if (!spokenAnswer) {
        spokenAnswer = "intha concept paththi clear-aa solreen. oru quick doubt, konjam re-phrase panni keelungka.";
        whiteboardText = "- Rephrase doubt\n- Try again";
      }

      // B. Call Sarvam Bulbul V3 API
      console.log(`🔊 Calling Sarvam Bulbul V3 for audio synthesis...`);
      let base64Audio = "";
      
      try {
        const sarvamResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: [spokenAnswer],
            target_language_code: "ta-IN",
            speaker: "Priya",
            model: "bulbul:v3",
            speech_sample_rate: 22050,
            enable_preprocessing: true
          })
        });

        if (sarvamResponse.ok) {
          const sarvamData = await sarvamResponse.json();
          base64Audio = sarvamData.audios?.[0] || "";
        } else {
          const errMsg = await sarvamResponse.text();
          console.error(`Sarvam API failed with status ${sarvamResponse.status}:`, errMsg);
        }
      } catch (sarvamErr) {
        console.error("Sarvam API request exception:", sarvamErr);
      }

      // Prepare keys and pathnames
      const filename = `qa_lesson_${lessonId}_groq_${questionHashShort}.mp3`;
      const r2Key = `qa/lesson_${lessonId}/${filename}`;
      const cdnUrl = `${AUDIO_CDN_BASE_URL}/${r2Key}`;

      // C. SIMULTANEOUS BACKGROUND SAVE: upload to R2 and insert DB cache entry
      if (base64Audio) {
        EdgeRuntime.waitUntil((async () => {
          try {
            // Upload to Cloudflare R2 (graceful fallback if S3 SDK is missing or credential omitted)
            if (R2_ACCESS_KEY && R2_SECRET_KEY && R2_ENDPOINT) {
              const { S3Client, PutObjectCommand } = await import("https://esm.sh/@aws-sdk/client-s3@3.540.0");
              const s3Client = new S3Client({
                region: "auto",
                endpoint: R2_ENDPOINT,
                credentials: {
                  accessKeyId: R2_ACCESS_KEY,
                  secretAccessKey: R2_SECRET_KEY,
                },
              });

              // Convert base64 to binary buffer
              const binaryVal = atob(base64Audio);
              const binaryLen = binaryVal.length;
              const buffer = new Uint8Array(binaryLen);
              for (let i = 0; i < binaryLen; i++) {
                buffer[i] = binaryVal.charCodeAt(i);
              }

              await s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: r2Key,
                Body: buffer,
                ContentType: "audio/mpeg",
                CacheControl: "public, max-age=31536000"
              }));
              console.log(`☁️ Audio successfully uploaded to Cloudflare R2: ${r2Key}`);
            } else {
              console.warn("⚠️ Cloudflare R2 credentials missing. Skipping cloud upload, saving record locally.");
            }

            // Insert into Database cache table
            const { error: dbErr } = await supabase
              .from('qa_voice_cache')
              .insert({
                question_hash: hashHex,
                question_original: question,
                question_normal: questionNormal,
                lesson_id: lessonId,
                section_id: sectionId,
                answer_text: spokenAnswer,
                whiteboard_text: whiteboardText,
                r2_key: r2Key,
                cdn_url: cdnUrl,
                source: groqCalled ? 'groq' : 'gemini',
                served_count: 1,
                groq_called: groqCalled,
                sarvam_called: true,
                question_embedding: embedding
              });

            if (dbErr) console.error("Database save failed:", dbErr.message);
            else console.log(`💾 Cache record saved successfully in PostgreSQL for: "${question}"`);

          } catch (bgErr) {
            console.error("Background save operation failed:", bgErr);
          }
        })());
      }

      // D. Respond immediately to current user (zero latency wait for cloud saves!)
      return new Response(JSON.stringify({
        source: 'live_generation',
        answer_text: spokenAnswer,
        whiteboard_text: whiteboardText,
        audio_base64: base64Audio,
        cdn_url: base64Audio ? cdnUrl : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error("Error in Rebon Voice Cache:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
