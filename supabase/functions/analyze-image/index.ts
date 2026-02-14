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
    const { imageData } = await req.json();

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image data provided" }), {
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
                text: `You are an expert in detecting AI-generated images. Analyze this image carefully and determine if it was created by AI (including GANs, diffusion models, etc.) or is a genuine human-created photograph.

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
- Artifact patterns (blurring, distortion, unusual textures)
- Lighting and shadow consistency
- Object boundaries and edges
- Anatomical correctness (if applicable)
- Pixel patterns and compression anomalies
- Background-foreground coherence
- Text rendering (if present)
- Color gradients and transitions`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
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

    // Clean markdown wrappers from LLM response
    let cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonStart = cleaned.search(/[\{\[]/);
    const jsonEnd = cleaned.lastIndexOf('}');
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

    // Ensure confidence is a number between 0-100
    if (typeof result.confidence === "number") {
      result.confidence = Math.round(result.confidence * 100) / 100;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error analyzing image:", e);
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
