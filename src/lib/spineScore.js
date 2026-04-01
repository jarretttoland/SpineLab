/**
 * SpineLab — Personalized Spine Score & Archetype Engine
 */

// Archetype definitions
export const ARCHETYPES = {
  nerve: {
    label: "Nerve Irritation Pattern",
    description:
      "Your symptoms suggest nerve involvement — pain or sensations travelling into an arm or leg. This often points to irritation of a spinal nerve root. Your plan will focus on gentle decompression, nerve mobility, and avoiding provocative positions.",
    focus: ["Nerve mobility exercises", "Spinal decompression", "Posture correction to reduce nerve load", "Gradual return to movement"],
  },
  global: {
    label: "Global Spine Dysfunction",
    description:
      "You have pain or tension across multiple spinal regions. This points to whole-chain dysfunction — likely involving the neck, thoracic spine, hips, and core together. Your plan will address the full kinetic chain rather than isolated areas.",
    focus: ["Full-chain mobility (neck to hips)", "Thoracic extension and rotation", "Deep core activation", "Integrated movement patterns"],
  },
  irritable: {
    label: "Irritable / Pain Sensitive",
    description:
      "Your spine appears to be in an irritable state — movement currently aggravates your symptoms. This is common after injury or prolonged strain. Your plan will start gently, reduce provocation, and gradually restore movement tolerance.",
    focus: ["Pain-safe movement patterns", "Breathing and nervous system regulation", "Progressive loading", "Reduce daily aggravators"],
  },
  sedentary: {
    label: "Tight & Sedentary",
    description:
      "Long hours of sitting have created stiffness and tightness across your hips, thoracic spine, and posterior chain. Movement helps you — you just need the right movements done consistently.",
    focus: ["Hip flexor and thoracic mobility", "Posture reset from desk habits", "Core activation", "Movement snacks throughout the day"],
  },
  deconditioned: {
    label: "Deconditioned",
    description:
      "Your spine lacks the muscular support it needs to handle daily demands. Building foundational strength and movement control is your top priority before adding load or intensity.",
    focus: ["Foundation strength and stability", "Safe movement patterns", "Build daily activity habits", "Progressive loading over time"],
  },
  active: {
    label: "Active but Dysfunctional",
    description:
      "You're already active, but something in your movement patterns or structural alignment is causing pain or dysfunction. Your plan will address the gaps in mobility and motor control holding you back.",
    focus: ["Movement quality over quantity", "Targeted mobility work", "Spinal control under load", "Identify and address compensation patterns"],
  },
};

/**
 * Classify user into an archetype based on their answers.
 * Supports primaryPain (string) and painAreas (array) for multi-select.
 */
export function classifyArchetype(answers) {
  const { primaryPain, problemArea, painAreas, movementResponse, sittingHours, activityLevel } = answers;

  // Resolve primary pain — supports both old (problemArea) and new (primaryPain) field names
  const primary = primaryPain || problemArea;
  const allAreas = painAreas || (primary ? [primary] : []);

  // Rule 1: Radiating pain anywhere → nerve
  if (primary === "radiating" || allAreas.includes("radiating")) return "nerve";

  // Rule 2: Multiple distinct regions (not just radiating) → global
  const nonRadiating = allAreas.filter((a) => a !== "radiating");
  if (nonRadiating.length > 1) return "global";

  // Standard single-area rules
  if (movementResponse === "worse") return "irritable";
  if (activityLevel === "very_active") return "active";
  if (activityLevel === "sedentary" && (sittingHours === "6plus" || sittingHours === "3to6")) return "sedentary";
  if (activityLevel === "sedentary") return "deconditioned";
  if (sittingHours === "6plus") return "sedentary";
  return "deconditioned";
}

/**
 * Calculate overall spine score out of 100.
 * Supports primaryPain + secondaryPain (multi-select) or legacy problemArea.
 */
export function calculateSpineScore(answers, postureFindings = []) {
  const { primaryPain, problemArea, secondaryPain = [], movementResponse, sittingHours, activityLevel, ageRange } = answers;

  const primary = primaryPain || problemArea;
  let score = 72; // baseline

  // Primary pain — full weight
  if (primary === "radiating") score -= 18;
  else if (primary === "low_back") score -= 8;
  else if (primary === "mid_back") score -= 6;
  else if (primary === "neck") score -= 5;

  // Secondary pain — 30% weight each
  secondaryPain.forEach((area) => {
    if (area === "radiating") score -= Math.round(18 * 0.3);
    else if (area === "low_back") score -= Math.round(8 * 0.3);
    else if (area === "mid_back") score -= Math.round(6 * 0.3);
    else if (area === "neck") score -= Math.round(5 * 0.3);
  });

  // Multiple regions penalty
  const allAreas = [primary, ...secondaryPain].filter(Boolean);
  if (allAreas.length > 1) score -= 4;

  // Movement response modifier
  if (movementResponse === "worse") score -= 14;
  else if (movementResponse === "stiff_then_better") score -= 4;
  else if (movementResponse === "better") score += 4;

  // Sitting time modifier
  if (sittingHours === "6plus") score -= 10;
  else if (sittingHours === "3to6") score -= 5;
  else if (sittingHours === "under3") score += 3;

  // Activity modifier
  if (activityLevel === "sedentary") score -= 8;
  else if (activityLevel === "very_active") score += 5;
  else score += 1;

  // Age modifier
  if (ageRange === "55plus") score -= 7;
  else if (ageRange === "40to55") score -= 4;
  else if (ageRange === "under25") score += 3;

  // Posture findings deductions
  if (postureFindings.includes("forward_head")) score -= 5;
  if (postureFindings.includes("rounded_shoulders")) score -= 4;
  if (postureFindings.includes("anterior_pelvic_tilt")) score -= 4;

  return Math.max(18, Math.min(96, Math.round(score)));
}

/**
 * Calculate sub-scores for Mobility, Strength/Stability, Posture
 */
export function calculateBreakdown(answers, postureFindings = []) {
  const { movementResponse, sittingHours, activityLevel, ageRange } = answers;

  // Mobility score
  let mobility = 68;
  if (movementResponse === "worse") mobility -= 20;
  else if (movementResponse === "stiff_then_better") mobility -= 8;
  else if (movementResponse === "better") mobility += 8;
  if (sittingHours === "6plus") mobility -= 10;
  else if (sittingHours === "3to6") mobility -= 5;
  if (ageRange === "55plus") mobility -= 8;
  else if (ageRange === "40to55") mobility -= 4;

  // Strength / Stability score
  let strength = 65;
  if (activityLevel === "very_active") strength += 15;
  else if (activityLevel === "moderate") strength += 5;
  else if (activityLevel === "sedentary") strength -= 12;
  if (ageRange === "55plus") strength -= 6;

  // Posture score
  let posture = 70;
  if (sittingHours === "6plus") posture -= 12;
  else if (sittingHours === "3to6") posture -= 6;
  if (postureFindings.includes("forward_head")) posture -= 12;
  if (postureFindings.includes("rounded_shoulders")) posture -= 10;
  if (postureFindings.includes("anterior_pelvic_tilt")) posture -= 8;

  return {
    mobility: Math.max(15, Math.min(95, Math.round(mobility))),
    strength: Math.max(15, Math.min(95, Math.round(strength))),
    posture: Math.max(15, Math.min(95, Math.round(posture))),
  };
}

/**
 * Generate plan focus areas based on archetype, answers, and goals.
 * Supports primaryGoal + secondaryGoals (multi-select) or legacy goal field.
 */
export function generatePlanFocus(archetypeKey, answers, postureFindings = []) {
  const { primaryGoal, secondaryGoals = [], goal, sittingHours, ageRange, secondaryPain = [] } = answers;

  const mainGoal = primaryGoal || goal;
  const archetype = ARCHETYPES[archetypeKey];
  const focus = [...archetype.focus];

  // Primary goal — drives main structure
  if (mainGoal === "pain_relief") {
    focus.unshift("Daily pain management techniques");
  } else if (mainGoal === "better_posture") {
    focus.unshift("Chin tuck and scapular correction protocol");
  } else if (mainGoal === "performance") {
    focus.push("Strength progression and loaded movement");
  }

  // Secondary goals — modify exercise selection
  secondaryGoals.forEach((g) => {
    if (g === "pain_relief" && mainGoal !== "pain_relief") focus.splice(2, 0, "Pain management support work");
    if (g === "better_posture" && mainGoal !== "better_posture") focus.splice(2, 0, "Postural awareness drills");
    if (g === "performance" && mainGoal !== "performance") focus.push("Supplemental strength work");
  });

  // Secondary pain — add supporting work
  secondaryPain.forEach((area) => {
    if (area === "neck") focus.push("Cervical mobility and deep neck flexor work");
    else if (area === "mid_back") focus.push("Thoracic mobility and rib cage expansion");
    else if (area === "low_back") focus.push("Lumbar stabilisation and hip hinge patterning");
    else if (area === "radiating") focus.push("Nerve tensioner and decompression work");
  });

  // Sitting modifier
  if (sittingHours === "6plus") {
    if (!focus.includes("Hip flexor and thoracic mobility")) {
      focus.splice(1, 0, "Hip flexor and thoracic mobility");
    }
  }

  // Posture findings
  if (postureFindings.includes("forward_head")) {
    focus.splice(1, 0, "Forward head posture correction");
  }

  // Age modifier
  if (ageRange === "55plus" || ageRange === "40to55") {
    focus.push("Low-impact joint-friendly progressions");
  }

  return [...new Set(focus)].slice(0, 6);
}