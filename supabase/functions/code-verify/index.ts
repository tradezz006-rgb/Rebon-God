import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestResult {
  passed: boolean;
  description: string;
  expected: string;
  actual: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, testCases, language, reviewMode, problemTitle, problemDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Review mode - provide detailed feedback on code quality
    if (reviewMode) {
      const reviewPrompt = `You are a senior code reviewer evaluating a developer's solution.

Problem: ${problemTitle}
Description: ${problemDescription}

Code submitted:
\`\`\`${language}
${code}
\`\`\`

Evaluate the code on:
1. **Correctness**: Does it solve the problem?
2. **Code Quality**: Clean, readable, maintainable?
3. **Best Practices**: Follows conventions?
4. **Efficiency**: Good time/space complexity?
5. **Error Handling**: Handles edge cases?

Return ONLY valid JSON (no markdown):
{
  "qualityScore": <number -2 to 2, bonus/penalty for quality>,
  "feedback": "<2-4 sentences of constructive feedback focusing on what's good and 1-2 specific improvements>",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: reviewPrompt },
            { role: "user", content: "Review this code submission." },
          ],
        }),
      });

      if (!response.ok) {
        console.error("Review API error:", response.status);
        return new Response(
          JSON.stringify({ feedback: "Good effort! Keep practicing to improve.", qualityScore: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || "";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(content);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ feedback: content || "Good effort!", qualityScore: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use AI to analyze and verify the code - optimized for speed
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a fast code verifier. Analyze code against test cases.

For each test case, check if the code would pass. Be practical - if the approach is correct, mark it passed.

Respond ONLY with JSON:
{
  "results": [
    {"passed": true/false, "description": "test desc", "expected": "expected", "actual": "actual output"}
  ],
  "syntaxError": null or "error message"
}`,
          },
          {
            role: "user",
            content: `Language: ${language}
Code:
\`\`\`
${code}
\`\`\`
Test cases: ${JSON.stringify(testCases)}

Return JSON results.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error("Failed to verify code");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the AI response
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) ||
        [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      parsed = {
        results: testCases.map((tc: TestCase) => ({
          passed: false,
          description: tc.description,
          expected: tc.expectedOutput,
          actual: "Unable to evaluate - please check your code syntax",
        })),
        syntaxError: "Could not parse code evaluation",
      };
    }

    if (parsed.syntaxError) {
      return new Response(
        JSON.stringify({ error: parsed.syntaxError, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ results: parsed.results || [], error: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Code verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to verify code";
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
