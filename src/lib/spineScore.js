/**
 * SpineLab — Scoring + Archetype Engine
 *
 * New architecture:
 * - Structural Score: slow-moving baseline from questionnaire + scan updates
 * - Consistency Score: fast-moving score from daily routine adherence
 * - Final Spine Score: blended score shown to the user
 */

// ── Archetypes ────────────────────────────────────────────────────────────────
export const ARCHETYPES = {
  nerve: {
    label: "Nerve Irritation Pattern",
    description:
      "Your symptoms suggest nerve involvement — pain or sensations travelling into an arm or leg. Your plan will focus on decompression, nerve mobility, and avoiding provocative positions.",
    focus: [
      "Nerve mobility exercises",
      "Spinal decompression",
      "Posture correction to reduce nerve load",
      "Gradual return to movement",
    ],
  },
  global: {
    label: "Global Spine Dysfunction",
    description:
      "You have pain or tension across multiple spinal regions. Your plan will address the full kinetic chain rather than isolated areas.",
    focus: [
      "Full-chain mobility (neck to hips)",
      "Thoracic extension and rotation",
      "Deep core activation",
      "Integrated movement patterns",
    ],
  },
  irritable: {
    label: "Irritable / Pain Sensitive",
    description:
      "Your spine appears to be in an irritable state. Your plan will start gently, reduce provocation, and gradually restore movement tolerance.",
    focus: [
      "Pain-safe movement patterns",
      "Breathing and nervous system regulation",
      "Progressive loading",
      "Reduce daily aggravators",
    ],
  },
  sedentary: {
    label: "Tight & Sedentary",
    description:
      "Long hours of sitting have likely created stiffness and tightness. Your plan will focus on mobility, posture reset, and consistent movement.",
    focus: [
      "Hip flexor and thoracic mobility",
      "Posture reset from desk habits",
      "Core activation",
      "Movement snacks throughout the day",
    ],
  },
  deconditioned: {
    label: "Deconditioned",
    description:
      "Your spine likely lacks the muscular support it needs to handle daily demands. Your plan will focus on foundational strength and movement control.",
    focus: [
      "Foundation strength and stability",
      "Safe movement patterns",
      "Build daily activity habits",
      "Progressive loading over time",
    ],
  },
  active: {
    label: "Active but Dysfunctional",
    description:
      "You're already active, but movement quality or alignment issues may be holding you back. Your plan will focus on control, mobility, and cleaner mechanics.",
    focus: [
      "Movement quality over quantity",
      "Targeted mobility work",
      "Spinal control under load",
      "Identify and address compensation patterns",
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizePostureFindings(postureFindings = []) {
  if (!Array.isArray(postureFindings)) return [];

  return postureFindings.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item?.id) return item.id;
    if (typeof item === "object" && item?.label) return item.label;
    return "";
  });
}

// ── Archetype classification ─────────────────────────────────────────────────
export function classifyArchetype(answers) {
  const {
    primaryPain,
    problemArea,
    painAreas,
    movementResponse,
    sittingHours,
    activityLevel,
  } = answers || {};

  const primary = primaryPain || problemArea || null;
  const allAreas = Array.isArray(painAreas)
    ? painAreas
    : primary
    ? [primary]
    : [];

  if (primary === "radiating" || allAreas.includes("radiating")) return "nerve";

  const nonRadiating = allAreas.filter((a) => a !== "radiating");
  if (nonRadiating.length > 1) return "global";

  if (movementResponse === "worse") return "irritable";
  if (activityLevel === "very_active") return "active";
  if (
    activityLevel === "sedentary" &&
    (sittingHours === "6plus" || sittingHours === "3to6")
  ) {
    return "sedentary";
  }
  if (activityLevel === "sedentary") return "deconditioned";
  if (sittingHours === "6plus") return "sedentary";

  return "deconditioned";
}

// ── Structural baseline from questionnaire ───────────────────────────────────
export function calculateStructuralBaseline(answers, postureFindings = []) {
  const {
    primaryPain,
    problemArea,
    secondaryPain = [],
    movementResponse,
    sittingHours,
    activityLevel,
    ageRange,
  } = answers || {};

  const normalizedFindings = normalizePostureFindings(postureFindings);
  const primary = primaryPain || problemArea || null;

  let score = 72;

  // Primary pain
  if (primary === "radiating") score -= 18;
  else if (primary === "low_back") score -= 8;
  else if (primary === "mid_back") score -= 6;
  else if (primary === "neck") score -= 5;

  // Secondary pain gets lighter weight
  (secondaryPain || []).forEach((area) => {
    if (area === "radiating") score -= 5;
    else if (area === "low_back") score -= 2;
    else if (area === "mid_back") score -= 2;
    else if (area === "neck") score -= 1;
  });

  // Multiple region penalty
  const allAreas = [primary, ...(secondaryPain || [])].filter(Boolean);
  if (allAreas.length > 1) score -= 4;

  // Movement response
  if (movementResponse === "worse") score -= 12;
  else if (movementResponse === "stiff_then_better") score -= 4;
  else if (movementResponse === "better") score += 4;

  // Sitting
  if (sittingHours === "6plus") score -= 8;
  else if (sittingHours === "3to6") score -= 4;
  else if (sittingHours === "under3") score += 3;

  // Activity
  if (activityLevel === "sedentary") score -= 8;
  else if (activityLevel === "moderate") score += 1;
  else if (activityLevel === "very_active") score += 5;

  // Age
  if (ageRange === "55plus") score -= 5;
  else if (ageRange === "40to55") score -= 3;
  else if (ageRange === "under25") score += 2;

  // Optional posture findings can slightly shape baseline
  if (normalizedFindings.includes("forward_head")) score -= 3;
  if (normalizedFindings.includes("rounded_shoulders")) score -= 3;
  if (normalizedFindings.includes("anterior_pelvic_tilt")) score -= 3;

  return clamp(score, 30, 95);
}

// Backward-compatible alias for older code
export function calculateSpineScore(answers, postureFindings = []) {
  return calculateStructuralBaseline(answers, postureFindings);
}

// ── Consistency score ────────────────────────────────────────────────────────
export function getInitialConsistencyScore() {
  return 50;
}

export function updateConsistencyScore(currentScore = 50, completedToday = true) {
  let next = currentScore ?? 50;
  next += completedToday ? 2 : -1;
  return clamp(next, 0, 100);
}

export function applyStreakBonus(consistencyScore = 50, streak = 0) {
  let bonus = 0;

  if (streak >= 14) bonus = 8;
  else if (streak >= 7) bonus = 5;
  else if (streak >= 3) bonus = 3;

  return clamp(consistencyScore + bonus, 0, 100);
}

// ── Structural score updates from scans ──────────────────────────────────────
export function applyScanToStructural(currentStructural = 50, scanScore = 50) {
  const blended = currentStructural + (scanScore - currentStructural) * 0.25;
  return clamp(blended, 0, 100);
}

// Optional weekly momentum bonus for strong adherence
export function applyWeeklyMomentum(structuralScore = 50, completedDays = 0) {
  let bonus = 0;

  if (completedDays >= 7) bonus = 6;
  else if (completedDays >= 5) bonus = 4;
  else if (completedDays >= 4) bonus = 3;

  return clamp(structuralScore + bonus, 0, 100);
}

// ── Final score shown to user ────────────────────────────────────────────────
export function calculateFinalSpineScore(structuralScore = 50, consistencyScore = 50) {
  const finalScore = structuralScore * 0.7 + consistencyScore * 0.3;
  return clamp(finalScore, 0, 100);
}

// ── Breakdown shown in onboarding / dashboard ────────────────────────────────
export function calculateBreakdown(answers, postureFindings = []) {
  const { movementResponse, sittingHours, activityLevel, ageRange } = answers || {};
  const normalizedFindings = normalizePostureFindings(postureFindings);

  let mobility = 68;
  if (movementResponse === "worse") mobility -= 20;
  else if (movementResponse === "stiff_then_better") mobility -= 8;
  else if (movementResponse === "better") mobility += 8;

  if (sittingHours === "6plus") mobility -= 10;
  else if (sittingHours === "3to6") mobility -= 5;

  if (ageRange === "55plus") mobility -= 8;
  else if (ageRange === "40to55") mobility -= 4;

  let strength = 65;
  if (activityLevel === "very_active") strength += 15;
  else if (activityLevel === "moderate") strength += 5;
  else if (activityLevel === "sedentary") strength -= 12;

  if (ageRange === "55plus") strength -= 6;

  let posture = 70;
  if (sittingHours === "6plus") posture -= 12;
  else if (sittingHours === "3to6") posture -= 6;

  if (normalizedFindings.includes("forward_head")) posture -= 12;
  if (normalizedFindings.includes("rounded_shoulders")) posture -= 10;
  if (normalizedFindings.includes("anterior_pelvic_tilt")) posture -= 8;

  return {
    mobility: clamp(mobility, 15, 95),
    strength: clamp(strength, 15, 95),
    posture: clamp(posture, 15, 95),
  };
}

// ── Plan focus generation ────────────────────────────────────────────────────
export function generatePlanFocus(archetypeKey, answers, postureFindings = []) {
  const {
    primaryGoal,
    secondaryGoals = [],
    goal,
    sittingHours,
    ageRange,
    secondaryPain = [],
  } = answers || {};

  const normalizedFindings = normalizePostureFindings(postureFindings);
  const mainGoal = primaryGoal || goal || null;
  const archetype = ARCHETYPES[archetypeKey] || ARCHETYPES.deconditioned;
  const focus = [...archetype.focus];

  if (mainGoal === "pain_relief") {
    focus.unshift("Daily pain management techniques");
  } else if (mainGoal === "better_posture") {
    focus.unshift("Chin tuck and scapular correction protocol");
  } else if (mainGoal === "performance") {
    focus.push("Strength progression and loaded movement");
  }

  (secondaryGoals || []).forEach((g) => {
    if (g === "pain_relief" && mainGoal !== "pain_relief") {
      focus.splice(2, 0, "Pain management support work");
    }
    if (g === "better_posture" && mainGoal !== "better_posture") {
      focus.splice(2, 0, "Postural awareness drills");
    }
    if (g === "performance" && mainGoal !== "performance") {
      focus.push("Supplemental strength work");
    }
  });

  (secondaryPain || []).forEach((area) => {
    if (area === "neck") focus.push("Cervical mobility and deep neck flexor work");
    else if (area === "mid_back") focus.push("Thoracic mobility and rib cage expansion");
    else if (area === "low_back") focus.push("Lumbar stabilisation and hip hinge patterning");
    else if (area === "radiating") focus.push("Nerve tensioner and decompression work");
  });

  if (sittingHours === "6plus") {
    if (!focus.includes("Hip flexor and thoracic mobility")) {
      focus.splice(1, 0, "Hip flexor and thoracic mobility");
    }
  }

  if (normalizedFindings.includes("forward_head")) {
    focus.splice(1, 0, "Forward head posture correction");
  }

  if (ageRange === "55plus" || ageRange === "40to55") {
    focus.push("Low-impact joint-friendly progressions");
  }

  return [...new Set(focus)].slice(0, 6);
}