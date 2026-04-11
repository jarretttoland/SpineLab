/**
 * SpineLab — Side-agnostic posture analysis
 *
 * Goals:
 * - Consistent and believable scoring
 * - Mild issues stay mild
 * - Obvious issues are picked up reliably
 * - User-facing regions are simple:
 *   1) Head / Neck
 *   2) Shoulders / Thoracic
 *   3) Lumbar / Pelvis
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function angleDeg(A, B, C) {
  const BAx = A.x - B.x;
  const BAy = A.y - B.y;
  const BCx = C.x - B.x;
  const BCy = C.y - B.y;
  const dot = BAx * BCx + BAy * BCy;
  const mag = Math.sqrt((BAx * BAx + BAy * BAy) * (BCx * BCx + BCy * BCy));
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function distance(A, B) {
  const dx = A.x - B.x;
  const dy = A.y - B.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function toConfidenceLabel(conf) {
  if (conf >= 0.7) return "high";
  if (conf >= 0.45) return "moderate";
  return "low";
}

function chooseBestSide(landmarks) {
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftSho = landmarks[11];
  const rightSho = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const getVis = (pt) => pt?.visibility ?? 0;

  const leftScore = getVis(leftEar) + getVis(leftSho) + getVis(leftHip);
  const rightScore = getVis(rightEar) + getVis(rightSho) + getVis(rightHip);

  if (Math.max(leftScore, rightScore) < 0.5) {
    throw new Error("no_visible_side");
  }

  const side = leftScore >= rightScore ? "left" : "right";
  const ear = side === "left" ? leftEar : rightEar;
  const shoulder = side === "left" ? leftSho : rightSho;
  const hip = side === "left" ? leftHip : rightHip;
  const confidence = (side === "left" ? leftScore : rightScore) / 3;

  return { side, ear, shoulder, hip, confidence };
}

function getForwardHeadAssessment(ear, shoulder, hip) {
  if (!ear || !shoulder) {
    return {
      id: "forward_head",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Forward head not assessed",
      detail: "Ear and shoulder were not both visible enough.",
      confidence: 0,
      metric: null,
    };
  }

  const conf = ((ear.visibility ?? 0.5) + (shoulder.visibility ?? 0.5)) / 2;
  if (conf < 0.3) {
    return {
      id: "forward_head",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Forward head not assessed",
      detail: "Low landmark confidence.",
      confidence: conf,
      metric: null,
    };
  }

  const offset = Math.abs(ear.x - shoulder.x);
  const torsoHeight =
    hip && distance(shoulder, hip) > 0.01 ? distance(shoulder, hip) : 1;

  const normalizedOffset = offset / torsoHeight;

  // Calibrated to be less punitive:
  // < 0.07 = good
  // 0.07–0.11 = mild
  // 0.11–0.16 = moderate
  // > 0.16 = notable
  let severity = "good";
  let label = "Neutral head alignment";
  let detail = "Ear is reasonably aligned over the shoulder.";
  let penalty = 0;
  let score = 96;

  if (normalizedOffset >= 0.16) {
    severity = "notable";
    label = "Notable forward head posture";
    detail = "Head is clearly shifted forward relative to the shoulder.";
    penalty = 18;
    score = 62;
  } else if (normalizedOffset >= 0.11) {
    severity = "moderate";
    label = "Moderate forward head posture";
    detail = "Head position is clearly forward and may increase neck strain.";
    penalty = 10;
    score = 78;
  } else if (normalizedOffset >= 0.07) {
    severity = "mild";
    label = "Mild forward head posture";
    detail = "Slight forward head position is present.";
    penalty = 4;
    score = 88;
  }

  return {
    id: "forward_head",
    severity,
    penalty,
    score,
    label,
    detail,
    confidence: conf,
    metric: normalizedOffset,
  };
}

function getRoundedShouldersAssessment(ear, shoulder, hip) {
  if (!ear || !shoulder) {
    return {
      id: "rounded_shoulders",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Shoulder position not assessed",
      detail: "",
      confidence: 0,
      metric: null,
    };
  }

  const conf = ((ear.visibility ?? 0.5) + (shoulder.visibility ?? 0.5)) / 2;
  if (conf < 0.3) {
    return {
      id: "rounded_shoulders",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Shoulder position not assessed",
      detail: "",
      confidence: conf,
      metric: null,
    };
  }

  const earToShoulderX = Math.abs(ear.x - shoulder.x);
  const torsoHeight =
    hip && distance(shoulder, hip) > 0.01 ? distance(shoulder, hip) : 1;

  const ratio = earToShoulderX / torsoHeight;

  let severity = "good";
  let label = "Neutral shoulder alignment";
  let detail = "";
  let penalty = 0;
  let score = 95;

  if (ratio >= 0.18) {
    severity = "notable";
    label = "Notable rounded shoulders";
    detail = "Shoulders appear clearly protracted forward.";
    penalty = 12;
    score = 66;
  } else if (ratio >= 0.13) {
    severity = "moderate";
    label = "Moderate rounded shoulders";
    detail = "Forward shoulder position is noticeable.";
    penalty = 7;
    score = 80;
  } else if (ratio >= 0.09) {
    severity = "mild";
    label = "Mild rounded shoulders";
    detail = "Slight forward shoulder positioning is present.";
    penalty = 3;
    score = 89;
  }

  return {
    id: "rounded_shoulders",
    severity,
    penalty,
    score,
    label,
    detail,
    confidence: conf,
    metric: ratio,
  };
}

function getThoracicAssessment(ear, shoulder, hip) {
  if (!ear || !shoulder || !hip) {
    return {
      id: "thoracic",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Thoracic posture not assessed",
      detail: "",
      confidence: 0,
      metric: null,
    };
  }

  const conf =
    ((ear.visibility ?? 0.5) +
      (shoulder.visibility ?? 0.5) +
      (hip.visibility ?? 0.5)) /
    3;

  if (conf < 0.3) {
    return {
      id: "thoracic",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Thoracic posture not assessed",
      detail: "",
      confidence: conf,
      metric: null,
    };
  }

  const angle = angleDeg(ear, shoulder, hip);

  let severity = "good";
  let label = "Neutral thoracic alignment";
  let detail = "";
  let penalty = 0;
  let score = 95;

  if (angle < 142) {
    severity = "notable";
    label = "Notable thoracic rounding";
    detail = "Upper back rounding is clearly present.";
    penalty = 12;
    score = 64;
  } else if (angle < 151) {
    severity = "moderate";
    label = "Moderate thoracic rounding";
    detail = "Upper back curve is moderately increased.";
    penalty = 7;
    score = 79;
  } else if (angle < 159) {
    severity = "mild";
    label = "Mild thoracic rounding";
    detail = "Slight upper back rounding is present.";
    penalty = 3;
    score = 89;
  }

  return {
    id: "thoracic",
    severity,
    penalty,
    score,
    label,
    detail,
    confidence: conf,
    metric: angle,
  };
}

function getLumbarAssessment(shoulder, hip, knee) {
  if (!shoulder || !hip || !knee) {
    return {
      id: "lumbar",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Lumbar posture not assessed",
      detail: "",
      confidence: 0,
      metric: null,
    };
  }

  const conf =
    ((shoulder.visibility ?? 0.5) +
      (hip.visibility ?? 0.5) +
      (knee.visibility ?? 0.5)) /
    3;

  if (conf < 0.3) {
    return {
      id: "lumbar",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Lumbar posture not assessed",
      detail: "",
      confidence: conf,
      metric: null,
    };
  }

  const angle = angleDeg(shoulder, hip, knee);

  let severity = "good";
  let label = "Neutral lumbar alignment";
  let detail = "";
  let penalty = 0;
  let score = 95;

  // More conservative / less dramatic:
  if (angle < 145) {
    severity = "notable";
    label = "Notable lumbar flexion pattern";
    detail = "Lower back / hip alignment shows a clear flexion bias.";
    penalty = 12;
    score = 64;
  } else if (angle < 154) {
    severity = "moderate";
    label = "Moderate lumbar flexion";
    detail = "There is a noticeable lower back flexion tendency.";
    penalty = 7;
    score = 79;
  } else if (angle < 162) {
    severity = "mild";
    label = "Mild lumbar flexion";
    detail = "A slight lower back flexion tendency is present.";
    penalty = 3;
    score = 89;
  } else if (angle > 176) {
    severity = "mild";
    label = "Mild lumbar lordosis tendency";
    detail = "A slight extension / arch tendency is present.";
    penalty = 3;
    score = 89;
  }

  return {
    id: "lumbar",
    severity,
    penalty,
    score,
    label,
    detail,
    confidence: conf,
    metric: angle,
  };
}

function getPelvicAssessment(hip, ankle, shoulder) {
  if (!hip || !ankle) {
    return {
      id: "pelvis",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Pelvic alignment not assessed",
      detail: "",
      confidence: 0,
      metric: null,
    };
  }

  const conf = ((hip.visibility ?? 0.5) + (ankle.visibility ?? 0.5)) / 2;
  if (conf < 0.3) {
    return {
      id: "pelvis",
      severity: "invalid",
      penalty: 0,
      score: 0,
      label: "Pelvic alignment not assessed",
      detail: "",
      confidence: conf,
      metric: null,
    };
  }

  const hipAnkleDist = Math.abs(hip.x - ankle.x);
  const bodyHeight =
    shoulder && distance(hip, ankle) > 0.01 ? distance(hip, ankle) : 1;
  const ratio = hipAnkleDist / bodyHeight;

  let severity = "good";
  let label = "Neutral pelvic alignment";
  let detail = "";
  let penalty = 0;
  let score = 95;

  if (ratio >= 0.15) {
    severity = "notable";
    label = "Notable pelvic shift";
    detail = "Hip alignment is clearly displaced relative to the ankle.";
    penalty = 10;
    score = 68;
  } else if (ratio >= 0.10) {
    severity = "moderate";
    label = "Moderate pelvic shift";
    detail = "Hip alignment is noticeably displaced.";
    penalty = 6;
    score = 82;
  } else if (ratio >= 0.06) {
    severity = "mild";
    label = "Mild pelvic shift";
    detail = "A slight hip shift is present.";
    penalty = 3;
    score = 90;
  }

  return {
    id: "pelvis",
    severity,
    penalty,
    score,
    label,
    detail,
    confidence: conf,
    metric: ratio,
  };
}

function severityRank(severity) {
  if (severity === "notable") return 3;
  if (severity === "moderate") return 2;
  if (severity === "mild") return 1;
  return 0;
}

export function analyzePosture(kl, imgW = 1, imgH = 1.5, debug = false) {
  let chosenSide;
  let ear;
  let shoulder;
  let hip;
  let knee;
  let ankle;

  try {
    const sidePick = chooseBestSide([
      null, null, null, null, null, null, null,
      kl.ear,
      { x: 0, y: 0, visibility: 0 },
      null, null,
      kl.shoulder,
      { x: 0, y: 0, visibility: 0 },
      null, null, null, null, null, null, null, null, null, null, null,
      kl.hip,
      { x: 0, y: 0, visibility: 0 },
      kl.knee,
      { x: 0, y: 0, visibility: 0 },
      kl.ankle,
      { x: 0, y: 0, visibility: 0 },
    ]);

    chosenSide = sidePick.side;
    ear = kl.ear;
    shoulder = kl.shoulder;
    hip = kl.hip;
    knee = kl.knee;
    ankle = kl.ankle;
  } catch (_e) {
    return {
      findings: [
        {
          id: "posture_invalid",
          label: "Invalid pose — no score",
          detail:
            "Landmarks were not visible enough. Retake with a clear side profile and better framing.",
          confidence: "low",
          severity: "invalid",
        },
      ],
      overallScore: 0,
      summary: "Could not analyze posture from this image.",
      pattern: "Invalid pose",
      subscores: {
        headNeck: 0,
        shoulderThoracic: 0,
        lumbarPelvis: 0,
      },
    };
  }

  const forwardHead = getForwardHeadAssessment(ear, shoulder, hip);
  const roundedShoulders = getRoundedShouldersAssessment(ear, shoulder, hip);
  const thoracic = getThoracicAssessment(ear, shoulder, hip);
  const lumbar = getLumbarAssessment(shoulder, hip, knee);
  const pelvis = getPelvicAssessment(hip, ankle, shoulder);

  const rawAssessments = [forwardHead, roundedShoulders, thoracic, lumbar, pelvis];

  const findings = rawAssessments
    .filter((a) => a.severity !== "invalid")
    .map((a) => ({
      id: a.id,
      label: a.label,
      detail: a.detail,
      confidence: toConfidenceLabel(a.confidence),
      severity: a.severity,
    }));

  const activeIssues = findings.filter(
    (f) => f.severity !== "good" && f.severity !== "invalid"
  );

  // Region scores
  const headNeck = clamp(forwardHead.severity === "invalid" ? 90 : forwardHead.score, 0, 100);

  const shoulderThoracic = clamp(
    Math.round(
      ((roundedShoulders.severity === "invalid" ? 92 : roundedShoulders.score) +
        (thoracic.severity === "invalid" ? 92 : thoracic.score)) / 2
    ),
    0,
    100
  );

  const lumbarPelvis = clamp(
    Math.round(
      ((lumbar.severity === "invalid" ? 92 : lumbar.score) +
        (pelvis.severity === "invalid" ? 92 : pelvis.score)) / 2
    ),
    0,
    100
  );

  // Final scan score for posture-only use
  let overallScore = Math.round(
    headNeck * 0.38 +
      shoulderThoracic * 0.27 +
      lumbarPelvis * 0.35
  );

  const worstSeverity = activeIssues
    .map((f) => f.severity)
    .sort((a, b) => severityRank(b) - severityRank(a))[0];

  // Keep score believable if there are obvious issues
  if (worstSeverity === "notable") overallScore = Math.min(overallScore, 74);
  else if (worstSeverity === "moderate") overallScore = Math.min(overallScore, 84);

  overallScore = clamp(overallScore, 0, 100);

  let pattern = "Neutral alignment";

  if (activeIssues.length > 0) {
    const ids = activeIssues.map((f) => f.id);

    if (ids.includes("forward_head") && ids.includes("rounded_shoulders")) {
      pattern = "Forward head + rounded shoulders";
    } else if (ids.includes("forward_head")) {
      pattern = "Forward head posture";
    } else if (ids.includes("thoracic")) {
      pattern = "Thoracic rounding";
    } else if (ids.includes("lumbar")) {
      pattern = "Lumbar pattern";
    } else if (ids.includes("pelvis")) {
      pattern = "Pelvic shift pattern";
    } else {
      pattern = "Mixed posture pattern";
    }
  }

  let summary = "Excellent posture alignment in this photo.";

  const notableCount = activeIssues.filter((f) => f.severity === "notable").length;
  const moderateCount = activeIssues.filter((f) => f.severity === "moderate").length;

  if (activeIssues.length === 0) {
    summary = "Excellent posture alignment in this photo.";
  } else if (notableCount >= 2) {
    summary =
      "Multiple clear postural deviations were detected. Consistent practice can improve this over time.";
  } else if (notableCount === 1 || moderateCount >= 2) {
    summary =
      "A meaningful postural tendency was detected. Daily exercises should target this area.";
  } else {
    summary =
      "Mild postural tendencies were detected. These are common and often improve with consistent movement.";
  }

  const debugInfo = debug
    ? {
        chosenSide,
        metrics: {
          forwardHead: forwardHead.metric,
          roundedShoulders: roundedShoulders.metric,
          thoracicAngle: thoracic.metric,
          lumbarAngle: lumbar.metric,
          pelvicShift: pelvis.metric,
        },
        regionalScores: {
          headNeck,
          shoulderThoracic,
          lumbarPelvis,
        },
        rawAssessments,
        overallScore,
      }
    : undefined;

  return {
    findings,
    overallScore,
    summary,
    pattern,
    subscores: {
      headNeck,
      shoulderThoracic,
      lumbarPelvis,
    },
    ...(debug ? { debug: debugInfo } : {}),
  };
}

export function compareTrend(currentFindings, previousFindings) {
  if (!previousFindings || previousFindings.length === 0) return null;

  const scoreSet = (items) =>
    items.reduce((sum, item) => sum + severityRank(item.severity), 0);

  const delta = scoreSet(currentFindings) - scoreSet(previousFindings);

  if (delta <= -2) return "Improved compared to last scan";
  if (delta >= 2) return "Increase in postural tendencies vs. last scan";
  return "No major change from last scan";
}