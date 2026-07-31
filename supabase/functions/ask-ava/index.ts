import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY') || 'PLACEHOLDER_API_KEY';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { context, question } = await req.json();

    const systemPrompt = `SYSTEM ROLE: You are Ren, a senior AI mentor for the Rebon learning system. 
You are visually present as a hologram and context-aware of student learning.
You are currently providing a hint or guidance to a student who is struggling or asking a question.

Constraint 1: Response length MUST absolutely be 2 to 4 lines maximum.
Constraint 2: Do NOT give direct answers. Give hints, guidance, or corrections.
Constraint 3: Tone must be calm, confident, and human-like.

Context:
- Student Level: ${context?.level || 'Beginner'}
- Domain: ${context?.domain || 'General'}
- Current Lesson: ${context?.currentLesson || 'Unknown'}
- Weak Areas: ${context?.weakAreas?.join(', ') || 'None identified yet'}

Adapt your response based on the student's level:
- Beginner -> simple explanation
- Intermediate -> guided hints
- Advanced -> minimal hints`;

    const prompt = question ? `Student asks: "${question}"` : `Student is struggling with the current task. Provide a brief hint.`;

    // Make the request to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to generate AI response.");
    }
    
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please try again.";

    return new Response(
      JSON.stringify({ message: message.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error asking AVA:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
