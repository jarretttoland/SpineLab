/**
 * Smart Plan Adaptor — v2
 * Per-exercise swaps that ALWAYS find a replacement.
 * Fallback chain: same category + same pool → same category any → closest target area → any in pool.
 */
import { EXERCISE_LIBRARY } from "./exerciseLibrary";

const byId = Object.fromEntries(EXERCISE_LIBRARY.map((e) => [e.id, e]));

// ── Exercise attribute tags ────────────────────────────────────────────────────
// Floor-required exercises (cannot do without getting on the ground)
const FLOOR_REQUIRED_IDS = new Set([
  "cat-cow", "glute-bridge", "bird-dog", "dead-bug", "plank",
  "shoulder-t-raise", "piriformis-stretch", "childs-pose",
  "thread-needle", "supine-twist", "hip-90-90", "hip-flexor-stretch",
]);

// Chair / seated safe — can be done sitting or standing
const CHAIR_SAFE_IDS = new Set([
  "chin-tuck", "shoulder-blade-squeeze", "thoracic-extension",
  "seated-spinal-rotation", "neck-circles", "upper-trap-stretch",
  "forward-head-correction", "chest-opener", "wall-angel", "wall-sit",
]);

// Difficulty order for upgrade / downgrade
const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

// ── Pool definitions (used for plan-level adjustments) ────────────────────────
const POOLS = {
  gentle: EXERCISE_LIBRARY.filter((e) => e.difficulty === "easy"),
  advanced: EXERCISE_LIBRARY.filter((e) => e.difficulty === "medium" || e.difficulty === "hard"),
  chair: EXERCISE_LIBRARY.filter((e) => CHAIR_SAFE_IDS.has(e.id)),
  no_floor: EXERCISE_LIBRARY.filter((e) => !FLOOR_REQUIRED_IDS.has(e.id)),
  limited_shoulder: EXERCISE_LIBRARY.filter(
    (e) => !e.targetAreas?.includes("shoulders") || e.difficulty === "easy"
  ),
};

// ── Core replacement finder ────────────────────────────────────────────────────
/**
 * Find the best replacement for `exercise` from `pool`.
 * Fallback chain (each step excludes the current exercise):
 *   1. Same category + overlapping targetAreas
 *   2. Same category, any
 *   3. Overlapping targetAreas, any category
 *   4. Any exercise in pool
 * Returns null only if pool is completely empty.
 */
function findReplacement(exercise, pool) {
  const exclude = exercise.id;
  const candidates = pool.filter((e) => e.id !== exclude);
  if (candidates.length === 0) return null;

  const sharesTarget = (e) =>
    e.targetAreas?.some((t) => exercise.targetAreas?.includes(t));

  // 1. Same category + shared target area
  const best = candidates.filter(
    (e) => e.category === exercise.category && sharesTarget(e)
  );
  if (best.length > 0) return best[0];

  // 2. Same category, any
  const sameCategory = candidates.filter((e) => e.category === exercise.category);
  if (sameCategory.length > 0) return sameCategory[0];

  // 3. Shared target area, any category
  const sameTarget = candidates.filter(sharesTarget);
  if (sameTarget.length > 0) return sameTarget[0];

  // 4. Anything in the pool
  return candidates[0];
}

// ── Per-exercise feedback swap ─────────────────────────────────────────────────
/**
 * Returns { exercise, message, success }
 * success=false means no suitable swap was found.
 */
export function applyExerciseFeedback(exercise, feedbackId) {
  let pool;
  let upgrading = false;

  switch (feedbackId) {
    case "too_hard":
      pool = EXERCISE_LIBRARY.filter(
        (e) => DIFFICULTY_ORDER[e.difficulty] < DIFFICULTY_ORDER[exercise.difficulty]
          || e.difficulty === "easy"
      );
      break;
    case "painful":
      pool = POOLS.gentle;
      break;
    case "too_easy":
      upgrading = true;
      pool = EXERCISE_LIBRARY.filter(
        (e) => DIFFICULTY_ORDER[e.difficulty] > DIFFICULTY_ORDER[exercise.difficulty]
          || e.difficulty === "medium"
      );
      break;
    case "seated":
      pool = POOLS.chair;
      break;
    default:
      return { exercise, message: "Unknown feedback option.", success: false };
  }

  console.log("[PlanAdaptor] Feedback:", feedbackId, "| Original:", exercise.id, "| Pool size:", pool.length);

  const replacement = findReplacement(exercise, pool);

  console.log("[PlanAdaptor] Replacement chosen:", replacement?.id ?? "NONE");

  if (!replacement) {
    return {
      exercise,
      message: "We could not find a suitable variation yet. Please try another option.",
      success: false,
    };
  }

  const messages = {
    too_hard: "We adjusted this exercise to a gentler version.",
    painful:  "We swapped this for a safer, pain-friendly alternative.",
    too_easy: "We upgraded this exercise to a more challenging version.",
    seated:   "We swapped this for a seated option.",
  };

  return { exercise: replacement, message: messages[feedbackId], success: true };
}

// ── Plan-level adjustment ─────────────────────────────────────────────────────
export const PLAN_ADJUSTMENTS = [
  {
    id: "surgery",
    label: "I had surgery",
    emoji: "🏥",
    description: "Recent or past surgery",
    mode: "gentle",
    message: "Your plan has been adjusted for a gentle, post-surgery safe session today.",
  },
  {
    id: "older",
    label: "I need gentler exercises",
    emoji: "🌿",
    description: "Older or prefer lower intensity",
    mode: "gentle",
    message: "Your plan has been adjusted for a gentler, low-impact session today.",
  },
  {
    id: "pain_flare",
    label: "I am having a pain flare",
    emoji: "🔥",
    description: "Higher pain than usual today",
    mode: "gentle",
    message: "Your plan has been adjusted for a careful, pain-aware session. Stop if anything worsens.",
  },
  {
    id: "chair_only",
    label: "I can only do seated exercises",
    emoji: "🪑",
    description: "Chair-based only",
    mode: "chair",
    message: "Your plan has been updated to chair-based exercises only.",
  },
  {
    id: "no_floor",
    label: "I cannot get on the floor",
    emoji: "🚫",
    description: "Standing or seated only",
    mode: "no_floor",
    message: "Your plan now avoids any floor-based exercises.",
  },
  {
    id: "limited_shoulder",
    label: "I have limited shoulder mobility",
    emoji: "💪",
    description: "Shoulder range restricted",
    mode: "limited_shoulder",
    message: "Your plan has been updated to avoid exercises requiring full shoulder range.",
  },
  {
    id: "too_easy",
    label: "This is too easy",
    emoji: "⚡",
    description: "Ready for more challenge",
    mode: "advanced",
    message: "We've upgraded your plan to a more challenging level. Push yourself — but stay controlled.",
  },
];

/**
 * Apply a plan-level mode across all exercises.
 * Returns { plan, message, anyChanged }
 */
export function applyPlanAdjustment(currentPlan, adjustmentId) {
  const adj = PLAN_ADJUSTMENTS.find((a) => a.id === adjustmentId);
  if (!adj) return { plan: currentPlan, message: "Unknown adjustment.", anyChanged: false };

  const pool = POOLS[adj.mode] || POOLS.gentle;

  console.log("[PlanAdaptor] Plan adjustment:", adjustmentId, "| Mode:", adj.mode, "| Pool size:", pool.length);

  let anyChanged = false;
  const newPlan = currentPlan.map((ex) => {
    const replacement = findReplacement(ex, pool);
    console.log("[PlanAdaptor] ", ex.id, "→", replacement?.id ?? "NO REPLACEMENT (kept)");
    if (replacement && replacement.id !== ex.id) {
      anyChanged = true;
      return replacement;
    }
    return ex;
  });

  return { plan: newPlan, message: adj.message, anyChanged };
}

// Per-exercise quick feedback options (for ExerciseCard buttons)
export const EXERCISE_FEEDBACK = [
  { id: "too_hard", label: "Too hard",     emoji: "😰" },
  { id: "too_easy", label: "Too easy",     emoji: "⚡" },
  { id: "painful",  label: "Painful",      emoji: "🛑" },
  { id: "seated",   label: "Need seated",  emoji: "🪑" },
];