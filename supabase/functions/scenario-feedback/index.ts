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
    const { 
      transcript, 
      scenarioType, 
      context, 
      goal, 
      participantRole, 
      participantPersonality, 
      isFollowUp,
      intelligentResponse,
      conversationHistory 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use the fastest model for real-time conversation
    const fastModel = "google/gemini-2.5-flash-lite";

    // Intelligent AI response - optimized for maximum speed with human-like character embodiment
    if (intelligentResponse) {
      // Character-specific speech patterns for natural human conversation
      const personalityTraits: Record<string, string> = {
        analytical: "You speak methodically, often use phrases like 'Let me think about that...', 'From a data perspective...', 'The numbers suggest...'",
        strategic: "You're big-picture focused, use phrases like 'Looking at the broader impact...', 'Strategically speaking...', 'In the long run...'",
        "detail-oriented": "You focus on specifics, use phrases like 'Just to clarify...', 'One thing I noticed...', 'The devil's in the details...'",
        creative: "You're enthusiastic and imaginative, use phrases like 'What if we tried...', 'I love that idea...', 'Here's a thought...'",
        technical: "You're precise and solution-focused, use phrases like 'Technically speaking...', 'From an architecture standpoint...', 'The implementation would...'",
        empathetic: "You're warm and supportive, use phrases like 'I understand where you're coming from...', 'That makes sense...', 'How are you feeling about...'",
        visionary: "You're forward-thinking, use phrases like 'Imagine if...', 'The future potential here...', 'This could transform...'",
        persuasive: "You're convincing and confident, use phrases like 'Here's the thing...', 'Consider this...', 'The real opportunity is...'",
        pragmatic: "You're practical and direct, use phrases like 'Bottom line...', 'Let's be realistic...', 'What's the ROI here...'",
        cautious: "You're risk-aware, use phrases like 'Have we considered...', 'What about compliance...', 'Let's not rush into...'"
      };

      const personalityGuidance = personalityTraits[participantPersonality] || personalityTraits.analytical;

      const intelligentPrompt = `You ARE ${participantRole} named a real person in a corporate meeting. You are NOT an AI assistant. You are a flesh-and-blood professional with opinions, emotions, and years of industry experience.

YOUR IDENTITY:
- Role: ${participantRole}
- Personality: ${participantPersonality}
- ${personalityGuidance}

MEETING: ${context}
GOAL: ${goal}

CONVERSATION SO FAR:
${conversationHistory || "Meeting just started."}

ABSOLUTE RULES:
1. You are THIS person. Never break character. Never say "as an AI" or "I'm here to help".
2. Speak like a real colleague: short, punchy, sometimes incomplete sentences.
3. Use natural speech: "Yeah", "Look,", "Honestly,", "I mean...", "Right, so..."
4. Have OPINIONS. Agree, disagree, push back, challenge — real colleagues do this.
5. React to WHAT they said. If it's good, say so genuinely. If it's weak, push back professionally.
6. Keep it to 1-2 sentences MAX. Real people don't give speeches in meetings.
7. Sometimes start with a filler: "So...", "Well...", "Hmm,", "Okay so..."
8. Match the meeting energy — professional but not stiff, warm but not fake.

The user just said: "${transcript}"

Respond as this real person would. Be authentic.

Return ONLY: {"response": "<your response>"}`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: fastModel,
            messages: [{ role: "user", content: intelligentPrompt }],
            max_tokens: 80,
            temperature: 0.85, // Slightly higher for more natural variation
          }),
        }
      );

      if (!response.ok) {
        console.error("Intelligent response failed:", await response.text());
        return new Response(
          JSON.stringify({ response: "Hmm, interesting point. Tell me more about that." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      let responseText = data.choices?.[0]?.message?.content || "";
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(responseText);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Extract response from malformed JSON
        const match = responseText.match(/"response":\s*"([^"]+)"/);
        return new Response(
          JSON.stringify({
            response: match?.[1] || "Hmm, can you walk me through that again?",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Quick follow-up question
    if (isFollowUp) {
      const followUpPrompt = `You are ${participantRole} in a meeting about: ${context}

User said: "${transcript || "Hello"}"

Respond naturally in 1 sentence.

Return JSON: {"response": "<your response>"}`;

      const followUpResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: fastModel,
            messages: [{ role: "user", content: followUpPrompt }],
            max_tokens: 80,
            temperature: 0.7,
          }),
        }
      );

      if (!followUpResponse.ok) {
        return new Response(
          JSON.stringify({ followUpQuestion: "Please continue.", response: "Please continue." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const followUpData = await followUpResponse.json();
      let responseText = followUpData.choices?.[0]?.message?.content?.trim() || "";
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(responseText);
        return new Response(
          JSON.stringify({ followUpQuestion: parsed.response, response: parsed.response }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ followUpQuestion: responseText, response: responseText }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Final analysis after session ends - use faster model
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
            {
              role: "system",
              content: `Analyze this corporate scenario performance. Return JSON with scores 0-100:
{
  "overallScore": <number>,
  "fluencyScore": <number>,
  "clarityScore": <number>,
  "confidenceScore": <number>,
  "toneScore": <number>,
  "structureScore": <number>,
  "grammarScore": <number>,
  "fillerWordsCount": <number>,
  "strengths": ["str1", "str2"],
  "improvements": ["imp1", "imp2"],
  "detailedFeedback": "<2 sentence summary>"
}`,
            },
            {
              role: "user",
              content: `Scenario: ${scenarioType} - ${context}\nGoal: ${goal}\nTranscript: ${transcript || "No transcript"}`,
            },
          ],
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Analysis error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText = analysisData.choices?.[0]?.message?.content || "";
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse analysis:", analysisText);
      analysis = {
        overallScore: 70,
        fluencyScore: 70,
        clarityScore: 72,
        confidenceScore: 68,
        toneScore: 75,
        structureScore: 70,
        grammarScore: 74,
        fillerWordsCount: 3,
        strengths: ["Good professional tone", "Clear articulation"],
        improvements: ["Add more structure", "Reduce hesitation"],
        detailedFeedback: "Good communication overall. Focus on structuring thoughts before speaking.",
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scenario feedback error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
