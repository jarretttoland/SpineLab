/**
 * Side-agnostic posture analysis — handles left-facing or right-facing lateral scans.
 *
 * PIPELINE:
 * 1. Auto-detect which body side (left/right) has better landmark visibility.
 * 2. Use only that side for all measurements — eliminates sign-flipping bugs.
 * 3. Use absolute distances and body-relative ratios — works regardless of facing direction.
 * 4. Score each region independently (head/neck, shoulders, lumbar/pelvis).
 * 5. Reweight and cap final score based on abnormality severity.
 * 6. Return "Invalid pose" if landmarks too poor to score reliably.
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

function distance(A, B) {
  const dx = A.x - B.x, dy = A.y - B.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function tier(value, mild, moderate, severe) {
  if (value >= severe)   return "severe";
  if (value >= moderate) return "moderate";
  if (value >= mild)     return "mild";
  return "good";
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDE AUTO-DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Choose best visible side (left or right) for lateral scoring.
 * Returns { side: "left" | "right", ear, shoulder, hip, confidence }
 * Throws "no_visible_side" if neither side viable.
 */
function chooseBestSide(landmarks) {
  const leftEar    = landmarks[7];  const rightEar    = landmarks[8];
  const leftSho    = landmarks[11]; const rightSho    = landmarks[12];
  const leftHip    = landmarks[23]; const rightHip    = landmarks[24];

  const getVis = (pt) => pt?.visibility ?? 0;
  const leftScore  = getVis(leftEar) + getVis(leftSho) + getVis(leftHip);
  const rightScore = getVis(rightEar) + getVis(rightSho) + getVis(rightHip);

  const MIN_TRIO_VIS = 0.50; // Combined visibility threshold
  if (Math.max(leftScore, rightScore) < MIN_TRIO_VIS) {
    throw new Error("no_visible_side");
  }

  const side = leftScore >= rightScore ? "left" : "right";
  const ear = side === "left" ? leftEar : rightEar;
  const shoulder = side === "left" ? leftSho : rightSho;
  const hip = side === "left" ? leftHip : rightHip;

  const confidence = (side === "left" ? leftScore : rightScore) / 3; // avg visibility
  return { side, ear, shoulder, hip, confidence };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORWARD HEAD SEVERITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify forward head posture using side-agnostic absolute distance.
 * Normalize by torso scale (shoulder-to-hip distance) for side consistency.
 *
 * Returns { severity, penalty, label, detail, confidence, headOffset }
 */
function getForwardHeadSeverity(ear, shoulder, hip) {
  if (!ear || !shoulder) {
    return { severity: "invalid", penalty: 0, label: "Cannot score", detail: "", confidence: 0, headOffset: null };
  }

  // Absolute horizontal distance from ear to shoulder
  const headOffsetAbs = Math.abs(ear.x - shoulder.x);

  // Normalize by torso height if hip available; otherwise use raw threshold
  let normalizedOffset = headOffsetAbs;
  if (hip && distance(shoulder, hip) > 0.01) {
    const torsoHeight = distance(shoulder, hip);
    normalizedOffset = headOffsetAbs / torsoHeight;
  }

  // Thresholds (very sensitive)
  const t = tier(normalizedOffset, 0.06, 0.10, 0.15);

  let label, detail, penalty, severity;
  const MIN_CONF = 0.35;
  const conf = Math.min(1, Math.max(0, (ear.visibility ?? 0.5) + (shoulder.visibility ?? 0.5)) / 2);

  if (conf < MIN_CONF) {
    return { severity: "invalid", penalty: 0, label: "Low confidence", detail: "", confidence: conf, headOffset: normalizedOffset };
  }

  if (t === "severe") {
    label = "Severe forward head posture";
    detail = "Ear is significantly anterior to shoulder. This loads the cervical spine heavily.";
    penalty = 30;
    severity = "notable";
  } else if (t === "moderate") {
    label = "Moderate forward head posture";
    detail = "Clear forward shift of head. Increases cervical and upper back load.";
    penalty = 20;
    severity = "moderate";
  } else if (t === "mild") {
    label = "Mild forward head posture";
    detail = "Slight forward head position. Even small drift accumulates strain over time.";
    penalty = 12;
    severity = "mild";
  } else {
    label = "Neutral head alignment";
    detail = "Ear is well-aligned over shoulder.";
    penalty = 0;
    severity = "good";
  }

  return { severity, penalty, label, detail, confidence: conf, headOffset: normalizedOffset };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUNDED SHOULDERS / KYPHOSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect rounded shoulders (anterior shoulder protrusion).
 * Uses ear-to-shoulder horizontal distance relative to upper torso.
 */
function getRoundedShouldersSeverity(ear, shoulder, hip) {
  if (!ear || !shoulder) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  // Shoulder protraction: how far anterior the shoulder is
  // Approximate by ear-shoulder offset; if ear and shoulder are close horizontally, shoulder likely neutral
  const earToShoX = Math.abs(ear.x - shoulder.x);

  // If hip available, normalize by torso scale
  let shRatio = earToShoX;
  if (hip && distance(shoulder, hip) > 0.01) {
    const torsoHeight = distance(shoulder, hip);
    shRatio = earToShoX / torsoHeight;
  }

  // Thresholds
  const t = tier(shRatio, 0.06, 0.12, 0.18);

  let label, detail, penalty, severity;
  const conf = Math.min(1, ((shoulder.visibility ?? 0.5) + (ear.visibility ?? 0.5)) / 2);

  if (t === "severe") {
    label = "Significant rounded shoulders";
    detail = "Shoulders are clearly protracted forward, compressing the chest.";
    penalty = 18;
    severity = "notable";
  } else if (t === "moderate") {
    label = "Moderate rounded shoulders";
    detail = "Noticeable forward shoulder position, common in desk workers.";
    penalty = 12;
    severity = "moderate";
  } else if (t === "mild") {
    label = "Mild rounded shoulders";
    detail = "Slight forward shoulder positioning.";
    penalty = 6;
    severity = "mild";
  } else {
    label = "Neutral shoulder alignment";
    detail = "";
    penalty = 0;
    severity = "good";
  }

  return { severity, penalty, label, detail, confidence: conf };
}

// ─────────────────────────────────────────────────────────────────────────────
// THORACIC KYPHOSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect thoracic kyphosis using upper-back curvature.
 * Angle ear-shoulder-hip; smaller = more flexion = more kyphosis.
 */
function getThoracicKyphosis(ear, shoulder, hip) {
  if (!ear || !shoulder || !hip) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const angle = angleDeg(ear, shoulder, hip);
  const conf = Math.min(1, (ear.visibility ?? 0.5 + shoulder.visibility ?? 0.5 + hip.visibility ?? 0.5) / 3);

  let label, detail, penalty, severity;

  if (angle < 143) {
    label = "Thoracic kyphosis pattern";
    detail = "Significant upper back rounding detected.";
    penalty = 18;
    severity = "notable";
  } else if (angle < 153) {
    label = "Moderate thoracic rounding";
    detail = "Clear forward curve in upper back.";
    penalty = 12;
    severity = "moderate";
  } else if (angle < 162) {
    label = "Mild thoracic rounding";
    detail = "Slight forward curve.";
    penalty = 6;
    severity = "mild";
  } else {
    label = "Neutral thoracic alignment";
    detail = "";
    penalty = 0;
    severity = "good";
  }

  return { severity, penalty, label, detail, confidence: conf };
}

// ─────────────────────────────────────────────────────────────────────────────
// LUMBAR CLASSIFICATION (Flexion vs Lordosis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distinguish lumbar flexion from lordosis using shoulder-hip-knee angles.
 * Extended posture → lordosis. Flexed posture → lumbar flexion.
 */
function getLumbarClassification(shoulder, hip, knee) {
  if (!shoulder || !hip || !knee) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const lumbarAngle = angleDeg(shoulder, hip, knee);
  const conf = Math.min(1, (shoulder.visibility ?? 0.5 + hip.visibility ?? 0.5 + knee.visibility ?? 0.5) / 3);

  let label, detail, penalty, severity;

  // Higher angle = more extended (lordosis). Lower angle = more flexed (slouch).
  if (lumbarAngle > 172) {
    // Extended, likely lordosis or sway
    label = "Lumbar lordosis tendency";
    detail = "Upper-to-lower trunk shows extension (backward arch). May indicate anterior pelvic tilt.";
    penalty = 10;
    severity = "mild";
  } else if (lumbarAngle > 165) {
    label = "Neutral lumbar alignment";
    detail = "";
    penalty = 0;
    severity = "good";
  } else if (lumbarAngle > 155) {
    label = "Mild lumbar flexion";
    detail = "Slight slouch/flexion tendency in lower back.";
    penalty = 8;
    severity = "mild";
  } else if (lumbarAngle > 145) {
    label = "Moderate lumbar flexion";
    detail = "Clear forward bend at hip/lumbar level.";
    penalty = 16;
    severity = "moderate";
  } else {
    label = "Lumbar flexion pattern";
    detail = "Significant forward bend; lumbar spine is heavily flexed.";
    penalty = 25;
    severity = "notable";
  }

  return { severity, penalty, label, detail, confidence: conf };
}

// ─────────────────────────────────────────────────────────────────────────────
// PELVIC ALIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect anterior/posterior pelvic shift using hip-to-ankle relationship.
 */
function getPelvicAlignment(hip, ankle, shoulder) {
  if (!hip || !ankle) {
    return { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  }

  const hipAnkleDist = Math.abs(hip.x - ankle.x);
  let ratio = hipAnkleDist;
  if (shoulder && distance(hip, ankle) > 0.01) {
    const bodyHeight = distance(hip, ankle);
    ratio = hipAnkleDist / bodyHeight;
  }

  const conf = Math.min(1, ((hip.visibility ?? 0.5) + (ankle.visibility ?? 0.5)) / 2);

  let label, detail, penalty, severity;
  const t = tier(ratio, 0.04, 0.09, 0.15);

  if (t === "severe") {
    label = "Significant pelvic shift";
    detail = "Hips are clearly displaced from ankle plumb line.";
    penalty = 16;
    severity = "notable";
  } else if (t === "moderate") {
    label = "Moderate pelvic shift";
    detail = "Noticeable hip displacement.";
    penalty = 10;
    severity = "moderate";
  } else if (t === "mild") {
    label = "Mild pelvic lean";
    detail = "Minor hip displacement.";
    penalty = 5;
    severity = "mild";
  } else {
    label = "Neutral pelvic alignment";
    detail = "";
    penalty = 0;
    severity = "good";
  }

  return { severity, penalty, label, detail, confidence: conf };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN POSTURE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function analyzePosture(kl, imgW = 1, imgH = 1.5, debug = false) {
  // Auto-detect best visible side
  let chosenSide, ear, shoulder, hip, knee, ankle;
  try {
    const sidePick = chooseBestSide([
      kl.ear?.visibility ? null : null, // 0-6 unused
      null, null, null, null, null, null,
      kl.ear,      // 7: left ear
      { x: 0, y: 0, visibility: 0 }, // 8: right ear (unused)
      null, null,
      kl.shoulder, // 11: left shoulder
      { x: 0, y: 0, visibility: 0 }, // 12: right shoulder (unused)
      null, null, null, null, null, null, null, null, null, null, null,
      kl.hip,      // 23: left hip
      { x: 0, y: 0, visibility: 0 }, // 24: right hip (unused)
      kl.knee,     // 25: left knee
      { x: 0, y: 0, visibility: 0 }, // 26: right knee (unused)
      kl.ankle,    // 27: left ankle
      { x: 0, y: 0, visibility: 0 }, // 28: right ankle (unused)
    ]);
    // If we got here, use the chosen side
    chosenSide = sidePick.side;
    ear = kl.ear;
    shoulder = kl.shoulder;
    hip = kl.hip;
    knee = kl.knee;
    ankle = kl.ankle;
  } catch (e) {
    // No visible side — return invalid
    return {
      findings: [{
        id: "posture_invalid",
        label: "Invalid pose — no score",
        detail: "Landmarks not clearly visible. Please retake with your full side profile visible.",
        confidence: "low",
        severity: "invalid",
      }],
      overallScore: 0,
      summary: "Could not analyze posture — landmarks insufficient.",
      pattern: "Invalid pose",
      subscores: { headNeck: 0, shoulderThoracic: 0, lumbarPelvis: 0 },
    };
  }

  const findings = [];
  let totalPenalty = 0;
  const penaltyLog = [];

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENT 1: Forward Head
  // ─────────────────────────────────────────────────────────────────────────
  const fhp = getForwardHeadSeverity(ear, shoulder, hip);
  if (fhp.severity !== "invalid") {
    findings.push({
      id: "forward_head",
      label: fhp.label,
      detail: fhp.detail,
      confidence: fhp.confidence >= 0.35 ? "high" : fhp.confidence >= 0.2 ? "moderate" : "low",
      severity: fhp.severity,
    });
    if (fhp.penalty > 0) {
      penaltyLog.push({ id: "forward_head", label: fhp.label, penalty: fhp.penalty });
      totalPenalty += fhp.penalty;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENT 2: Rounded Shoulders
  // ─────────────────────────────────────────────────────────────────────────
  const rsh = getRoundedShouldersSeverity(ear, shoulder, hip);
  if (rsh.severity !== "invalid") {
    findings.push({
      id: "rounded_shoulders",
      label: rsh.label,
      detail: rsh.detail,
      confidence: rsh.confidence >= 0.35 ? "high" : "moderate",
      severity: rsh.severity,
    });
    if (rsh.penalty > 0) {
      penaltyLog.push({ id: "rounded_shoulders", label: rsh.label, penalty: rsh.penalty });
      totalPenalty += rsh.penalty;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENT 3: Thoracic Kyphosis
  // ─────────────────────────────────────────────────────────────────────────
  const thk = getThoracicKyphosis(ear, shoulder, hip);
  if (thk.severity !== "invalid") {
    findings.push({
      id: "thoracic",
      label: thk.label,
      detail: thk.detail,
      confidence: thk.confidence >= 0.4 ? "high" : "moderate",
      severity: thk.severity,
    });
    if (thk.penalty > 0) {
      penaltyLog.push({ id: "thoracic", label: thk.label, penalty: thk.penalty });
      totalPenalty += thk.penalty;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENT 4: Lumbar Classification
  // ─────────────────────────────────────────────────────────────────────────
  let lum = { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  if (hip && knee) {
    lum = getLumbarClassification(shoulder, hip, knee);
    if (lum.severity !== "invalid") {
      findings.push({
        id: "lumbar",
        label: lum.label,
        detail: lum.detail,
        confidence: lum.confidence >= 0.4 ? "high" : "moderate",
        severity: lum.severity,
      });
      if (lum.penalty > 0) {
        penaltyLog.push({ id: "lumbar", label: lum.label, penalty: lum.penalty });
        totalPenalty += lum.penalty;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENT 5: Pelvic Alignment
  // ─────────────────────────────────────────────────────────────────────────
  let pel = { severity: "invalid", penalty: 0, label: "", detail: "", confidence: 0 };
  if (hip && ankle) {
    pel = getPelvicAlignment(hip, ankle, shoulder);
    if (pel.severity !== "invalid") {
      findings.push({
        id: "pelvis",
        label: pel.label,
        detail: pel.detail,
        confidence: pel.confidence >= 0.35 ? "high" : "moderate",
        severity: pel.severity,
      });
      if (pel.penalty > 0) {
        penaltyLog.push({ id: "pelvis", label: pel.label, penalty: pel.penalty });
        totalPenalty += pel.penalty;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REGIONAL SCORES (before final weighting)
  // ─────────────────────────────────────────────────────────────────────────
  const headScore = Math.max(0, Math.min(100,
    fhp.severity === "good" ? 100 : fhp.severity === "mild" ? 88 : fhp.severity === "moderate" ? 80 : 72
  ));

  const shoulderScore = Math.max(0, Math.min(100,
    rsh.severity === "good" && thk.severity === "good" ? 100 :
    rsh.severity === "mild" || thk.severity === "mild" ? 90 :
    rsh.severity === "moderate" || thk.severity === "moderate" ? 78 : 65
  ));

  const lumbarScore = Math.max(0, Math.min(100,
    lum.severity === "invalid" ? 100 : // no data = neutral
    lum.severity === "good" ? 98 :
    lum.severity === "mild" ? 88 :
    lum.severity === "moderate" ? 76 : 65
  ));

  const pelvisScore = Math.max(0, Math.min(100,
    pel.severity === "invalid" ? 100 : // no data = neutral
    pel.severity === "good" ? 98 :
    pel.severity === "mild" ? 88 :
    pel.severity === "moderate" ? 76 : 65
  ));

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL SCORE — weighted regional average
  // ─────────────────────────────────────────────────────────────────────────
  const headWeight     = 0.40;
  const shoulderWeight = 0.25;
  const lumbarWeight   = 0.35;

  let overallScore = Math.round(
    headScore * headWeight +
    shoulderScore * shoulderWeight +
    (lumbarScore + pelvisScore) / 2 * lumbarWeight
  );
  overallScore = Math.max(0, Math.min(100, overallScore));

  // Hard caps based on severity
  const worstSeverity = findings
    .filter((f) => f.severity !== "good" && f.severity !== "invalid")
    .sort((a, b) => ({ notable: 3, moderate: 2, mild: 1, good: 0 }[b.severity] ?? 0) - ({ notable: 3, moderate: 2, mild: 1, good: 0 }[a.severity] ?? 0))[0]?.severity;

  if (worstSeverity === "notable") overallScore = Math.min(overallScore, 72);
  if (worstSeverity === "moderate") overallScore = Math.min(overallScore, 82);

  // ─────────────────────────────────────────────────────────────────────────
  // PATTERN CLASSIFICATION
  // ─────────────────────────────────────────────────────────────────────────
  const activeIssues = findings.filter((f) => f.severity !== "good" && f.severity !== "invalid");
  const issueLabels = activeIssues.map((f) => f.label);

  let pattern;
  if (activeIssues.length === 0) {
    pattern = "Neutral alignment";
  } else if (issueLabels.some((l) => l.includes("forward head"))) {
    pattern = "Forward head posture";
    if (issueLabels.some((l) => l.includes("shoulder"))) pattern += " + rounded shoulders";
  } else if (issueLabels.some((l) => l.includes("kyphosis"))) {
    pattern = "Thoracic kyphosis";
  } else if (issueLabels.some((l) => l.includes("lumbar"))) {
    pattern = issueLabels.find((l) => l.includes("lumbar"));
  } else {
    pattern = activeIssues.length > 1 ? "Mixed pattern" : issueLabels[0];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  const notableCount = activeIssues.filter((f) => f.severity === "notable" || f.severity === "moderate").length;
  let summary;
  if (activeIssues.length === 0) {
    summary = "Excellent posture alignment in this photo. Keep up the good habits.";
  } else if (notableCount >= 2) {
    summary = "Multiple notable postural deviations detected. Consistent daily exercise targeting these areas is key.";
  } else if (notableCount === 1) {
    summary = "One notable postural tendency detected. Your exercises target this pattern.";
  } else {
    summary = "Mild postural tendencies present. Keep up with your daily exercises to improve alignment.";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEBUG
  // ─────────────────────────────────────────────────────────────────────────
  const debugInfo = debug ? {
    chosenSide,
    fhpDebug: {
      earX: ear?.x.toFixed(4),
      shoulderX: shoulder?.x.toFixed(4),
      headOffset: fhp.headOffset?.toFixed(4),
      fhpSeverity: fhp.severity,
      fhpPenalty: fhp.penalty,
    },
    measurements: {
      rshSeverity: rsh.severity,
      thkSeverity: thk.severity,
      lumbarSeverity: lum.severity,
      pelvisSeverity: pel.severity,
    },
    regionalScores: { headScore, shoulderScore, lumbarScore, pelvisScore },
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
      headNeck: headScore,
      shoulderThoracic: shoulderScore,
      lumbarPelvis: Math.round((lumbarScore + pelvisScore) / 2),
    },
    ...(debug ? { debug: debugInfo } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// TREND COMPARISON
// ─────────────────────────────────────────────────────────────────────────
export function compareTrend(currentFindings, previousFindings) {
  if (!previousFindings || previousFindings.length === 0) return null;
  const w = { good: 0, mild: 1, moderate: 2, notable: 3 };
  const score = (f) => f.reduce((s, x) => s + (w[x.severity] ?? 0), 0);
  const delta = score(currentFindings) - score(previousFindings);
  if (delta <= -2) return "Improved compared to last scan";
  if (delta >= 2) return "Increase in postural tendencies vs. last scan";
  return "No major change from last scan";
}