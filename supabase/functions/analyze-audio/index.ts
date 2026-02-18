import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisResult {
  verdict: string;
  confidence: number;
  summary: string;
  indicators: { label: string; detail: string; signal: "ai" | "human" | "neutral" }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, fileName } = await req.json();

    if (!audioData) {
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert in detecting AI-generated audio (text-to-speech, voice cloning, deepfake audio). Analyze this audio file carefully and determine if it was created by AI or is a genuine human recording.

The file name is: ${fileName || "unknown"}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "verdict": "AI Generated" or "Human Generated",
  "confidence": (number between 0 and 100),
  "summary": "Brief explanation of your analysis",
  "indicators": [
    {
      "label": "Specific indicator name",
      "detail": "Explanation of what you observed",
      "signal": "ai" or "human" or "neutral"
    }
  ]
}

Analyze for:
- Unnatural prosody or rhythm patterns
- Consistent pitch without micro-variations
- Breathing patterns (natural vs absent/artificial)
- Background noise characteristics
- Spectral artifacts from synthesis
- Emotional inflection naturalness
- Mouth sounds and lip smacking (natural speech markers)
- Audio compression artifacts vs synthesis artifacts`,
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioData.replace(/^data:audio\/[^;]+;base64,/, ""),
                  format: "mp3",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", response.status, error);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonStart = cleaned.search(/[\{\[]/);
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No valid JSON found in response");
    }
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

    let result: AnalysisResult;
    try {
      result = JSON.parse(cleaned);
    } catch {
      cleaned = cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x1F\x7F]/g, "");
      result = JSON.parse(cleaned);
    }

    if (typeof result.confidence === "number") {
      result.confidence = Math.round(result.confidence * 100) / 100;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error analyzing audio:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
