// supabase/functions/analyze-posture/index.ts
// Proxies posture data to Claude and returns a personalized AI summary.
//
// Deploy: supabase functions deploy analyze-posture
// Env var: ANTHROPIC_API_KEY  (set in Supabase dashboard → Edge Functions → Secrets)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Finding {
  id: string;
  label: string;
  detail?: string;
  severity: "good" | "mild" | "moderate" | "notable" | "invalid";
}

interface Subscores {
  headNeck: number;
  shoulderThoracic: number;
  lumbarPelvis: number;
}

interface RequestBody {
  findings: Finding[];
  overallScore: number;
  pattern: string;
  subscores: Subscores;
  ageRange?: string;   // e.g. "25-34"
  scanCount?: number;  // how many scans this user has done
}

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(data: RequestBody): string {
  const { findings, overallScore, pattern, subscores, ageRange, scanCount } = data;

  // Describe score level naturally
  const scoreLabel =
    overallScore >= 85 ? "excellent"
    : overallScore >= 70 ? "good"
    : overallScore >= 55 ? "fair"
    : "needs attention";

  // Summarize findings for the prompt
  const actionableFindings = findings.filter(
    (f) => f.severity !== "good" && f.severity !== "invalid"
  );

  const findingLines = actionableFindings.length
    ? actionableFindings
        .map((f) => `- ${f.label} (${f.severity})${f.detail ? ": " + f.detail : ""}`)
        .join("\n")
    : "- No significant issues detected";

  const subscoreLines = [
    `- Head & Neck: ${subscores.headNeck}/100`,
    `- Shoulder & Thoracic: ${subscores.shoulderThoracic}/100`,
    `- Lumbar & Pelvis: ${subscores.lumbarPelvis}/100`,
  ].join("\n");

  const ageNote = ageRange ? `The user is in the ${ageRange} age range.` : "";
  const scanNote =
    scanCount && scanCount > 1
      ? `This is scan #${scanCount} for this user.`
      : "This is the user's first scan.";

  return `You are SpineLab's AI posture coach. Write a warm, specific, motivating posture summary for a user based on their scan results.

Scan data:
- Overall Spine Score: ${overallScore}/100 (${scoreLabel})
- Primary posture pattern: ${pattern || "mixed"}

Subscores:
${subscoreLines}

Findings:
${findingLines}

Context: ${ageNote} ${scanNote}

Instructions:
- Write 2–3 sentences maximum. Be concise and direct.
- Open with the single most important finding or a brief affirmation if results are good.
- Mention 1–2 specific, actionable things the user can do right now (e.g., a stretch, a habit, a cue).
- Use plain, friendly, non-clinical language — like a knowledgeable friend, not a textbook.
- Do NOT start with "Your scan shows..." or generic openers. Be fresh and specific.
- Do NOT use bullet points, headers, or markdown. Pure prose only.
- Do NOT mention the numerical score.`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();

    const userPrompt = buildPrompt(body);

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[analyze-posture] Anthropic error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicRes.json();
    const summary = anthropicData?.content?.[0]?.text?.trim() ?? "";

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[analyze-posture] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
