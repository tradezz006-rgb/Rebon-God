import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, HandMetal, Loader2, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StudentLesson, ProfessionalScenario } from "@/types/database";
import { useAvaVoice } from "@/hooks/useAvaVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { answerStudentDoubt } from "@/services/geminiService";
import { 
  processDoubtWithLocalModel, 
  evaluateAnswerWithLocalModel, 
  generateLessonScriptWithLocalModel,
  generateSmartHintWithLocalModel,
  reExplainTopicAndQuestionWithLocalModel
} from "@/services/localInferenceService";
import { useSettings } from "@/contexts/SettingsContext";
import { VoiceWhiteboard } from '@/components/ava/VoiceWhiteboard';
import AvaCore from "@/components/ava/AvaCore";
import type { AvaCoreState } from "@/components/ava/AvaCore";
import { sessions, getCloudLessonById } from '@/data/sessions';
import { fullstackLearningContent } from '@/data/fullstackLearning';
import { scenarios as workspaceScenarios } from '@/data/workspaceScenarios';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveMomentRenderer } from '@/components/learning/InteractiveMomentRenderer';
import { InteractiveMoment } from '@/types/database';

type LessonPhase = 
  | 'loading' 
  | 'intro' 
  | 'teaching' 
  | 'waiting_for_user_answer' 
  | 'waiting_for_doubt'
  | 'user_answering' 
  | 'evaluating' 
  | 'interrupted'        // mid-lesson interrupt
  | 'doubt_listening'   // end-of-lesson doubt loop
  | 'waiting_hint'      // student didn't answer in time → offer hint
  | 'hint_listening'    // listening for yes/no to hint offer
  | 'gemini_thinking' 
  | 'paused' 
  | 'waiting_for_mid_doubt'
  | 'interactive_moment'
  | 'session_end' 
  | 'error';

const InteractiveLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teachLanguage } = useSettings();
  const isTanglish = true; // Forced globally: speak only in Tanglish hereafter
  
  const [phase, setPhase] = useState<LessonPhase>('loading');
  const [lesson, setLesson] = useState<StudentLesson | null>(null);
  const [scenarios, setScenarios] = useState<ProfessionalScenario[]>([]);
  const [subtitles, setSubtitles] = useState("");
  const [whiteboardItems, setWhiteboardItems] = useState<any[]>([]);
  const [avaState, setAvaState] = useState<AvaCoreState>('passive');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<InteractiveMoment | null>(null);
  const [lastQuestionToken, setLastQuestionToken] = useState<any>(null);
  const [unverifiedToast, setUnverifiedToast] = useState<string | null>(null);
  const [currentBlockType, setCurrentBlockType] = useState<string>("concept_intro");

  const { speak, stop, isSpeaking, activeVoice } = useAvaVoice();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  
  const hasSpokenRef = useRef(false);
  const scriptIndexRef = useRef(0);
  const scriptTokensRef = useRef<{text: string, subtitle: string, whiteboard?: string, boardActions?: any[], isInteractiveMoment?: boolean, moment?: any, isQuestion?: boolean, isDoubtPrompt?: boolean, questionText?: string}[]>([]);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!id) return;
      try {
        let foundLesson: any = null;

        // Cloud lessons: Fresher C1.* / C1B.* + Building Basics C2.*–C7.*
        if (id.startsWith("C")) {
          foundLesson = getCloudLessonById(id);
        }

        if (!foundLesson) {
        for (const session of sessions) {
            if (!session.lessons) continue;
            const lesson = session.lessons.find((l: any) => l.lesson_id === id || l.id === id);
            if (lesson) {
                foundLesson = lesson;
                break;
            }
        }
        }
        
        // Fallback to Fullstack lessons
        if (!foundLesson) {
            const fsLesson = fullstackLearningContent.find((l: any) => l.id === id);
            if (fsLesson) {
                foundLesson = {
                    id: fsLesson.id,
                    title: fsLesson.title,
                    concept_explanation: {
                        what_is_this: fsLesson.description,
                        how_we_use_it: "Let's focus on the key points: " + fsLesson.keyPoints.join(", "),
                        where_we_use_it: "This is crucial for " + fsLesson.category + " engineering.",
                        where_not_to_use_it: "Avoid misapplying these patterns outside their intended scope.",
                        impact: "Mastering this elevates your " + fsLesson.level + " engineering capabilities."
                    },
                    whiteboard_content: [
                        fsLesson.title + " Architecture",
                        "Implementation Patterns"
                    ],
                    key_points: [],
                    interaction_questions: [],
                    expected_answers: [],
                    validation_logic: ["yes", "no", "true", "false", "function", "const", "let", "var", "import", "export"],
                    correct_response: "Precision confirmed. That is the correct architectural approach.",
                    wrong_response: "Incorrect logic detected. Please recalibrate and try again.",
                    real_world_example: "",
                    quizzes: [],
                    linked_scenario_ids: [],
                    duration_estimate: 15,
                    difficulty_level: 'Beginner',
                    part_number: 1
                };
            }
        }

        if (!foundLesson) throw new Error("Lesson not found");

        const mappedLesson = {
            id: foundLesson.id || foundLesson.lesson_id,
            ...foundLesson
        } as unknown as StudentLesson;
        setLesson(mappedLesson);
        
        let actualScenarios: ProfessionalScenario[] = [];
        if (mappedLesson.linked_scenario_ids?.length > 0) {
            const foundScenarios = mappedLesson.linked_scenario_ids
                .map((sId: string) => workspaceScenarios.find((s: any) => s.id === sId))
                .filter(Boolean);
            if (foundScenarios.length > 0) {
                actualScenarios = foundScenarios as unknown as ProfessionalScenario[];
                setScenarios(actualScenarios);
            }
        }

        setPhase('intro');
        
        generateLessonScriptWithLocalModel(mappedLesson, actualScenarios).then((tokens) => {
             if (tokens && tokens.length > 0) {
                 scriptTokensRef.current = tokens;
             }
             setIsScriptReady(true);
        });

      } catch (err) {
        setPhase('error');
      }
    };
    
    fetchLessonData();
    return () => {
        stop();
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [id, stop]);

  // Sync AVA visual state with actual voice state
  useEffect(() => {
      if (['interrupted', 'user_answering', 'doubt_listening', 'hint_listening'].includes(phase)) {
          setAvaState('listening');
      } else if (['gemini_thinking', 'evaluating', 'waiting_hint'].includes(phase)) {
          setAvaState('thinking');
      } else if (isSpeaking) {
          setAvaState('speaking');
      } else {
          setAvaState('passive');
      }
  }, [isSpeaking, phase, isListening]);

  const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
          handleAutoPause();
      }, 600000); // 10 mins
  };

  useEffect(() => {
      if (phase !== 'intro' && phase !== 'session_end' && phase !== 'paused' && phase !== 'loading' && phase !== 'error') {
          resetInactivityTimer();
      }
      return () => {
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
  }, [phase, isSpeaking, isListening]);

  const handleAutoPause = () => {
      stop();
      stopListening();
      setPhase('paused');
      setSubtitles("System paused due to inactivity.");
      speak(isTanglish ? "neengka ready aakura varaikkum naan ingkeyee wait panreen." : "I will wait here until you are ready to continue.");
  };

  const resumeFromPause = () => {
      setPhase('teaching');
      playNextToken();
  };

  const startTeaching = () => {
      if (!isScriptReady) {
          setIsGeneratingScript(true);
          return;
      }
      stop();
      hasSpokenRef.current = true;
      scriptIndexRef.current = 0;
      setWhiteboardItems([{ type: 'write_title', lines: [lesson?.lesson_title || lesson?.title || 'Session Starting...'] }]);
      setPhase('teaching');
      playNextToken();
  };

  useEffect(() => {
     if (isScriptReady && isGeneratingScript) {
         setIsGeneratingScript(false);
         startTeaching();
     }
  }, [isScriptReady, isGeneratingScript]);

  const playNextToken = () => {
    if (scriptIndexRef.current < scriptTokensRef.current.length) {
        setPhase('teaching');
        const token = scriptTokensRef.current[scriptIndexRef.current] as any;
        setSubtitles(token.subtitle);
        if (token.blockType) setCurrentBlockType(token.blockType);
        
        if (token.boardActions && token.boardActions.length > 0) {
            // APPEND — never replace. Board is a permanent scrollable lesson log.
            setWhiteboardItems(prev => [...prev, ...token.boardActions]);
        } else if (token.whiteboard) {
            setWhiteboardItems(prev => [...prev, { text: token.whiteboard! }]);
        }
        
        speak(token.audioUrl || token.text, () => {
             scriptIndexRef.current++;
             
             if (token.isInteractiveMoment && token.moment) {
                 setPhase('interactive_moment');
                 setCurrentMoment(token.moment);
                 // We don't call playNextToken here. It will be called after interaction completes.
             } else if (token.isQuestion) {
                 if (token.isDoubtPrompt) {
                     setPhase('waiting_for_doubt');
                     setSubtitles("Listening for your doubt...");
                     resetTranscript();
                     startListening('doubt');
                 } else {
                     setLastQuestionToken(token);
                     setPhase('waiting_for_user_answer');
                     setSubtitles('You have 1 minute to answer...');
                     resetTranscript();
                     startListening('answer');
                 }
             } else {
                 playNextToken();
             }
        });
    } else {
        endSession();
    }
  };

  useEffect(() => {
     // Mid-lesson question: student starts answering
     if (phase === 'waiting_for_user_answer' && isListening) {
         setPhase('user_answering');
         setSubtitles('Listening... speak your answer');
     }

     // End-of-lesson doubt prompt: move to doubt_listening
     if (phase === 'waiting_for_doubt' && isListening) {
         setPhase('doubt_listening');
     }

     // Hint listening: mic on
     if (phase === 'hint_listening' && isListening) {
         setSubtitles('Listening... say yes for hint or no');
     }

     // Mid-lesson answer: mic stopped — evaluate or offer hint if silent
     if (['waiting_for_user_answer', 'user_answering'].includes(phase) && !isListening) {
         if (transcript.trim() !== '') {
             setPhase('evaluating');
             evaluateUserAnswer(transcript);
         } else {
             // Timed out with no answer — offer hint
             offerHint();
         }
     }

     // Mid-lesson interrupt: mic stopped — process doubt
     if (phase === 'interrupted' && !isListening) {
         if (transcript.trim() !== '') {
             submitDoubt(false);
         } else {
             speak(isTanglish ? "sari, naam lesson-ai continue pannalaam." : "No worries, let's continue.", () => playNextToken());
         }
     }

     // Mid-lesson follow-up doubt clearing loop: mic stopped
     if (phase === 'waiting_for_mid_doubt' && !isListening) {
         const tLower = transcript.toLowerCase().trim();
         if (transcript.trim() === '' || 
             tLower.includes('no') || 
             tLower.includes('all clear') || 
             tLower.includes('nothing') || 
             tLower.includes('clear') || 
             tLower.includes('no doubts') || 
             tLower.includes('continue') ||
             tLower.includes('understood') ||
             tLower.includes('good') ||
             tLower.includes('move on') ||
             tLower.includes('thanks') ||
             tLower.includes('thank you')
         ) {
             speak(isTanglish ? "romba nallathu. vaangka lesson-ai continue pannalaam." : "Excellent. Let's continue with the lesson.", () => playNextToken());
         } else {
             // It's another follow-up doubt!
             submitDoubt(false);
         }
     }

     // End-of-lesson doubt listening: mic stopped — process doubt or wait
     if (['waiting_for_doubt', 'doubt_listening'].includes(phase) && !isListening) {
         if (transcript.trim() !== '') {
             submitDoubt(true);
         } else {
             // No speech heard — ask again, don't auto-end
             speak(isTanglish ? "enakku entha doubt-um keetkala. ellaam clear-aa irunthaa 'all clear' allathu 'no doubts' sollungka, illanaa ungka doubt-ai enkitta keelungka." : "I didn't hear any doubts. If you are all set, just say 'all clear' or say 'no doubts' to finish, or tell me if you have any questions.", () => {
                 setPhase('waiting_for_doubt');
                 resetTranscript();
                 startListening('doubt');
             });
         }
     }

     // Hint response heard
     if (phase === 'hint_listening' && !isListening) {
         handleHintResponse(transcript);
     }
  }, [isListening, phase, transcript]);

  const evaluateUserAnswer = async (userText: string) => {
      if (!lesson) return;
      stopListening();
      setPhase('evaluating');
      setSubtitles('Evaluating your answer...');

      // Find the question token that was just asked
      const token = scriptTokensRef.current[scriptIndexRef.current - 1] as any;
      const questionText = token?.questionText || (lesson as any).questions?.[0]?.question || 'Reflection question';

      const { spokenFeedback, whiteboardFeedback, isCorrect, correction } = await evaluateAnswerWithLocalModel(
          userText,
          questionText,
          lesson,
          scenarios
      );

      setSubtitles(isCorrect ? '✓ Correct!' : '✗ Needs correction');

      // Write feedback to board using the new write_feedback action type
      setWhiteboardItems(prev => [
          ...prev,
          {
              type: 'write_feedback',
              text: spokenFeedback,
              isCorrect,
              correction: !isCorrect ? (correction || whiteboardFeedback) : undefined
          }
      ]);

      speak(spokenFeedback, () => {
          playNextToken();
      });
  };

  // ── Hint flow ─────────────────────────────────────────────────────────────
  const offerHint = () => {
      setPhase('waiting_hint');
      speak(
          isTanglish
              ? "paravayilla. ungkalukku question puriyalaiyaa, illa Hint veenumaa? 'hint' allathu 'puriyala' sollungka, naan thirumpa explain panreen."
              : `No worries. Did you not understand the question, or would you like me to give you a hint? Just say 'hint' or say 'I didn't understand' and I will explain the topic again.`,
          () => {
              setPhase('hint_listening');
              resetTranscript();
              startListening('quick');
          }
      );
  };

  const handleHintResponse = async (response: string) => {
      const r = response.toLowerCase();
      const lesson_ = lesson as any;

      if (r.includes('hint') || r.includes('yes') || r.includes('clue') || r.includes('give')) {
          setPhase('gemini_thinking');
          setSubtitles('Generating hint...');
          
          const hint = await generateSmartHintWithLocalModel(lastQuestionToken?.questionText || '', lesson);
          
          speak(isTanglish ? `ungkalukkaana hint ithoo: ${hint}` : `Here's a hint: ${hint}`, () => {
              speak(isTanglish ? 'ippoo answer panna try pannungka. nithanamaa sollungka.' : 'Now try answering. Take your time.', () => {
                  setPhase('waiting_for_user_answer');
                  setSubtitles('Try again — 1 minute to answer');
                  resetTranscript();
                  startListening('answer');
              });
          });
      } else if (r.includes('explain') || r.includes('again') || r.includes('understand') || r.includes('not') || r.includes('no')) {
          setPhase('gemini_thinking');
          setSubtitles('Preparing explanation...');
          
          const explanation = await reExplainTopicAndQuestionWithLocalModel(lastQuestionToken?.questionText || '', lesson);
          
          speak(explanation, () => {
              speak(isTanglish ? 'ippoo answer panna try pannungka. nithanamaa sollungka.' : 'Now try answering. Take your time.', () => {
                  setPhase('waiting_for_user_answer');
                  setSubtitles('Try again — 1 minute to answer');
                  resetTranscript();
                  startListening('answer');
              });
          });
      } else {
          speak(isTanglish ? "kavalaippataatheengka, time etuththukkongka. Hint veenumnaa 'hint' sollungka, puriyalannaa 'explain' sollungka." : "No worries, take your time. You can say 'hint' for a helpful clue, or say 'not understand' for a clear explanation.", () => {
              setPhase('hint_listening');
              resetTranscript();
              startListening('quick');
          });
      }
  };

  const handleMomentComplete = (isCorrect: boolean, feedbackToSpeak: string) => {
      setCurrentMoment(null);
      setPhase('teaching');
      setSubtitles(isCorrect ? "Correct!" : "Let's review...");
      speak(feedbackToSpeak, () => {
          playNextToken();
      });
  };

  // Doubts / Interruption
  const handleInterrupt = () => {
      stop();
      setPhase('interrupted');
      setSubtitles('Listening to your doubt...');
      resetTranscript();
      startListening('doubt');
  };

  const submitDoubt = async (isEndOfSession = false) => {
     setPhase('gemini_thinking');
     setSubtitles('Ren is thinking...');
     
     const tLower = transcript.toLowerCase();

     // Voice control commands
     if (tLower.includes('pause') || tLower.includes('one minute') || tLower.includes('wait')) {
         handleAutoPause();
         return;
     }
     if (tLower.includes('continue') || tLower.includes('resume')) {
         resumeFromPause();
         return;
     }
     if (tLower.includes('explain again') || tLower.includes('repeat') && scriptIndexRef.current > 0) {
         scriptIndexRef.current--;
         resumeFromPause();
         return;
     }
     // "All clear" signals — only end session if it's the end-of-session doubt prompt
     if (isEndOfSession && (tLower.includes('no ') || tLower.includes('all clear') || tLower.includes('nothing') || tLower.includes('good') || tLower.includes('clear') || tLower.includes('no doubts') || tLower.includes('that\'s all'))) {
         endSession();
         return;
     }

     // ── Intelligence Routing: 3-layer lookup ──
     const result = await processDoubtWithLocalModel(transcript, lesson, transcript);
     const { spokenAnswer, whiteboardText } = result;
     const answerText = (result as any).answerText || spokenAnswer;
     const isFromAPI = (result as any).isFromAPI || false;

     if (user && lesson) {
        try {
           await supabase.from('ai_conversations').insert({
               user_id: user.id,
               lesson_id: (lesson as any).id,
               user_message: transcript,
               ai_response: answerText,
               sentiment: 'doubt'
           });
        } catch (e) { console.log('Logging failed', e); }
     }

     // Show on board — label as API-sourced if unverified
     setWhiteboardItems(prev => [...prev, {
         type: 'write_definition_box',
         text: whiteboardText,
         isUnverified: isFromAPI
     }]);
     if (isFromAPI) {
         setUnverifiedToast('💡 This answer was generated by AI and saved for review.');
         setTimeout(() => setUnverifiedToast(null), 6000);
     }
     setSubtitles('Answering doubt...');

     speak(spokenAnswer, () => {
         const followUpPrompt = isEndOfSession 
             ? (isTanglish ? "ippoo ungkalukku purinjuthaa? veera ethaavatu doubts irukkaa? illannaa 'all clear' sollungka." : "Does that help clarify things? Do you have any other questions, or say 'all clear' to finish.")
             : (isTanglish ? "athu ungkalukku clarify aassaa, illa veera question irukkaa? Continue panna 'all clear' sollungka." : "Does that clarify things, or do you have another question? Say 'all clear' to continue.");
         
         speak(followUpPrompt, () => {
             setPhase(isEndOfSession ? 'waiting_for_doubt' : 'waiting_for_mid_doubt');
             setSubtitles(isEndOfSession ? "Listening for more doubts..." : "Listening for follow-up doubt...");
             resetTranscript();
             startListening('doubt');
         });
     });
  };

  const endSession = async () => {
      setPhase('session_end');
      speak(isTanglish ? "innaiku session vetrikaramaa muninjathu! ippoo ungka workspace challenges-ai solve pannalaam." : "Session complete. Unlocking your workspace challenges now.", () => {
          navigate(`/workspace?lessonId=${lesson?.id}`);
      });
      
      if (user && lesson) {
          try {
             await supabase.from("lesson_summaries").insert({
                 user_id: user.id,
                 lesson_id: lesson.id,
                 lesson_title: lesson.lesson_title || lesson.title,
                 summary_text: `Completed teaching module on ${lesson.lesson_title || lesson.title}.`
             });
          } catch (e) {
             console.error("Summary save failed", e);
          }
      }
  };

  const submitFeedback = async () => {
      if (!user || !lesson) return;
      setIsSubmittingFeedback(true);
      try {
          await supabase.from("session_feedback").insert({
              user_id: user.id,
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              rating: feedbackRating,
              feedback_text: feedbackText
          });
          
          await (supabase as any).from("learning_progress").upsert({
              user_id: user.id,
              video_id: lesson.id,
              marked_understood: true,
              quiz_passed: true,
              total_seconds: 0,
          }, { onConflict: 'user_id, video_id' });
          
          navigate(`/workspace?lessonId=${lesson.id}`);
      } catch (e) {
          console.error("Feedback save failed", e);
      } finally {
          setIsSubmittingFeedback(false);
      }
  };

  useEffect(() => {
      if (phase === 'intro' && lesson && !hasSpokenRef.current) {
          hasSpokenRef.current = true;
          speak(isTanglish ? `Welcome! innaiku naam ${lesson.lesson_title || lesson.title} paththi details-aa analyze pannapporroom. ungkalukku ethaavatu doubts irunthaa ippavee keelungka, illanaa ready-nnu sollungka, naam start pannalaam.` : `Welcome to the cognitive workspace. Today we analyze ${lesson.lesson_title || lesson.title}. Ask any questions now, or let me know when you are ready to begin.`);
      }
  }, [phase, lesson, speak, isTanglish]);

  if (phase === 'loading') {
      return (
         <div className="h-screen w-screen bg-[#020609] flex flex-col items-center justify-center text-cyan-500 font-mono tracking-widest gap-4">
             <Loader2 className="w-10 h-10 animate-spin" />
             INITIALIZING QUANTUM CORE...
         </div>
      );
  }

  if (phase === 'error' || !lesson) {
      return (
         <div className="h-screen w-screen bg-[#020609] flex flex-col items-center justify-center text-red-500 font-mono tracking-widest gap-4">
             MODULE CORRUPTED
             <Button onClick={() => navigate('/learning')} variant="outline" className="border-red-500 text-red-500">RETURN TO BASE</Button>
         </div>
      );
  }

  const isFullscreenAva = phase === 'intro' || phase === 'session_end' || phase === 'paused';
  const showContextualAva = ['interrupted', 'doubt_listening', 'user_answering', 'gemini_thinking', 'evaluating', 'waiting_for_doubt', 'waiting_for_user_answer', 'waiting_hint', 'hint_listening'].includes(phase);
  const isFocusMode = phase === 'teaching';

  return (
    <div className="ava-environment font-mono text-cyan-400">
        <div className={`ava-grid transition-opacity duration-1000 ${isFocusMode ? 'opacity-[0.015]' : 'opacity-[0.035]'}`} />
        <div className="ava-scanlines" />

        {/* Ambient environmental lighting reacts to focus mode */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: isFocusMode 
              ? 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.015) 0%, rgba(0,0,0,0) 80%)'
              : 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.05) 0%, rgba(0,0,0,0) 80%)',
            animation: isFocusMode ? 'none' : 'ava-env-glow 5s ease-in-out infinite',
          }}
        />

        <div className="ava-corner-tl" /><div className="ava-corner-tr" />
        <div className="ava-corner-bl" /><div className="ava-corner-br" />

        <header className={`absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50 transition-opacity duration-1000 ${isFocusMode ? 'opacity-50' : 'opacity-100'}`} style={{ borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => { stop(); stopListening(); navigate(-1); }} className="text-slate-400 hover:text-white p-0 mr-2 transition-all">
                    <ArrowLeft className="w-5 h-5 mr-1" /> ABORT
                </Button>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-cyan-500 shadow-[0_0_8px_rgba(0,200,255,0.8)]'}`}></div>
                <h1 className="text-[11px] font-bold text-cyan-400 tracking-[0.3em] uppercase">COGNITIVE SESSION: {lesson.lesson_title || lesson.title}</h1>
            </div>
            <div className="flex items-center gap-6 text-[9px] text-cyan-700 tracking-widest">
                {isTanglish && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 text-[9px] font-bold tracking-widest border border-amber-500/20">
                    🇮🇳 TANGLISH
                  </span>
                )}
                <span className={activeVoice ? "text-emerald-400/70" : "text-amber-500/70"}>
                   {activeVoice ? `NEURAL LINK OK` : "CONNECTING..."}
                </span>
            </div>
        </header>

        <main className="absolute inset-0 pt-14 pb-8 px-8 flex z-10">
            <AnimatePresence mode="wait">
                {isFullscreenAva ? (
                    <motion.div 
                        key="fullscreen-ava"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full h-full flex flex-col items-center justify-center gap-10"
                    >
                        <AvaCore state={avaState} size="fullscreen" />
                        
                        {phase === 'intro' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="flex flex-col items-center gap-6 z-20"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl font-sans font-bold text-white mb-2">{lesson.lesson_title || lesson.title}</h2>
                                    <p className="text-sm text-cyan-400/60 max-w-lg tracking-wide leading-relaxed">
                                        {lesson.lesson_purpose || lesson.concept_explanation?.what_is_this}
                                    </p>
                                </div>
                                
                                <div className="flex gap-4">
                                    <Button onClick={() => { stop(); handleInterrupt(); }} className="bg-transparent border border-cyan-600/50 hover:bg-cyan-900/30 text-cyan-400 tracking-widest px-6 py-6 rounded-sm">
                                        <HandMetal className="w-4 h-4 mr-2" /> ASK PRE-CLASS DOUBT
                                    </Button>
                                    <Button onClick={startTeaching} disabled={isGeneratingScript} className="bg-cyan-600 hover:bg-cyan-500 text-white tracking-[0.2em] font-bold px-8 py-6 rounded-sm shadow-[0_0_30px_rgba(0,200,255,0.2)] transition-all">
                                        {isGeneratingScript ? <><Loader2 className="w-4 h-4 mr-3 animate-spin" /> PREPARING LESSON...</> : <><Play className="w-4 h-4 mr-3" /> SHALL WE BEGIN?</>}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {phase === 'paused' && (
                            <motion.div className="flex flex-col items-center gap-6 z-20">
                                <p className="text-xl text-amber-400 tracking-widest">SESSION PAUSED</p>
                                <Button onClick={resumeFromPause} className="bg-amber-600 hover:bg-amber-500 text-white tracking-[0.2em] px-8 py-6 rounded-sm">
                                    <Play className="w-4 h-4 mr-3" /> RESUME SESSION
                                </Button>
                            </motion.div>
                        )}

                        {phase === 'session_end' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-xl bg-[#030914] border border-cyan-500/20 rounded-xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,180,255,0.05)] flex flex-col items-center gap-6 z-20"
                            >
                                <div className="text-center border-b border-cyan-500/10 pb-6 w-full">
                                    <h2 className="text-xl font-bold text-white mb-2 tracking-widest">MISSION DEBRIEF</h2>
                                </div>
                                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                                <p className="text-sm text-cyan-400/60 uppercase tracking-widest">UNLOCKING WORKSPACE CHALLENGES...</p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="learning-layout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full flex gap-8 relative"
                    >
                        {/* Immersive VoiceWhiteboard — always fills the entire teaching area */}
                        <div className="w-full h-full relative z-10">
                            <VoiceWhiteboard history={whiteboardItems} lessonTitle={lesson.lesson_title || lesson.title} />

                            {/* Interrupt Button */}
                            {phase === 'teaching' && (
                                <div className="absolute bottom-6 right-6 z-50">
                                    <Button onClick={handleInterrupt} className="bg-[#020609]/80 hover:bg-[#040c1a] text-cyan-400 border border-cyan-500/30 text-[10px] tracking-widest h-10 px-6 rounded-md backdrop-blur-md shadow-[0_0_20px_rgba(0,200,255,0.1)] transition-all hover:scale-105">
                                        <HandMetal className="w-4 h-4 mr-2" /> INTERRUPT REN
                                    </Button>
                                </div>
                            )}

                            {/* Unverified API answer toast */}
                            {unverifiedToast && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-500/50 text-amber-200 text-xs tracking-wider px-4 py-2 rounded-lg backdrop-blur-md shadow-lg">
                                    {unverifiedToast}
                                </div>
                            )}
                        </div>

                        {/* Contextual Ren Corner Appearance (Only during doubts/interrupts) */}
                        <AnimatePresence>
                            {['interrupted', 'doubt_listening', 'user_answering', 'gemini_thinking', 'waiting_hint', 'hint_listening'].includes(phase) && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                    className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-4"
                                >
                                    {/* Action HUD */}
                                    <div className="bg-[#030914]/90 border border-cyan-500/20 backdrop-blur-xl p-4 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.08)] flex flex-col items-end gap-3 max-w-xs">
                                        {subtitles && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">{subtitles}</p>
                                                {isListening && transcript && (
                                                    <p className="text-[11px] text-slate-300 mt-1 italic max-w-xs break-words">"{transcript}"</p>
                                                )}
                                            </div>
                                        )}

                                        {phase === 'waiting_hint' && (
                                            <div className="text-[10px] text-amber-400 tracking-widest flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" /> OFFERING HINT...
                                            </div>
                                        )}
                                        {phase === 'hint_listening' && (
                                            <div className="bg-amber-600/30 text-amber-200 text-[10px] tracking-widest animate-pulse h-8 px-4 rounded-sm border border-amber-500/50 flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" /> SAY: YES (HINT) / EXPLAIN
                                            </div>
                                        )}
                                        {['interrupted', 'doubt_listening', 'user_answering'].includes(phase) && (
                                            <div className="bg-cyan-600/40 text-cyan-200 text-[10px] tracking-widest animate-pulse h-8 px-4 rounded-sm border border-cyan-500/50 flex items-center">
                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                {phase === 'doubt_listening' ? 'LISTENING FOR DOUBT...' : phase === 'user_answering' ? 'ANSWER NOW (60s)' : 'LISTENING...'}
                                            </div>
                                        )}
                                        {phase === 'gemini_thinking' && (
                                            <div className="text-[9px] text-violet-400 tracking-[0.3em] uppercase flex items-center">
                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> REN PROCESSING
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Small visual presence */}
                                    <div className="bg-[#030914]/80 p-4 rounded-full border border-cyan-500/10 backdrop-blur-md shadow-[0_0_40px_rgba(0,180,255,0.05)]">
                                        <AvaCore state={avaState} size="sm" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {phase === 'interactive_moment' && currentMoment && (
                                <InteractiveMomentRenderer 
                                    moment={currentMoment} 
                                    onComplete={handleMomentComplete} 
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    </div>
  );
};

export default InteractiveLesson;
