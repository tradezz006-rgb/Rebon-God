import { StudentLesson, ProfessionalScenario } from "@/types/database";
import masterDatas from "@/data/master_datas.json";
import { supabase } from "@/integrations/supabase/client";

/**
 * REBON V3: Intelligence Engine
 * Temporarily routed to Groq (llama3-70b) for high-speed, free inference during MVP,
 * acting as the real teacher equipped with our predefined curriculum topics.
 */

// ─── Language Helpers (defined at top so all functions can use them) ─────────────────
const getTeachLanguage = (): 'english' | 'tanglish' => {
  return 'tanglish'; // Forced globally: speak only in Tanglish hereafter
};

export const getEffectiveLanguage = (lesson: any): 'english' | 'tanglish' => {
  return 'tanglish'; // Forced globally: speak only in Tanglish hereafter
};

const TANGLISH_SYSTEM_NOTE = `
IMPORTANT LANGUAGE RULE: The student has selected Tanglish mode.
- All TECHNICAL TERMS (variable, function, API, server, client, database, component, state, props, HTTP, DNS, etc.) must stay in ENGLISH.
- All EXPLANATIONS, REAL-WORLD EXAMPLES, CONNECTING WORDS, and TRANSITIONS should use simple Tamil words naturally.
- Example style: "Server-u request receive pannidhu, adhu database-la data search pannu, result-a response la athigama send pannidhu"
- DO NOT translate technical terms. Mix naturally like a senior Tamil engineer teaching a junior.
- Avoid overly formal Tamil. Use conversational, colloquial Tamil words.
`;

async function translateTextsToTanglish(texts: string[]): Promise<string[]> {
  try {
    const systemPrompt = `You are a world-class Full-Stack engineer who teaches in Tanglish (Tamil + English hybrid).
    Translate the given array of English teaching narration texts into natural, conversational, colloquial Tanglish.
    
    ${TANGLISH_SYSTEM_NOTE}
    
    Your output MUST be a JSON object containing a "translations" string array, where each entry corresponds exactly to the input array index.
    Maintain the exact meaning, technical terms, and tone. Keep technical words in English.
    
    Format:
    {
      "translations": [
        "translated text 1...",
        "translated text 2..."
      ]
    }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify({ texts }) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) throw new Error("Translation failed");
    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.translations || texts;
  } catch (e) {
    console.error("Tanglish translation failed, falling back to English:", e);
    return texts;
  }
}

export async function translateSingleToTanglish(text: string): Promise<string> {
  if (!text) return "";
  // Check if already contains Tamil characters
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return text;
  }
  try {
    const res = await translateTextsToTanglish([text]);
    return res[0] || text;
  } catch (e) {
    console.error("Single translation to Tanglish failed:", e);
    return text;
  }
}

export async function generateLessonScriptWithLocalModel(
  activeLesson: StudentLesson,
  scenarios: ProfessionalScenario[]
): Promise<Array<{ text: string, subtitle: string, whiteboard?: string, boardActions?: any[], isQuestion?: boolean, questionText?: string, isInteractiveMoment?: boolean, moment?: any, isDoubtPrompt?: boolean }>> {
  try {
    const lesson = activeLesson as any; // cast to access all JSON fields
    let finalScript: any[] = [];
    
    const effectiveLanguage = getEffectiveLanguage(lesson);
    const isTanglish = effectiveLanguage === 'tanglish';

    // ─────────────────────────────────────────────────────────────────────────
    // PATH D: Modular lesson format (lesson.blocks) - REBON V3 Curriculum
    // ─────────────────────────────────────────────────────────────────────────
    if (lesson.blocks && lesson.blocks.length > 0) {
        // First push the AVA lesson intro
        if (lesson.ava_lesson_intro) {
            finalScript.push({
                text: lesson.ava_lesson_intro.ava_speaks,
                subtitle: '🎬 Lesson Intro',
                boardActions: lesson.ava_lesson_intro.board ? [lesson.ava_lesson_intro.board] : [
                    { type: 'write_title', lines: [lesson.lesson_title || 'Lesson', 'Introduction'] }
                ]
            });
        }

        lesson.blocks.forEach((block: any, bIdx: number) => {
            const blockType = block.block_type;
            const subtitle = `📦 ${block.block_title || block.block_type}`;
            
            switch (block.block_type) {
                case 'concept_intro':
                case 'why_companies': {
                    // Core teaching blocks
                    finalScript.push({
                        blockType,
                        text: block.ava_speaks,
                        subtitle: subtitle,
                        boardActions: block.board_actions || []
                    });

                    // Parse inline questions if present
                    if (block.inline_questions && block.inline_questions.length > 0) {
                        block.inline_questions.forEach((q: any) => {
                            if (q.type === 'inline_quiz') {
                                finalScript.push({
                                    blockType,
                                    text: isTanglish ? "namma understanding-ai check panna oru quick question!" : "Let's check our understanding with a quick question!",
                                    subtitle: "🤔 Inline Quiz",
                                    isInteractiveMoment: true,
                                    moment: {
                                        type: 'quiz_tab',
                                        content: {
                                            question: q.question,
                                            options: q.options,
                                            correct_index: q.correct_index,
                                            ava_correct: q.ava_correct,
                                            ava_wrong: q.ava_wrong
                                        }
                                    }
                                });
                            }
                        });
                    }
                    break;
                }

                case 'live_build': {
                    // Narrate opening
                    finalScript.push({
                        blockType,
                        text: block.ava_speaks,
                        subtitle: subtitle,
                        boardActions: [
                            { type: 'write_heading', text: block.block_title || "Live Terminal Session" }
                        ]
                    });

                    // Parse terminal editor session steps
                    if (block.editor_session && block.editor_session.steps) {
                        block.editor_session.steps.forEach((step: any, sIdx: number) => {
                            finalScript.push({
                                blockType,
                                text: step.ava_narration,
                                subtitle: `💻 Step ${sIdx + 1}`,
                                boardActions: [
                                    { type: 'write_heading', text: `Step ${sIdx + 1}: Running terminal command` },
                                    { type: 'write_code', code: step.code, language: block.editor_session.language || 'bash' }
                                ]
                            });
                        });
                        
                        // Push final result notice
                        if (block.editor_session.expected_output) {
                            const note = block.editor_session.expected_output.what_to_notice;
                            finalScript.push({
                                blockType,
                                text: isTanglish ? `Terminal output-ai oru nimisham paarungka. ${note}` : `Take a look at the terminal output. ${note}`,
                                subtitle: `🔮 Expected Output`,
                                boardActions: [
                                    { type: 'write_heading', text: "Expected Output Details" },
                                    { type: 'write_definition_box', text: `Mumbai latency:\n${block.editor_session.expected_output.mumbai || ''}\n\nUSA latency:\n${block.editor_session.expected_output.usa || ''}` }
                                ]
                            });
                        }
                    }
                    break;
                }

                case 'visual_output': {
                    const output = block.output_preview;
                    const items = [
                        `🔗 Link: ${output?.url || ''}`,
                        ...(output?.what_to_look_for || [])
                    ];
                    
                    finalScript.push({
                        blockType,
                        text: `${block.ava_speaks} ${output?.ava_narration || ''}`,
                        subtitle: subtitle,
                        boardActions: [
                            { type: 'write_heading', text: output?.label || "Visual Output" },
                            { type: 'write_points', items: items }
                        ]
                    });
                    break;
                }

                case 'student_try': {
                    finalScript.push({
                        blockType,
                        text: block.instruction || (isTanglish ? "ippoo ungka turn, ithai try panni paarungka!" : "Now it's your turn to try this out!"),
                        subtitle: subtitle,
                        isInteractiveMoment: true,
                        moment: {
                            type: 'code_challenge',
                            content: {
                                instruction: block.instruction || "Execute bash command",
                                starter_code: block.starter_code !== undefined && block.starter_code !== null ? block.starter_code : "",
                                expected: block.expected !== undefined && block.expected !== null ? block.expected : (block.starter_code !== undefined && block.starter_code !== null ? block.starter_code : ""),
                                ava_correct: block.ava_solution?.explanation || (isTanglish ? "romba super! neengka coding/terminal challenge-ai vetrikaramaa mutissutteengka." : "Terrific! You completed the local execution successfully."),
                                ava_hint: block.hints?.join('\n') || (isTanglish ? "Terminal-la command-ai run panni checklist requirements-ai complete pannungka." : "Perform terminal run actions.")
                            }
                        },
                        boardActions: [
                            { type: 'write_heading', text: block.block_title || "Hands-on Practice" },
                            { type: 'write_points', items: block.requirements || [] }
                        ]
                    });
                    break;
                }

                case 'mistake_simulation': {
                    // First token explaining the setup & incident
                    finalScript.push({
                        blockType,
                        text: isTanglish ? `${block.ava_speaks} intha mistake scenario-vai paarungka: ${block.setup} ${block.what_happened}` : `${block.ava_speaks} Let's look at this mistake scenario: ${block.setup} ${block.what_happened}`,
                        subtitle: subtitle,
                        boardActions: [
                            { type: 'write_heading', text: "❌ Junior Mistake Scenario" },
                            { type: 'write_definition_box', text: `Real Problem:\n${block.the_real_problem}` }
                        ]
                    });

                    // Second token explaining the correction
                    finalScript.push({
                        text: isTanglish ? `ithai naam eppati solve pannalaam? ${block.fix?.result || ''} intha important lesson-ai eppavum nyaabakam vassukkongka: ${block.lesson || ''}` : `Here is how we fix it. ${block.fix?.result || ''} Remember this lesson: ${block.lesson || ''}`,
                        subtitle: `🛠 The Solution`,
                        boardActions: [
                            { type: 'write_heading', text: "✅ The Proper Architecture Fix" },
                            { type: 'write_code', code: block.fix?.code || '', language: 'javascript' }
                        ]
                    });
                    break;
                }

                case 'mini_challenge': {
                    finalScript.push({
                        text: block.ava_speaks,
                        subtitle: subtitle,
                        boardActions: [
                            { type: 'write_heading', text: block.block_title || "Mini Scenario Challenge" }
                        ]
                    });

                    if (block.challenges && block.challenges.length > 0) {
                        block.challenges.forEach((chal: any, cIdx: number) => {
                            finalScript.push({
                                text: `Challenge ${cIdx + 1}: ${chal.question}`,
                                subtitle: `⚡ Mini Check ${cIdx + 1}`,
                                isInteractiveMoment: true,
                                moment: {
                                    type: 'scenario_card',
                                    content: {
                                        scenario: chal.question,
                                        answer: chal.answer,
                                        ava_feedback: isTanglish ? "romba super! Continue kutuththu atuththa step-kku poongka." : "Excellent! Click Continue to move on."
                                    }
                                }
                            });
                        });
                    }
                    break;
                }

                case 'real_workflow': {
                    const steps = (block.workflow_steps || []).map((ws: any) => `${ws.step}. ${ws.action}: ${ws.detail}`);
                    
                    finalScript.push({
                        text: isTanglish ? `${block.ava_speaks} ithoo, oru real enterprise workflow-la ithu eppati use aakuthunnu paarungka.` : `${block.ava_speaks} Let's look at how this is applied in an enterprise dev workflow.`,
                        subtitle: subtitle,
                        boardActions: [
                            { type: 'write_heading', text: "Production Industry Workflow" },
                            { type: 'write_points', items: steps }
                        ]
                    });

                    if (block.tools_shown && block.tools_shown.length > 0) {
                        const tools = block.tools_shown.map((t: any) => `${t.tool} → ${t.use}`);
                        finalScript.push({
                            text: isTanglish ? "ithukku production support-la developers use panra standard diagnostic tools ithoo." : `These are the standard diagnostic tools developers use for this setup.`,
                            subtitle: `🔧 Production Tools`,
                            boardActions: [
                                { type: 'write_heading', text: "Diagnostic Tools Suite" },
                                { type: 'write_points', items: tools }
                            ]
                        });
                    }
                    break;
                }

                default:
                    break;
            }
        });

        // Add summary & doubt prompt closing
        if (lesson.lesson_summary) {
            finalScript.push({
                text: isTanglish ? `${lesson.lesson_summary.ava_speaks} innaiku naam paarththa concepts-la ungkalukku ethaavatu doubt irukkaa? Undersea cables-la irunthu cloud data centers varaikkum, ethula doubt irunthaalum enkitta keelungka, naan clear panreen!` : `${lesson.lesson_summary.ava_speaks} If you have any doubts about anything we covered today — from the fiber optic cables to cloud regions — ask me now.`,
                subtitle: '✅ Session Complete',
                boardActions: lesson.lesson_summary.board ? [lesson.lesson_summary.board] : [
                    { type: 'write_summary', title: '✅ Lesson Summary', items: lesson.student_will_learn || [] }
                ],
                isQuestion: true,
                isDoubtPrompt: true,
                questionText: isTanglish ? "ungkalukku ethaavatu doubt irukkaa? illainaa explain pannumaa?" : 'Do you have any doubts or want me to explain anything again?'
            });
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PATH A: New ava_session format (explicit script)
    // ─────────────────────────────────────────────────────────────────────────
    else if (lesson.ava_session) {
        const session = lesson.ava_session;
        finalScript.push({ text: session.intro.ava_speaks, subtitle: 'Introduction', boardActions: session.intro.board ? [session.intro.board] : [] });
        session.segments.forEach((seg: any) => {
            finalScript.push({ text: seg.ava_speaks, subtitle: seg.title || 'Teaching', boardActions: seg.board_actions || [] });
            if (seg.interactive_moment) {
                if (seg.interactive_moment.type === 'voice_question') {
                    finalScript.push({ text: seg.interactive_moment.ava_asks, subtitle: 'Question', boardActions: [{ type: 'write_question', panel: seg.interactive_moment.board_panel }], isQuestion: true, questionText: seg.interactive_moment.board_panel?.question || seg.interactive_moment.ava_asks, moment: seg.interactive_moment });
                } else {
                    finalScript.push({ text: isTanglish ? 'vaangka, oru quick activity pannalaam!' : 'Let\'s do a quick activity!', subtitle: 'Activity', isInteractiveMoment: true, moment: seg.interactive_moment });
                }
            }
        });
        finalScript.push({ text: session.lesson_summary.ava_speaks + (isTanglish ? ' mutikkirathukku munnaadi ethaavatu doubt irukkaa?' : ' Do you have any doubts before we finish?'), subtitle: 'Summary & Doubts', boardActions: session.lesson_summary.board ? [session.lesson_summary.board] : [], isQuestion: true, isDoubtPrompt: true, questionText: isTanglish ? 'ethaavatu doubt irukkaa? illa ethaavatu re-teach pannumaa?' : 'Do you have any questions or want me to reteach anything?' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATH B: Rich JSON format (core_concepts + ava_flow + questions + mini_scenario)
    //   This is the MAIN PATH for all Phase 1 lessons
    // ─────────────────────────────────────────────────────────────────────────
    else if (lesson.core_concepts && lesson.core_concepts.length > 0) {

        // ── 1. HOOK ────────────────────────────────────────────────────────
        const hook = lesson.ava_flow?.hook || (isTanglish ? `vaangka, ${lesson.lesson_title} paththi explore pannalaam.` : `Let's explore ${lesson.lesson_title}.`);
        finalScript.push({
            text: hook,
            subtitle: '🎯 Hook',
            boardActions: [
                { type: 'write_title', lines: [lesson.lesson_title, lesson.lesson_purpose ? lesson.lesson_purpose.substring(0, 80) + '...' : ''] }
            ]
        });

        // ── 2. TEACH EACH CORE CONCEPT ─────────────────────────────────────
        lesson.core_concepts.forEach((concept: any, idx: number) => {
            const conceptNum = idx + 1;

            // A) Full explanation
            finalScript.push({
                text: isTanglish ? `Concept ${conceptNum} paappoom: ${concept.concept_name}. ${concept.full_explanation}` : `Let's look at concept ${conceptNum}: ${concept.concept_name}. ${concept.full_explanation}`,
                subtitle: `📚 ${concept.concept_name}`,
                boardActions: [
                    { type: 'write_heading', text: `${conceptNum}. ${concept.concept_name}` },
                    { type: 'write_points', items: concept.full_explanation.split('. ').slice(0, 3).map((s: string) => s.trim()).filter(Boolean) }
                ]
            });

            // B) Analogy
            if (concept.analogy) {
                finalScript.push({
                    text: isTanglish ? `ithai visualize pannungka. ${concept.analogy}` : `Here's an analogy that makes this click. ${concept.analogy}`,
                    subtitle: '💡 Analogy',
                    boardActions: [
                        { type: 'write_heading', text: '💡 Think of it this way...' },
                        { type: 'write_definition_box', text: concept.analogy.split('.').slice(0, 2).join('.') + '.' }
                    ]
                });
            }

            // C) Bust the myth
            if (concept.common_wrong_belief && concept.correction) {
                finalScript.push({
                    text: isTanglish ? `perumpaalaana people yoosikkurathu: "${concept.common_wrong_belief}" aanaa athu misconception. ${concept.correction}` : `Now — most people think: "${concept.common_wrong_belief}" But that's a misconception. ${concept.correction}`,
                    subtitle: '🚫 Common Myth',
                    boardActions: [
                        { type: 'write_heading', text: '🚫 Myth vs Reality' },
                        { type: 'write_points', items: [`❌ MYTH: ${concept.common_wrong_belief}`, `✅ TRUTH: ${concept.correction}`] }
                    ]
                });
            }

            // D) Why companies care
            if (concept.why_companies_care) {
                finalScript.push({
                    text: isTanglish ? `Real engineering job-la ithu een matter-nnu solreen. ${concept.why_companies_care}` : `And here's why this matters in a real engineering job. ${concept.why_companies_care}`,
                    subtitle: '🏢 In Real Companies',
                    boardActions: [
                        { type: 'write_definition_box', text: `🏢 Real Impact: ${concept.why_companies_care.substring(0, 150)}` }
                    ]
                });
            }

            // E) Inject interactive moment from ava_flow at appropriate point
            const interactiveMoments: any[] = lesson.ava_flow?.interactive_moments || [];
            const momentForThisConcept = interactiveMoments[idx];
            if (momentForThisConcept) {
                finalScript.push({
                    text: isTanglish ? `atuththa topic-kku porathukku munnaadi — ${momentForThisConcept.trigger || 'oru quick activity pannalaam!'}` : `Before we move on — ${momentForThisConcept.trigger || 'let\'s do a quick activity!'}`,
                    subtitle: '🎮 Activity',
                    isInteractiveMoment: true,
                    moment: momentForThisConcept
                });
            }
        });

        // ── 3. COMMON MISUNDERSTANDINGS (myths/redirects) ──────────────────
        const misunderstandings: any[] = lesson.common_misunderstandings || [];
        if (misunderstandings.length > 0) {
            const misText = misunderstandings.map((m: any) => `"${m.misunderstanding}" — ${m.ava_redirect}`).slice(0, 2).join(' ... Also: ');
            finalScript.push({
                text: isTanglish ? `Questions-kku porathukku munnaadi, people commonly wrong-aa purinjukkura two things clear panreen. ${misText}` : `Before we do questions, let me address two things people commonly get wrong. ${misText}`,
                subtitle: '🔍 Clearing Confusion',
                boardActions: [
                    { type: 'write_heading', text: '🔍 Common Misunderstandings' },
                    { type: 'write_points', items: misunderstandings.slice(0, 2).map((m: any) => `"${m.misunderstanding.substring(0, 70)}"`) }
                ]
            });
        }

        // ── 4. UNDERSTANDING CHECK QUESTIONS ──────────────────────────────
        const understandingChecks: string[] = lesson.ava_flow?.understanding_checks || [];
        understandingChecks.slice(0, 2).forEach((check: string, i: number) => {
            finalScript.push({
                text: isTanglish ? `Quick check ${i + 1}: ${check}` : `Quick check ${i + 1}: ${check}`,
                subtitle: '🤔 Understanding Check',
                boardActions: [
                    { type: 'write_question', panel: { question: check } }
                ],
                isQuestion: true,
                questionText: check
            });
        });

        // ── 5. LESSON QUESTIONS (from the questions array) ────────────────
        const lessonQuestions: any[] = lesson.questions || [];
        lessonQuestions.slice(0, 2).forEach((q: any, i: number) => {
            const prefix = q.type === 'workplace' ? '🏢 Workplace scenario:' : q.type === 'debugging' ? '🐛 Debugging challenge:' : q.type === 'prediction' ? '🔮 Prediction question:' : '💬 Reasoning question:';
            finalScript.push({
                text: `${prefix} ${q.question}`,
                subtitle: `📝 Question ${i + 1}`,
                boardActions: [
                    { type: 'write_question', panel: { question: q.question, options: q.expected_answer_themes ? q.expected_answer_themes.map((t: string) => `Think about: ${t}`) : [] } }
                ],
                isQuestion: true,
                questionText: q.question
            });
        });

        // ── 6. MINI SCENARIO (workplace challenge) ─────────────────────────
        if (lesson.mini_scenario) {
            const s = lesson.mini_scenario;
            finalScript.push({
                text: isTanglish ? `vaangka, naam kaththukkittaathai oru real workplace challenge-la apply pannalaam. ithoota name "${s.title}". ${s.situation}` : `Now let's apply everything with a real workplace challenge. This is called "${s.title}". ${s.situation}`,
                subtitle: '🏢 Workplace Challenge',
                boardActions: [
                    { type: 'write_heading', text: `🏢 ${s.title}` },
                    { type: 'write_definition_box', text: s.situation.substring(0, 200) + '...' }
                ],
                isQuestion: true,
                questionText: s.situation
            });
        }

        // ── 7. REMAINING INTERACTIVE MOMENTS ─────────────────────────────
        const allMoments: any[] = lesson.ava_flow?.interactive_moments || [];
        const conceptCount = lesson.core_concepts.length;
        // Any moments beyond what were used per-concept
        allMoments.slice(conceptCount).forEach((m: any) => {
            finalScript.push({
                text: isTanglish ? `innoru activity pannalaam! ${m.trigger || ''}` : `Let's do one more activity! ${m.trigger || ''}`,
                subtitle: '🎮 Activity',
                isInteractiveMoment: true,
                moment: m
            });
        });

        // ── 8. CLOSING ─────────────────────────────────────────────────────
        const closing = lesson.ava_flow?.closing || (isTanglish ? `${lesson.lesson_title} complete aassu!` : `That wraps up ${lesson.lesson_title}!`);
        finalScript.push({
            text: isTanglish ? `${closing} naam cover pannathuala — concepts, scenario, ethulayum — doubt irunthaa ippoo keelungka.` : `${closing} If you have any doubts about anything we covered — the concepts, the scenario, anything — just tell me now.`,
            subtitle: '✅ Session Complete',
            boardActions: [
                { type: 'write_summary', title: '✅ Key Takeaways', items: lesson.core_concepts.map((c: any) => c.concept_name) }
            ],
            isQuestion: true,
            isDoubtPrompt: true,
            questionText: isTanglish ? 'ethaavatu doubt irukkaa? illa ethaavatu re-teach pannumaa?' : 'Do you have any doubts or want me to reteach anything?'
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATH C: Legacy format fallback
    // ─────────────────────────────────────────────────────────────────────────
    else {
        const ce = activeLesson.concept_explanation || ({} as any);
        const question = activeLesson.interaction_questions?.[0] || (isTanglish ? 'ithu varaikkum puriyuthaa?' : 'Does that make sense so far?');
        finalScript = isTanglish ? [
            { text: `vanakkam! innaiku: ${activeLesson.title}. ${ce.what_is_this}`, subtitle: 'Introduction', boardActions: [{ type: 'write_title', lines: [activeLesson.title || ''] }] },
            { text: `Analogy: ${activeLesson.real_world_example || 'ippati yoosissu paarungka...'}`, subtitle: 'Analogy', boardActions: [{ type: 'write_definition_box', text: activeLesson.real_world_example || '' }] },
            { text: `ithai eppati use panroom: ${ce.how_we_use_it}`, subtitle: 'Usage', boardActions: [{ type: 'write_points', items: [ce.how_we_use_it || ''] }] },
            { text: `Continue panrathukku munnaadi — ${question}`, subtitle: 'Quick Check', boardActions: [{ type: 'write_question', panel: { question } }], isQuestion: true, questionText: question },
            { text: `Real impact: ${ce.impact}`, subtitle: 'Impact', boardActions: [{ type: 'write_definition_box', text: ce.impact || '' }] },
            { text: `mutikkirathukku munnaadi ethaavatu doubt irukkaa?`, subtitle: 'Wrap Up', isQuestion: true, isDoubtPrompt: true, questionText: 'ethaavatu doubt irukkaa?' }
        ] : [
            { text: `Welcome! Today: ${activeLesson.title}. ${ce.what_is_this || ''}`, subtitle: 'Introduction', boardActions: [{ type: 'write_title', lines: [activeLesson.title || ''] }] },
            { text: `Analogy: ${activeLesson.real_world_example || 'Think of it this way...'}`, subtitle: 'Analogy', boardActions: [{ type: 'write_definition_box', text: activeLesson.real_world_example || '' }] },
            { text: `How we use it: ${ce.how_we_use_it || ''}`, subtitle: 'Usage', boardActions: [{ type: 'write_points', items: [ce.how_we_use_it || ''] }] },
            { text: `Before we continue — ${question}`, subtitle: 'Quick Check', boardActions: [{ type: 'write_question', panel: { question } }], isQuestion: true, questionText: question },
            { text: `Real impact: ${ce.impact || ''}`, subtitle: 'Impact', boardActions: [{ type: 'write_definition_box', text: ce.impact || '' }] },
            { text: `Before we wrap up, do you have any doubts?`, subtitle: 'Wrap Up', isQuestion: true, isDoubtPrompt: true, questionText: 'Do you have any doubts?' }
        ];
    }

    // Pillar 1: Fetch and map all pre-generated audio files from local cache manifest
    try {
        const lessonId = lesson.id || lesson.lesson_id;
        
        // Fetch manifest from public folder
        const manifestRes = await fetch('/audio/session1/voice_manifest.json');
        if (manifestRes.ok) {
            const fullManifest = await manifestRes.json();
            const lessonManifest = fullManifest[lessonId];
            
            if (lessonManifest) {
                console.log(`🔊 Found local voice manifest for lesson ${lessonId}.`);
                
                let blockIndex = 0;
                
                finalScript = finalScript.map((token: any) => {
                    let audioUrl = null;
                    
                    if (token.subtitle === '🎬 Lesson Intro' || token.audio_type === 'intro') {
                        audioUrl = lessonManifest.intro;
                    } else if (token.subtitle === '✅ Session Complete' || token.audio_type === 'summary') {
                        audioUrl = lessonManifest.summary;
                    } else {
                        // Detect block changes and steps
                        if (token.subtitle.startsWith('📦 ')) {
                            blockIndex++;
                            audioUrl = lessonManifest.blocks[blockIndex]?.main;
                        } else if (token.subtitle.startsWith('💻 Step ')) {
                            const stepNum = parseInt(token.subtitle.replace('💻 Step ', ''));
                            if (!isNaN(stepNum)) {
                                audioUrl = lessonManifest.blocks[blockIndex]?.[`step_${stepNum}`];
                            }
                        } else if (token.subtitle.startsWith('⚡ Mini Check ')) {
                            const chalNum = parseInt(token.subtitle.replace('⚡ Mini Check ', ''));
                            if (!isNaN(chalNum)) {
                                audioUrl = lessonManifest.blocks[blockIndex]?.[`challenge_${chalNum}_answer`];
                            }
                        } else if (token.subtitle === '🔮 Expected Output') {
                            // usually no distinct narration, but if there's main, it could be used
                            // we'll leave it or map to something if needed
                        } else {
                            // General fallback
                            audioUrl = lessonManifest.blocks[blockIndex]?.main;
                        }
                    }
                    
                    // Embed pre-generated quiz URLs inside the moment content if it exists
                    if (token.isInteractiveMoment && token.moment && token.moment.content) {
                        const bManifest = lessonManifest.blocks[blockIndex];
                        if (bManifest) {
                            const qNum = 1; // Default first quiz question
                            token.moment.content.ava_correct_url = bManifest[`iq_${qNum}_correct`] || bManifest.correct || null;
                            token.moment.content.ava_wrong_url = bManifest[`iq_${qNum}_wrong`] || null;
                            token.moment.content.ava_hint_url = bManifest.hint || null;
                        }
                    }

                    if (audioUrl) {
                        return { ...token, audioUrl };
                    }
                    return token;
                });
            }
        }
    } catch (e) {
        console.error("Failed to fetch local audio manifest, falling back to live synthesis:", e);
    }

    return finalScript;
  } catch (error) {
    console.error('Script mapping error:', error);
    return [];
  }
}

export async function processDoubtWithLocalModel(
  studentQuestion: string, 
  activeLesson: StudentLesson | null,
  recentTranscript: string
): Promise<{ spokenAnswer: string, whiteboardText: string, answerText?: string, isFromAPI?: boolean }> {
  try {
    const isTanglish = activeLesson ? (getEffectiveLanguage(activeLesson) === 'tanglish') : (getTeachLanguage() === 'tanglish');

    // 1. KNOWLEDGE RETRIEVAL (Zero-Cost Local Lookup)
    if (activeLesson) {
       // First check: See if the student is directly asking about a core concept
       const directConceptMatch = activeLesson.core_concepts?.find(c => 
          studentQuestion.toLowerCase().includes(c.concept_name.toLowerCase()) || 
          (c.common_wrong_belief && studentQuestion.toLowerCase().includes(c.common_wrong_belief.toLowerCase()))
       );

       if (directConceptMatch) {
          console.log("⚡ LAYER 1: Retrieved from local lesson json data.");
          const spoken = isTanglish 
             ? `neengka ${directConceptMatch.concept_name} paththi keekkureengka. ${directConceptMatch.full_explanation} ${directConceptMatch.analogy ? 'ithai visualize panna: ' + directConceptMatch.analogy : ''}`
             : `You're asking about ${directConceptMatch.concept_name}. ${directConceptMatch.full_explanation} ${directConceptMatch.analogy ? 'To visualize this: ' + directConceptMatch.analogy : ''}`;
          return {
             spokenAnswer: spoken,
             answerText: spoken,
             whiteboardText: `- Direct Concept Match\n- ${directConceptMatch.concept_name}`
          };
       }

       // Second check: Master Datas (Verified Overrides)
       const verifiedMatch = masterDatas.find(q => 
          q.lesson_id === activeLesson.lesson_id && 
          studentQuestion.toLowerCase().includes(q.expected_intent.toLowerCase())
       );
       
       if (verifiedMatch) {
          console.log("⚡ LAYER 1.5: Retrieved verified knowledge from master_datas.");
          return {
             spokenAnswer: verifiedMatch.verified_response,
             answerText: verifiedMatch.verified_response,
             whiteboardText: verifiedMatch.whiteboard_summary
          };
       }
    }

    // 2. CALL VOICE CACHE EDGE FUNCTION (Pillars 2 & 3)
    let result = { spokenAnswer: "", whiteboardText: "", answerText: "" };
    let isFromAPI = false;

    try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('rebon-voice-cache', {
            body: {
                action: 'ask_ren',
                question: studentQuestion,
                context: {
                    lesson_id: activeLesson?.lesson_id || activeLesson?.id || 'general',
                    currentLessonText: activeLesson?.lesson_title || activeLesson?.title || ''
                }
            }
        });

        if (edgeErr) throw edgeErr;

        if (edgeData) {
            // Edge Function returns answer_text and cached cdnUrl (if R2/CDN is enabled) or base64
            result.answerText = edgeData.answer_text || "";
            // Use base64 data URL if returned (for zero latency), fallback to CDN URL or text
            result.spokenAnswer = edgeData.audio_base64 
                ? `data:audio/mp3;base64,${edgeData.audio_base64}` 
                : (edgeData.cdn_url || edgeData.answer_text || "");
            result.whiteboardText = edgeData.whiteboard_text || "- Concept Clarified";
            isFromAPI = edgeData.source === 'live_generation';
        }
    } catch (e) {
        console.error("Voice cache Edge Function failed, falling back to local fallback response:", e);
        const fallback = "intha concept paththi clear-aa solreen. oru quick doubt, konjam re-phrase panni keelungka.";
        result.spokenAnswer = fallback;
        result.answerText = fallback;
        result.whiteboardText = "- Rephrase doubt\n- Try again";
    }

    // 3. STORE UNVERIFIED KNOWLEDGE LOCALLY FOR DEVELOPER REVIEW
    const unverifiedRecord = {
        status: "unverified",
        context: "doubt class",
        lesson_id: activeLesson?.lesson_id || activeLesson?.id,
        question: studentQuestion,
        ai_generated_response: result.answerText || result.spokenAnswer,
        whiteboard_summary: result.whiteboardText,
        timestamp: new Date().toISOString()
    };
    
    try {
        await fetch('/api/save-unverified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unverifiedRecord)
        });
        console.log("📝 LAYER 3: Stored Unverified Answer directly to src/data/unverified_datas.json file!");
    } catch (e) {
        console.error("Could not save to local file system. Make sure dev server is running.", e);
    }

    return { ...result, isFromAPI };

  } catch (error) {
    console.error("Doubt processing exception, falling back to Gemini:", error);
    const { answerStudentDoubt } = await import("./geminiService");
    const fallbackGemini = await answerStudentDoubt(studentQuestion, activeLesson?.title || "Concept");
    return {
        spokenAnswer: fallbackGemini.spokenAnswer,
        answerText: fallbackGemini.spokenAnswer,
        whiteboardText: fallbackGemini.whiteboardText,
        isFromAPI: false
    };
  }
}



export async function evaluateAnswerWithLocalModel(
  studentAnswer: string,
  questionAsked: string,
  activeLesson: StudentLesson | null,
  scenarios: ProfessionalScenario[] = []
): Promise<{ spokenFeedback: string, whiteboardFeedback: string, isCorrect: boolean, correction?: string }> {
    const answerLower = studentAnswer.toLowerCase();
    const isTanglish = activeLesson ? (getEffectiveLanguage(activeLesson) === 'tanglish') : (getTeachLanguage() === 'tanglish');

    // ─── LAYER 1: Match against expected_answer_themes from the JSON ──────────
    if (activeLesson) {
        // Find the question in the lesson's questions array that matches what was asked
        const lessonQuestions = (activeLesson as any).questions || [];
        const matchingQuestion = lessonQuestions.find((q: any) =>
            questionAsked.toLowerCase().includes(q.question?.toLowerCase().substring(0, 40) || '') ||
            q.question?.toLowerCase().includes(questionAsked.toLowerCase().substring(0, 40))
        ) || lessonQuestions[0]; // fallback to first question

        if (matchingQuestion) {
            const themes: string[] = matchingQuestion.expected_answer_themes || [];
            const matchedThemes = themes.filter(theme => answerLower.includes(theme.toLowerCase()));

            // If student hits at least half the expected themes → CORRECT
            if (themes.length > 0 && matchedThemes.length >= Math.ceil(themes.length / 2)) {
                console.log('⚡ LAYER 1: Correct via expected_answer_themes match:', matchedThemes);
                return {
                    spokenFeedback: isTanglish
                        ? `romba nallaa yoosisseengka! Key idea-vai karektaa putissitteengka — ${matchedThemes.join(', ')}. athu thaan exact-aana answer.`
                        : `Good thinking! You got the key idea — ${matchedThemes.join(', ')}. That's exactly right.`,
                    whiteboardFeedback: `✓ ${matchedThemes[0]}`,
                    isCorrect: true
                };
            }

            // Check wrong_answer_responses from the JSON for specific wrong answers
            const wrongResponses = matchingQuestion.wrong_answer_responses || {};
            for (const [key, val] of Object.entries(wrongResponses as Record<string, any>)) {
                const trigger = val.trigger?.toLowerCase() || '';
                // Check if student's answer matches the wrong pattern trigger
                const triggerWords = trigger.replace('student says ', '').split(' ').filter((w: string) => w.length > 3);
                const triggerMatch = triggerWords.length > 0 && triggerWords.some((w: string) => answerLower.includes(w));
                if (triggerMatch && val.ava_response) {
                    console.log('⚡ LAYER 1.5: Wrong answer matched JSON wrong_answer_responses:', key);
                    return {
                        spokenFeedback: val.ava_response,
                        whiteboardFeedback: `✗ ${key.replace(/_/g, ' ')}`,
                        isCorrect: false,
                        correction: themes.join(', ')
                    };
                }
            }
        }

        // Check understanding_checks from ava_flow
        const understandingChecks = activeLesson.ava_flow?.understanding_checks || [];
        const coreConceptAnswers = activeLesson.core_concepts?.map(c => c.concept_name.toLowerCase()) || [];
        const matchedConcept = coreConceptAnswers.find(cn => answerLower.includes(cn));
        if (matchedConcept) {
            console.log('⚡ LAYER 1: Matched core concept keyword:', matchedConcept);
            return {
                spokenFeedback: isTanglish
                    ? `aamaam! athu thaan key concept — ${matchedConcept}. ungkalukku romba nallaa purinjirukku!`
                    : `Yes! That's the key concept — ${matchedConcept}. You've understood it well.`,
                whiteboardFeedback: `✓ ${matchedConcept}`,
                isCorrect: true
            };
        }
    }

    // ─── LAYER 2: Master Datas ────────────────────────────────────────────────
    if (activeLesson) {
       const verifiedMatch = masterDatas.find(q =>
          q.lesson_id === (activeLesson as any).lesson_id &&
          answerLower.includes(q.expected_intent?.toLowerCase() || "")
       );
       if (verifiedMatch) {
          console.log('⚡ LAYER 2: Retrieved verified evaluation from master_datas.');
          return {
             spokenFeedback: verifiedMatch.verified_response,
             whiteboardFeedback: verifiedMatch.whiteboard_summary,
             isCorrect: true
          };
       }
    }

    // ─── LAYER 3: Groq API ────────────────────────────────────────────────────
  try {
    const lessonQuestions = (activeLesson as any)?.questions || [];
    const matchingQ = lessonQuestions.find((q: any) =>
        questionAsked.toLowerCase().includes(q.question?.substring(0, 40).toLowerCase() || '')
    ) || lessonQuestions[0];

    const expectedThemes = matchingQ?.expected_answer_themes?.join(', ') || 'based on lesson core concepts';
    const wrongPatternsText = matchingQ
        ? Object.values(matchingQ.wrong_answer_responses || {}).map((v: any) => `- ${v.trigger}: ${v.ava_response}`).join('\n')
        : '';

    const lessonContext = activeLesson ? `
      LESSON: ${(activeLesson as any).lesson_title || (activeLesson as any).title}
      QUESTION: ${questionAsked}
      CORRECT ANSWER THEMES: ${expectedThemes}
      STUDENT ANSWER: ${studentAnswer}
      KNOWN WRONG PATTERNS:
      ${wrongPatternsText}
      CORE CONCEPTS: ${activeLesson.core_concepts?.map(c => c.concept_name + ': ' + c.full_explanation.substring(0, 100)).join(' | ')}
    ` : 'No lesson context.';

    const isTanglish = activeLesson ? (getEffectiveLanguage(activeLesson) === 'tanglish') : (getTeachLanguage() === 'tanglish');
    const systemPrompt = `You are Ren, a calm, expert engineering mentor.
    ${isTanglish ? TANGLISH_SYSTEM_NOTE : ''}
    
    Evaluate the student's answer. Use ONLY the provided lesson context.
    
    ${lessonContext}
    
    RULES:
    - If the student's answer covers the expected themes → isCorrect: true, praise warmly.
    - If the student's answer is wrong → isCorrect: false, give a gentle correction using the correct themes. Include a short 'correction' field with the right answer summary.
    - If partially correct → isCorrect: false, acknowledge what's right, redirect to what's missing.
    - 2-3 sentences max for spokenFeedback. Sound human, never robotic.
    
    Respond STRICTLY in JSON:
    { "spokenFeedback": "...", "whiteboardFeedback": "...", "isCorrect": true/false, "correction": "..." }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student's answer: "${studentAnswer}". Evaluate this in JSON format.` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error("API Error");

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // STORE UNVERIFIED KNOWLEDGE FOR QUESTION ANSWERS
    const unverifiedRecord = {
        status: "unverified_eval",
        context: "inbetween class",
        lesson_id: activeLesson?.lesson_id || activeLesson?.id,
        question_asked_by_ava: questionAsked,
        student_answer: studentAnswer,
        ai_evaluation: result.spokenFeedback,
        is_correct: result.isCorrect,
        timestamp: new Date().toISOString()
    };
    
    // Save natively to the file system using our custom local Vite plugin
    try {
        await fetch('/api/save-unverified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unverifiedRecord)
        });
        console.log("📝 LAYER 3: Stored Unverified Evaluation directly to src/data/unverified_datas.json file!");
    } catch (e) {
        console.error("Could not save to local file system. Make sure dev server is running.", e);
    }

    return result;

  } catch (error) {
    console.error("Groq Eval Error:", error);
    // Fallback logic
    return {
      spokenFeedback: isTanglish
         ? "ungka answer-ai naan kettutten. vaangka, intha concept-ai thotarnthu explore pannalaam."
         : "I heard your answer. Let's keep exploring this concept together.",
      whiteboardFeedback: "Moving Forward",
      isCorrect: true
    };
  }
}

export async function generateSmartHintWithLocalModel(
  questionText: string,
  activeLesson: StudentLesson | null
): Promise<string> {
  try {
    const isTanglish = activeLesson ? (getEffectiveLanguage(activeLesson) === 'tanglish') : (getTeachLanguage() === 'tanglish');
    const lesson = activeLesson as any;
    const expectedThemes = lesson?.questions?.find((q: any) => q.question?.toLowerCase().includes(questionText.toLowerCase().substring(0, 30)))?.expected_answer_themes?.join(', ') || 'the lesson concepts';

    const systemPrompt = `You are Ren, a world-class, encouraging engineering mentor.
    ${isTanglish ? TANGLISH_SYSTEM_NOTE : ''}
    
    A student is struggling to answer a question. You need to give them a subtle, helpful, encouraging hint.
    DO NOT give away the direct answer. Instead, guide their thinking towards the correct themes: "${expectedThemes}".
    
    Keep the hint warm, friendly, and maximum 1-2 sentences.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: "${questionText}". Provide a helpful hint in JSON format with a single key "hint".` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      })
    });

    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.hint || "Think about the key concept we discussed.";
  } catch (error) {
    console.error("Smart Hint Error:", error);
    return isTanglish
      ? "naam ippoo peesina main core concept-ai paththi konjam yoosissu paarungka."
      : "Think about the main core concept we just covered.";
  }
}

export async function reExplainTopicAndQuestionWithLocalModel(
  questionText: string,
  activeLesson: StudentLesson | null
): Promise<string> {
  try {
    const isTanglish = activeLesson ? (getEffectiveLanguage(activeLesson) === 'tanglish') : (getTeachLanguage() === 'tanglish');
    const lesson = activeLesson as any;
    const conceptText = lesson?.core_concepts?.map((c: any) => `${c.concept_name}: ${c.full_explanation}`).join(' | ') || 'the core concepts';

    const systemPrompt = `You are Ren, a world-class, extremely clear engineering mentor.
    ${isTanglish ? TANGLISH_SYSTEM_NOTE : ''}
    
    A student didn't understand the question or wants a re-explanation.
    You need to:
    1. Re-explain the core topic/concepts very clearly and simply (using the concepts: "${conceptText}").
    2. Re-phrase and define the question "${questionText}" in very simple, friendly, and understandable terms.
    
    Keep your re-explanation clear, encouraging, and maximum 2-3 sentences.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: "${questionText}". Re-explain the topic and the question in JSON format with a single key "explanation".` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      })
    });

    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.explanation || `Let's look at this concept again. Think about how we use this in real engineering. The question asks: ${questionText}`;
  } catch (error) {
    console.error("Re-explain Error:", error);
    return isTanglish
      ? `vaangka, ithai simple-aa purinjukkaalaam. ithoota core concept ennannaa, naam eppati robust systems build panrathungkirathu thaan. intha question-ai innoru vithamaa keekkureen: ${questionText}`
      : `Let's break this down. The core concept is about how we build robust systems. Let me ask the question in another way: ${questionText}`;
  }
}

