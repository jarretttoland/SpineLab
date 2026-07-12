/**
 * Posture analysis — lateral (side-profile) photo scoring.
 *
 * Accepts the 5 key landmarks MediaPipe extracts from a side photo:
 *   ear, shoulder, hip, knee, ankle  (all normalized 0–1 image coords)
 *
 * Measures:
 *   1. Forward Head Posture      — ear-to-shoulder horizontal offset / torso height
 *   2. Rounded Shoulders         — shoulder-to-hip horizontal offset / torso length
 *   3. Thoracic Kyphosis         — ear→shoulder→hip angle (smaller = more rounded upper back)
 *   4. Lumbar Lordosis           — hip deviation from shoulder-ankle plumb line
 *   5. Pelvic Tilt               — hip-to-ankle horizontal displacement / lower-body height
 *
 * All measurements use absolute (unsigned) distances — works regardless of
 * which direction the subject faces in the photo.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function angleDeg(A, B, C) {
  const BAx = A.x - B.x, BAy = A.y - B.y;
  const BCx = C.x - B.x, BCy = C.y - B.y;
  const dot = BAx * BCx + BAy * BCy;
  const mag = Math.sqrt((BAx * BAx + BAy * BAy) * (BCx * BCx + BCy * BCy));
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function dist(A, B) {
  const dx = A.x - B.x, dy = A.y - B.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Average visibility across a set of landmarks — properly handles operator precedence. */
function avgVis(...pts) {
  const valid = pts.filter(Boolean);
  if (!valid.length) return 0;
  return valid.reduce((s, p) => s + (p.visibility ?? 0.5), 0) / valid.length;
}

/**
 * Returns "good" | "mild" | "moderate" | "notable" based on numeric value.
 * Each threshold is the LOWER bound for that tier.
 */
function tier(value, mild, moderate, notable) {
  if (value >= notable)  return "notable";
  if (value >= moderate) return "moderate";
  if (value >= mild)     return "mild";
  return "good";
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FORWARD HEAD POSTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Horizontal distance from ear to shoulder, normalized by torso height
 * (shoulder→hip distance). In neutral posture the ear sits directly above
 * the shoulder; forward head posture shifts it anteriorly.
 *
 * Clinical context: every 2.5 cm of anterior head shift adds ~10 lbs of
 * effective load to the cervical spine.
 *
 * Thresholds (ratio = headOffset / torsoHeight):
 *   good     < 0.07
 *   mild     0.07 – 0.12
 *   moderate 0.12 – 0.18
 *   notable  ≥ 0.18
 */
function scoreForwardHead(ear, shoulder, hip) {
  if (!ear || !shoulder) {
    return { severity: "invalid", penalty: 0, label: "Cannot score", detail: "", confidence: 0, headOffset: null };
  }

  const conf = avgVis(ear, shoulder);
  if (conf < 0.30) {
    return { severity: "invalid", penalty: 0, label: "Low confidence", detail: "", confidence: conf, headOffset: null };
  }

  const torsoH = (hip && dist(shoulder, hip) > 0.01) ? dist(shoulder, hip) : 1;
  const offset = Math.abs(ear.x - shoulder.x) / torsoH;
  const t = tier(offset, 0.07, 0.12, 0.18);

  const MAP = {
    notable:  {
      label:   "Severe forward head posture",
      detail:  "Ear is significantly anterior to the shoulder. Each 2.5 cm of forward head adds ~10 lbs of effective load to the cervical spine.",
      penalty: 28,
    },
    moderate: {
      label:   "Moderate forward head posture",
      detail:  "Clear anterior head shift. Increases cervical and upper-back load and commonly causes chronic neck tension.",
      penalty: 18,
    },
    mild: {
      label:   "Mild forward head posture",
      detail:  "Slight anterior head drift. Even small shifts accumulate strain over time.",
      penalty: 10,
    },
    good: {
      label:   "Neutral head alignment",
      detail:  "Ear is well-aligned over the shoulder — good cervical posture.",
      penalty: 0,
    },
  };

  return { severity: t, confidence: conf, headOffset: offset, ...MAP[t] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ROUNDED SHOULDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Horizontal shoulder-to-hip offset normalized by shoulder-to-hip distance.
 * In neutral alignment the shoulder sits slightly anterior to the hip;
 * protracted (rounded) shoulders increase this ratio meaningfully.
 *
 * NOTE: A small offset is anatomically normal in a lateral photo (shoulder is
 * naturally slightly in front of the hip), so the mild threshold starts at 0.10
 * rather than 0.06 to avoid false positives.
 *
 * Thresholds (ratio = |shoulder.x − hip.x| / dist(shoulder, hip)):
 *   good     < 0.10
 *   mild     0.10 – 0.16
 *   moderate 0.16 – 0.22
 *   notable  ≥ 0.22
 */
function scoreRoundedShoulders(shoulder, hip) {
  if (!shoulder || !hip) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const conf = avgVis(shoulder, hip);
  const scale = dist(shoulder, hip) > 0.01 ? dist(shoulder, hip) : 1;
  const ratio = Math.abs(shoulder.x - hip.x) / scale;
  const t = tier(ratio, 0.10, 0.16, 0.22);

  const MAP = {
    notable:  {
      label:   "Significant rounded shoulders",
      detail:  "Shoulders are clearly protracted forward, compressing the chest and straining the rotator cuff.",
      penalty: 16,
    },
    moderate: {
      label:   "Moderate rounded shoulders",
      detail:  "Noticeable forward shoulder position — common in desk workers and phone users.",
      penalty: 10,
    },
    mild: {
      label:   "Mild rounded shoulders",
      detail:  "Slight forward shoulder positioning. Chest-opening and upper-back exercises help.",
      penalty: 5,
    },
    good: {
      label:   "Neutral shoulder alignment",
      detail:  "",
      penalty: 0,
    },
  };

  return { severity: t, confidence: conf, ...MAP[t] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. THORACIC KYPHOSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Angle at the shoulder formed by ear→shoulder→hip.
 * In an upright spine this angle is close to 180°.
 * As thoracic kyphosis increases, the shoulder migrates anteriorly and
 * inferiorly relative to the ear and hip, reducing the angle.
 *
 * Thresholds (angle in degrees):
 *   good     ≥ 158°
 *   mild     148° – 158°
 *   moderate 138° – 148°
 *   notable  < 138°
 */
function scoreThoracicKyphosis(ear, shoulder, hip) {
  if (!ear || !shoulder || !hip) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const angle = angleDeg(ear, shoulder, hip);
  // Previously had operator-precedence bug here — avgVis() fixes it.
  const conf = avgVis(ear, shoulder, hip);

  const t =
    angle < 138 ? "notable"  :
    angle < 148 ? "moderate" :
    angle < 158 ? "mild"     : "good";

  const MAP = {
    notable:  {
      label:   "Significant thoracic kyphosis",
      detail:  "Pronounced upper-back rounding. Strains the thoracic extensors and can restrict breathing depth.",
      penalty: 16,
    },
    moderate: {
      label:   "Moderate thoracic rounding",
      detail:  "Clear forward curve in the upper back. Often seen together with forward head posture.",
      penalty: 10,
    },
    mild: {
      label:   "Mild thoracic rounding",
      detail:  "Slight forward curve in the thoracic spine.",
      penalty: 5,
    },
    good: {
      label:   "Neutral thoracic alignment",
      detail:  "",
      penalty: 0,
    },
  };

  return { severity: t, confidence: conf, angle, ...MAP[t] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LUMBAR LORDOSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Measures how far the hip deviates from the straight line connecting
 * shoulder to ankle (the whole-body plumb line).
 *
 * In neutral alignment the hip falls roughly on or near this line.
 * In lumbar lordosis / anterior pelvic tilt the hip is pushed anteriorly,
 * creating a visible sway in the lower back.
 *
 * hipDev = |hip.x − expected_x_on_shoulder_ankle_line| / dist(shoulder, ankle)
 *
 * Thresholds:
 *   good     < 0.04
 *   mild     0.04 – 0.08
 *   moderate 0.08 – 0.13
 *   notable  ≥ 0.13
 *
 * If ankle is unavailable, falls back to hip-shoulder horizontal offset
 * (less precise but still directionally correct).
 */
function scoreLumbarLordosis(shoulder, hip, ankle) {
  if (!shoulder || !hip) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  // Previously had operator-precedence bug in confidence — avgVis() fixes it.
  const conf = avgVis(shoulder, hip, ankle);

  let hipDev;
  if (ankle && dist(shoulder, ankle) > 0.01) {
    // Interpolate where the hip SHOULD be on a straight shoulder→ankle line
    const bodyH = dist(shoulder, ankle);
    const tRatio = (hip.y - shoulder.y) / (ankle.y - shoulder.y);
    const expectedX = shoulder.x + (ankle.x - shoulder.x) * tRatio;
    hipDev = Math.abs(hip.x - expectedX) / bodyH;
  } else {
    // Fallback: hip horizontal offset from shoulder, normalised by torso
    const torsoH = dist(shoulder, hip) > 0.01 ? dist(shoulder, hip) : 1;
    hipDev = Math.abs(hip.x - shoulder.x) / torsoH * 0.55;
  }

  const t = tier(hipDev, 0.04, 0.08, 0.13);

  const MAP = {
    notable:  {
      label:   "Lumbar lordosis / anterior pelvic tilt",
      detail:  "Hips are significantly thrust forward relative to the trunk. This exaggerates the lumbar curve and compresses the posterior spinal structures.",
      penalty: 22,
    },
    moderate: {
      label:   "Moderate lumbar sway",
      detail:  "Noticeable forward hip position relative to the body plumb line. Often linked to tight hip flexors and weak core.",
      penalty: 14,
    },
    mild: {
      label:   "Mild lumbar deviation",
      detail:  "Slight hip sway. Core strengthening and hip-flexor stretching help restore neutral alignment.",
      penalty: 7,
    },
    good: {
      label:   "Neutral lumbar alignment",
      detail:  "",
      penalty: 0,
    },
  };

  return { severity: t, confidence: conf, hipDev, ...MAP[t] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PELVIC TILT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hip-to-ankle horizontal displacement normalized by lower-body height.
 * Captures anterior/posterior pelvic shift — how far the hips are displaced
 * from a plumb line directly over the feet.
 *
 * This is intentionally distinct from the lordosis measurement above:
 *   • Lordosis   = hip vs. the full shoulder→ankle plumb line (sway of the hip
 *                  relative to the whole trunk)
 *   • Pelvic tilt= hip vs. ankle only (pelvis displaced over the feet)
 *
 * Thresholds (ratio = |hip.x − ankle.x| / dist(hip, ankle)):
 *   good     < 0.05
 *   mild     0.05 – 0.10
 *   moderate 0.10 – 0.16
 *   notable  ≥ 0.16
 */
function scorePelvicTilt(hip, ankle) {
  if (!hip || !ankle) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const conf = avgVis(hip, ankle);
  const lowerH = dist(hip, ankle) > 0.01 ? dist(hip, ankle) : 1;
  const ratio = Math.abs(hip.x - ankle.x) / lowerH;
  const t = tier(ratio, 0.05, 0.10, 0.16);

  const MAP = {
    notable:  {
      label:   "Significant anterior pelvic tilt",
      detail:  "Hips are clearly displaced forward of the ankle plumb line. Overstretches the hamstrings and compresses the lumbar spine.",
      penalty: 14,
    },
    moderate: {
      label:   "Moderate pelvic tilt",
      detail:  "Noticeable forward hip displacement over the feet. Often linked to tight hip flexors and inhibited glutes.",
      penalty: 8,
    },
    mild: {
      label:   "Mild pelvic lean",
      detail:  "Minor hip displacement relative to the ankle.",
      penalty: 4,
    },
    good: {
      label:   "Neutral pelvic alignment",
      detail:  "",
      penalty: 0,
    },
  };

  return { severity: t, confidence: conf, ...MAP[t] };
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL SCORE HELPER
// ─────────────────────────────────────────────────────────────────────────────

const SEV_SCORE = { good: 100, mild: 87, moderate: 74, notable: 60, invalid: 100 };
const sevScore  = (s) => SEV_SCORE[s] ?? 100;

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY BUILDER
// Produces a specific, human-readable paragraph from actual measurement data.
// ─────────────────────────────────────────────────────────────────────────────

function buildSummary({ activeIssues, pattern, overallScore, fhp, rsh, thk, lum, pel }) {
  if (activeIssues.length === 0) {
    return "Your posture looks well-balanced — ear, shoulder, and hip are all closely aligned. Maintaining this takes consistent movement; keep up your daily exercises to hold onto these results.";
  }

  const sentences = [];

  // ── Opening: name the dominant pattern and score ──────────────────────────
  const grade = overallScore >= 88 ? "strong" : overallScore >= 74 ? "solid" : overallScore >= 58 ? "moderate" : "low";
  // Strip trailing " pattern" from the pattern string to avoid "pattern pattern" duplication
  const patternLabel = pattern.toLowerCase().replace(/\s+pattern$/i, "");
  // "an" before vowel sounds
  const article = /^[aeiou]/i.test(patternLabel) ? "an" : "a";
  sentences.push(`Your scan shows ${article} ${patternLabel} pattern with an overall posture score of ${overallScore} — ${grade} for your current alignment.`);

  // ── Middle: describe the two most significant findings specifically ────────
  const ranked = [...activeIssues].sort((a, b) => {
    const rank = { notable: 3, moderate: 2, mild: 1, good: 0, invalid: -1 };
    return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0);
  });

  const findingDetails = {
    forward_head: (sev) => {
      const offset = fhp.headOffset;
      const cm = offset ? `approximately ${Math.round(offset * 100 * 2.5)} cm` : "noticeably";
      if (sev === "notable")  return `Your head is ${cm} forward of your shoulder — a ${sev} shift that adds significant load to the cervical spine and upper traps.`;
      if (sev === "moderate") return `Your head sits ${cm} in front of your shoulder, increasing the effective weight your neck muscles must support throughout the day.`;
      return `There's a slight forward head position (${cm} anterior to the shoulder), which can accumulate strain over time.`;
    },
    rounded_shoulders: (sev) => {
      if (sev === "notable")  return `Your shoulders are significantly protracted forward, compressing the chest and placing the rotator cuff in a stretched, weakened position.`;
      if (sev === "moderate") return `Your shoulders show clear forward protraction — a common pattern in people who spend long hours at a desk or on a phone.`;
      return `Your shoulders sit slightly forward of neutral, which can gradually restrict chest expansion and shoulder mobility.`;
    },
    thoracic: (sev) => {
      const angle = thk.angle ? `${Math.round(thk.angle)}°` : null;
      if (sev === "notable")  return `The ear-shoulder-hip angle measures${angle ? ` ${angle}` : ""}, indicating pronounced upper-back rounding that limits breathing depth and thoracic extension.`;
      if (sev === "moderate") return `There's a clear forward curve in your upper back${angle ? ` (${angle} ear-shoulder-hip angle)` : ""}, often seen alongside forward head posture.`;
      return `Your upper back shows a mild forward curve, which is common but worth addressing with thoracic mobility work.`;
    },
    lumbar: (sev) => {
      if (sev === "notable")  return `Your hips are thrust significantly forward relative to your trunk, exaggerating the lumbar curve and compressing the posterior spinal structures.`;
      if (sev === "moderate") return `There's a noticeable forward hip position relative to your body's plumb line — often linked to tight hip flexors and a weak core.`;
      return `A slight lumbar deviation is present, suggesting mildly overactive hip flexors.`;
    },
    pelvis: (sev) => {
      if (sev === "notable")  return `Your hips are clearly displaced forward of your ankle line, over-stretching the hamstrings and loading the lumbar spine.`;
      if (sev === "moderate") return `Your pelvis tilts noticeably forward over your feet — a pattern often driven by tight hip flexors and inhibited glutes.`;
      return `There's a mild forward pelvic lean relative to your ankle position.`;
    },
  };

  // Add detail for the top 1–2 findings
  const topTwo = ranked.slice(0, 2);
  for (const f of topTwo) {
    const detail = findingDetails[f.id];
    if (detail) sentences.push(detail(f.severity));
  }

  // ── Closing: targeted action sentence ─────────────────────────────────────
  const notableCount = activeIssues.filter((f) => ["notable", "moderate"].includes(f.severity)).length;
  if (notableCount >= 2) {
    sentences.push("Your routine has been updated to target these patterns directly — consistency over the next few weeks is what drives real change.");
  } else if (notableCount === 1) {
    sentences.push("Your exercises are tailored to address this specifically. Doing them daily will gradually retrain the muscles that hold this pattern in place.");
  } else {
    sentences.push("Keep up your daily exercises — even mild tendencies respond well to consistent targeted movement.");
  }

  return sentences.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export function analyzePosture(kl, imgW = 1, imgH = 1.5, debug = false) {
  const { ear, shoulder, hip, knee, ankle } = kl;

  // Need at minimum shoulder + hip to score anything
  const shVis  = shoulder?.visibility ?? 0;
  const hipVis = hip?.visibility ?? 0;
  if (!shoulder || !hip || shVis < 0.20 || hipVis < 0.20) {
    return {
      findings: [{
        id:         "posture_invalid",
        label:      "Invalid pose — no score",
        detail:     "Landmarks not clearly visible. Please retake with your full side profile visible.",
        confidence: "low",
        severity:   "invalid",
      }],
      overallScore: 0,
      summary:      "Could not analyze posture — landmarks insufficient.",
      pattern:      "Invalid pose",
      subscores:    { headNeck: 0, shoulderThoracic: 0, lumbarPelvis: 0 },
    };
  }

  // ── Score each region ────────────────────────────────────────────────────
  const fhp  = scoreForwardHead(ear, shoulder, hip);
  const rsh  = scoreRoundedShoulders(shoulder, hip);
  const thk  = scoreThoracicKyphosis(ear, shoulder, hip);
  const lum  = scoreLumbarLordosis(shoulder, hip, ankle);
  const pel  = scorePelvicTilt(hip, ankle);

  // ── Build findings array ─────────────────────────────────────────────────
  const findings = [];
  const penaltyLog = [];
  let totalPenalty = 0;

  const push = (scored, id) => {
    if (scored.severity === "invalid") return;
    findings.push({
      id,
      label:      scored.label,
      detail:     scored.detail,
      confidence: scored.confidence >= 0.40 ? "high" : scored.confidence >= 0.25 ? "moderate" : "low",
      severity:   scored.severity,
    });
    if (scored.penalty > 0) {
      penaltyLog.push({ id, label: scored.label, penalty: scored.penalty });
      totalPenalty += scored.penalty;
    }
  };

  push(fhp, "forward_head");
  push(rsh, "rounded_shoulders");
  push(thk, "thoracic");
  push(lum, "lumbar");
  push(pel, "pelvis");

  // ── Regional scores ──────────────────────────────────────────────────────
  // Head/neck: forward head only
  const headScore = sevScore(fhp.severity);

  // Shoulder/thoracic: worst of rounded shoulders and kyphosis
  const shoulderScore = Math.min(sevScore(rsh.severity), sevScore(thk.severity));

  // Lumbar/pelvis: worst of lordosis and pelvic tilt
  // (they often co-occur and compound each other)
  const lumbarScore = Math.min(sevScore(lum.severity), sevScore(pel.severity));

  // ── Weighted final score ─────────────────────────────────────────────────
  // Head is heavily weighted — forward head is the most clinically impactful
  // and most consistently measurable from a side-profile photo.
  let overallScore = Math.round(
    headScore     * 0.35 +
    shoulderScore * 0.30 +
    lumbarScore   * 0.35
  );
  overallScore = Math.max(0, Math.min(100, overallScore));

  // Hard caps so one "notable" finding can't hide behind good scores elsewhere
  const activeIssues = findings.filter((f) => f.severity !== "good" && f.severity !== "invalid");
  const severities   = activeIssues.map((f) => f.severity);
  if (severities.includes("notable"))  overallScore = Math.min(overallScore, 70);
  else if (severities.includes("moderate")) overallScore = Math.min(overallScore, 83);
  else if (severities.includes("mild"))     overallScore = Math.min(overallScore, 93);

  // ── Pattern classification ───────────────────────────────────────────────
  const labels = activeIssues.map((f) => f.label.toLowerCase());
  const hasFHP  = labels.some((l) => l.includes("forward head"));
  const hasRSh  = labels.some((l) => l.includes("rounded shoulder"));
  const hasKyph = labels.some((l) => l.includes("kyphosis") || l.includes("thoracic"));
  const hasLord = labels.some((l) => l.includes("lordosis") || l.includes("lumbar") || l.includes("sway"));
  const hasPel  = labels.some((l) => l.includes("pelvic"));

  let pattern;
  if (activeIssues.length === 0) {
    pattern = "Neutral alignment";
  } else if (hasFHP && hasRSh && hasKyph) {
    pattern = "Upper crossed syndrome pattern";
  } else if (hasFHP && hasRSh) {
    pattern = "Forward head posture + rounded shoulders";
  } else if (hasFHP && hasKyph) {
    pattern = "Forward head posture + thoracic kyphosis";
  } else if (hasKyph && (hasLord || hasPel)) {
    pattern = "Kyphosis-lordosis posture";
  } else if (hasFHP) {
    pattern = (hasLord || hasPel) ? "Forward head posture + lumbar lordosis" : "Forward head posture";
  } else if (hasKyph) {
    pattern = "Thoracic kyphosis";
  } else if (hasLord || hasPel) {
    pattern = "Lumbar lordosis / anterior pelvic tilt";
  } else {
    pattern = activeIssues.length > 1 ? "Mixed postural pattern" : (activeIssues[0]?.label ?? "Postural deviation");
  }

  // ── Summary text ─────────────────────────────────────────────────────────
  const summary = buildSummary({ activeIssues, pattern, overallScore, fhp, rsh, thk, lum, pel });

  // ── Debug payload ─────────────────────────────────────────────────────────
  const debugInfo = debug ? {
    measurements: {
      fhpOffset:   fhp.headOffset?.toFixed(4),
      rshRatio:    null,
      thkAngle:    thk.angle?.toFixed(1),
      lumHipDev:   lum.hipDev?.toFixed(4),
    },
    severities: {
      fhp:  fhp.severity,
      rsh:  rsh.severity,
      thk:  thk.severity,
      lum:  lum.severity,
      pel:  pel.severity,
    },
    regionalScores: { headScore, shoulderScore, lumbarScore },
    penaltyLog,
    totalPenalty,
    finalScore: overallScore,
  } : undefined;

  return {
    findings,
    overallScore,
    summary,
    pattern,
    subscores: {
      headNeck:         headScore,
      shoulderThoracic: shoulderScore,
      lumbarPelvis:     lumbarScore,
    },
    ...(debug ? { debug: debugInfo } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

export function compareTrend(currentFindings, previousFindings) {
  if (!previousFindings || previousFindings.length === 0) return null;
  const w     = { good: 0, mild: 1, moderate: 2, notable: 3 };
  const score = (f) => f.reduce((s, x) => s + (w[x.severity] ?? 0), 0);
  const delta = score(currentFindings) - score(previousFindings);
  if (delta <= -2) return "Improved compared to last scan";
  if (delta >= 2)  return "Increase in postural tendencies vs. last scan";
  return "No major change from last scan";
}
