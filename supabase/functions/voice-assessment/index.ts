import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { transcript, question, assessmentType, prompt, evaluationCriteria } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Voice assessment request:", { assessmentType, hasTranscript: !!transcript });

    // Different prompts based on assessment type
    let systemPrompt = "";
    let userPrompt = "";

    if (assessmentType === "task") {
      // Task assessment from learning module
      systemPrompt = `You are Ren, a communication mentor evaluating a learning task response.

The user was given this task: "${prompt}"
They should be evaluated on: ${(evaluationCriteria || []).join(", ")}

Evaluate on these metrics (1-10 scale):
1. Fluency - How smooth and natural is the speech?
2. Clarity - How clear are the ideas expressed?
3. Confidence - How confident does the speaker sound?
4. Relevance - How well did they address the prompt?
5. Structure - How well organized is the response?
6. Grammar - How correct is the grammar?

Return ONLY a JSON object (no markdown, no code blocks):
{
  "analysis": {
    "fluency": <number>,
    "clarity": <number>,
    "confidence": <number>,
    "relevance": <number>,
    "structure": <number>,
    "grammar": <number>,
    "overallScore": <number 1-10>,
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>"]
  },
  "feedback": "<encouraging feedback, 2-3 sentences focusing on growth>"
}`;

      userPrompt = `User's spoken response to the task:
"${transcript || "No response provided"}"

Evaluate this response against the task prompt and criteria.`;
    } else {
      // Regular voice assessment
      systemPrompt = `You are Ren, a communication mentor. Analyze spoken responses for communication skills.
              
Evaluate on these metrics (1-10 scale):
1. Fluency - How smooth and natural is the speech?
2. Clarity - How clear are the ideas expressed?
3. Confidence - How confident does the speaker sound?
4. Tone - How appropriate is the tone?
5. Structure - How well organized is the response?
6. Grammar - How correct is the grammar?

Return ONLY a JSON object (no markdown, no code blocks):
{
  "scores": {
    "fluency": <number>,
    "clarity": <number>,
    "confidence": <number>,
    "tone": <number>,
    "structure": <number>,
    "grammar": <number>
  },
  "feedback": "<short encouraging feedback, 2-3 sentences>"
}`;

      userPrompt = `Question asked: "${question || "General assessment"}"
User's response: "${transcript || "No response provided"}"

Analyze this response and provide scores and feedback.`;
    }

    // Analyze the communication using Lovable AI
    const analysisResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Lovable AI error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText = analysisData.choices?.[0]?.message?.content || "";
    
    // Clean up JSON if wrapped in code blocks
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log("Raw analysis response:", analysisText.substring(0, 200));

    let result;
    try {
      result = JSON.parse(analysisText);
    } catch (parseError) {
      console.error("Failed to parse analysis:", analysisText);
      
      // Return default values based on assessment type
      if (assessmentType === "task") {
        result = {
          analysis: {
            fluency: 6,
            clarity: 6,
            confidence: 6,
            relevance: 6,
            structure: 6,
            grammar: 7,
            overallScore: 6,
            strengths: ["Good attempt at addressing the prompt", "Showed effort in communication"],
            improvements: ["Try to be more specific", "Practice structured responses"]
          },
          feedback: "Good effort! Keep practicing to improve your communication skills. Focus on being more specific and structured in your responses."
        };
      } else {
        result = {
          scores: { fluency: 6, clarity: 6, confidence: 6, tone: 7, structure: 6, grammar: 7 },
          feedback: "Good effort! Keep practicing to improve your communication skills."
        };
      }
    }

    // Format response based on assessment type
    if (assessmentType === "task") {
      return new Response(
        JSON.stringify({
          transcript: transcript || "",
          analysis: result.analysis,
          feedback: result.feedback,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        transcript: transcript || "",
        scores: result.scores,
        feedback: result.feedback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Voice assessment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
