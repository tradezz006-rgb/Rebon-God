export async function answerStudentDoubt(question: string, context: string): Promise<{ spokenAnswer: string, whiteboardText: string }> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing");

    const prompt = `You are Ren, a proactive, helpful Indian AI teacher. 
    You are currently teaching a computer science lesson. Your current lesson context is: "${context}".
    
    A student has interrupted you and asked: "${question}"
    
    Provide TWO things formatted as JSON:
    1. "spokenAnswer": A short, friendly, clear 2-sentence conversational response answering the question. Sound encouraging like a teacher.
    2. "whiteboardText": A very concise, 4-5 word summary of the answer to put on the whiteboard.
    
    JSON Output format strictly:
    { "spokenAnswer": "...", "whiteboardText": "..." }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
        throw new Error("Failed to fetch from Gemini");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Doubt Error:", error);
    return {
        spokenAnswer: "I'm sorry, I couldn't look that up right now. Let's discuss it later!",
        whiteboardText: "System Offline: Will answer later"
    };
  }
}
