import { geminiGenerateJson } from "@/lib/geminiClient";
import { logger } from "@/lib/logger";
import { sanitizePlainText } from "@/lib/sanitize";

export async function answerStudentDoubt(
  question: string,
  context: string
): Promise<{ spokenAnswer: string; whiteboardText: string }> {
  try {
    const safeQuestion = sanitizePlainText(question, { maxLength: 2000 });
    const safeContext = sanitizePlainText(context, { maxLength: 3500 });
    const prompt = `You are Ren, a proactive, helpful Indian AI teacher. 
    You are currently teaching a computer science lesson. Your current lesson context is: "${safeContext}".
    
    A student has interrupted you and asked: "${safeQuestion}"
    
    Provide TWO things formatted as JSON:
    1. "spokenAnswer": A short, friendly, clear 2-sentence conversational response answering the question. Sound encouraging like a teacher.
    2. "whiteboardText": A very concise, 4-5 word summary of the answer to put on the whiteboard.
    
    JSON Output format strictly:
    { "spokenAnswer": "...", "whiteboardText": "..." }`;

    const parsed = await geminiGenerateJson<{
      spokenAnswer?: string;
      whiteboardText?: string;
    }>({
      prompt,
      temperature: 0.7,
    });

    return {
      spokenAnswer: sanitizePlainText(parsed.spokenAnswer, {
        maxLength: 2000,
        fallback:
          "I'm sorry, I couldn't look that up right now. Let's discuss it later!",
      }),
      whiteboardText: sanitizePlainText(parsed.whiteboardText, {
        maxLength: 200,
        fallback: "System Offline: Will answer later",
      }),
    };
  } catch (error) {
    logger.error("geminiService", "Gemini Doubt Error", error);
    return {
      spokenAnswer:
        "I'm sorry, I couldn't look that up right now. Let's discuss it later!",
      whiteboardText: "System Offline: Will answer later",
    };
  }
}
