/**
 * SpineLab Daily System
 * Core data layer: exercise library, progression logic, and plan generation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BREATHING (constant, always first)
// ─────────────────────────────────────────────────────────────────────────────
export const BREATHING_EXERCISE = {
  id: "360_breathing",
  name: "360 Ribcage Breathing",
  category: "breathing",
  durationSecs: 54, // 6 breaths × 9s
  instructions: [
    "Inhale through your nose — expand ribs out, to sides, and back.",
    "Keep chest relaxed. Feel ribcage fill in 3D.",
    "Exhale slowly — ribs come down, lightly brace core.",
  ],
  dosage: "6 breaths · 4s inhale / 5s exhale",
  silhouette: "breathing",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

// Each exercise has easy/moderate/hard variants
const POSTURE_EXERCISES = [
  {
    id: "chin_tuck",
    name: "Cervical Retraction",
    category: "posture",
    silhouette: "chin_tuck",
    baseInstructions: ["Stand or sit tall.", "Pull chin straight back — not down.", "Hold at end range."],
    variants: {
      easy:     { durationSecs: 45, dosage: "10 sec hold × 4 reps" },
      moderate: { durationSecs: 75, dosage: "20 sec hold × 3 reps" },
      hard:     { durationSecs: 105, dosage: "30 sec hold × 3 reps" },
    },
  },
  {
    id: "deep_neck_flexor",
    name: "Deep Neck Flexor Lift",
    category: "posture",
    silhouette: "chin_tuck",
    baseInstructions: ["Lie on your back, knees bent.", "Gently nod chin to chest.", "Lift head 1–2 cm off floor. Hold."],
    variants: {
      easy:     { durationSecs: 45, dosage: "10 sec hold × 4 reps" },
      moderate: { durationSecs: 75, dosage: "20 sec hold × 3 reps" },
      hard:     { durationSecs: 100, dosage: "30 sec hold × 3 reps" },
    },
  },
  {
    id: "wall_slide",
    name: "Wall Slide",
    category: "posture",
    silhouette: "wall_slide",
    baseInstructions: ["Stand with back against wall.", "Arms at 90° with elbows touching wall.", "Slide arms up while keeping contact. Slide back down."],
    variants: {
      easy:     { durationSecs: 50, dosage: "8 reps slow" },
      moderate: { durationSecs: 75, dosage: "12 reps with pause at top" },
      hard:     { durationSecs: 90, dosage: "15 reps, 3 sec pause top" },
    },
  },
  {
    id: "scapular_retraction",
    name: "Scapular Retraction Hold",
    category: "posture",
    silhouette: "shoulder_retraction",
    baseInstructions: ["Stand tall, arms relaxed.", "Squeeze shoulder blades back and slightly down.", "Hold at end range. Release slowly."],
    variants: {
      easy:     { durationSecs: 50, dosage: "10 sec hold × 4 reps" },
      moderate: { durationSecs: 75, dosage: "20 sec hold × 3 reps" },
      hard:     { durationSecs: 100, dosage: "30 sec hold × 3 reps" },
    },
  },
  {
    id: "shoulder_blade_set",
    name: "Shoulder Blade Set + Hold",
    category: "posture",
    silhouette: "shoulder_retraction",
    baseInstructions: ["Stand or sit. Lift chest slightly.", "Gently set shoulder blades down and back.", "Breathe normally while holding."],
    variants: {
      easy:     { durationSecs: 45, dosage: "15 sec hold × 3 reps" },
      moderate: { durationSecs: 70, dosage: "25 sec hold × 3 reps" },
      hard:     { durationSecs: 100, dosage: "35 sec hold × 3 reps" },
    },
  },
  {
    id: "wall_posture_reset",
    name: "Wall Posture Reset",
    category: "posture",
    silhouette: "wall_slide",
    baseInstructions: ["Stand with heels, hips, shoulders, and head against wall.", "Find neutral spine. Hold."],
    variants: {
      easy:     { durationSecs: 45, dosage: "20 sec hold × 2 reps" },
      moderate: { durationSecs: 75, dosage: "30 sec hold × 2 reps" },
      hard:     { durationSecs: 90, dosage: "45 sec hold × 2 reps" },
    },
  },
  {
    id: "standing_alignment",
    name: "Standing Alignment Reset",
    category: "posture",
    silhouette: "standing",
    baseInstructions: ["Stand with feet hip-width apart.", "Stack ankles, hips, shoulders, and ears vertically.", "Soften knees slightly. Hold and breathe."],
    variants: {
      easy:     { durationSecs: 45, dosage: "20 sec × 2" },
      moderate: { durationSecs: 70, dosage: "30 sec × 2" },
      hard:     { durationSecs: 100, dosage: "45 sec × 2" },
    },
  },
  {
    id: "wall_angels",
    name: "Wall Angels",
    category: "posture",
    silhouette: "wall_slide",
    baseInstructions: ["Back against wall, arms at 90°.", "Slowly raise arms overhead while keeping back flat.", "Lower back to start. Move with control."],
    variants: {
      easy:     { durationSecs: 50, dosage: "8 slow reps" },
      moderate: { durationSecs: 75, dosage: "12 reps with 2 sec pause" },
      hard:     { durationSecs: 90, dosage: "15 reps, full control" },
    },
  },
  {
    id: "overhead_reach",
    name: "Overhead Reach with Rib Control",
    category: "posture",
    silhouette: "overhead",
    baseInstructions: ["Stand tall. Brace core lightly.", "Reach one arm overhead without flaring ribs.", "Alternate sides. Keep torso stable."],
    variants: {
      easy:     { durationSecs: 50, dosage: "8 reps each side" },
      moderate: { durationSecs: 70, dosage: "12 reps with slow return" },
      hard:     { durationSecs: 90, dosage: "15 reps, 2 sec hold at top" },
    },
  },
  {
    id: "ext_rotation_hold",
    name: "External Rotation Hold",
    category: "posture",
    silhouette: "shoulder_retraction",
    baseInstructions: ["Elbows at 90°, tucked at sides.", "Rotate forearms outward — palms face up.", "Squeeze shoulder blades. Hold."],
    variants: {
      easy:     { durationSecs: 45, dosage: "10 sec hold × 4" },
      moderate: { durationSecs: 75, dosage: "20 sec hold × 3" },
      hard:     { durationSecs: 100, dosage: "30 sec hold × 3" },
    },
  },
  {
    id: "seated_upright_hold",
    name: "Seated Upright Posture Hold",
    category: "posture",
    silhouette: "seated",
    baseInstructions: ["Sit on edge of chair, feet flat.", "Stack hips, shoulders, ears in vertical line.", "Breathe naturally. Hold neutral spine."],
    variants: {
      easy:     { durationSecs: 45, dosage: "20 sec × 2" },
      moderate: { durationSecs: 70, dosage: "30 sec × 2" },
      hard:     { durationSecs: 100, dosage: "45 sec × 2" },
    },
  },
  {
    id: "tall_spine_breathing",
    name: "Tall Spine Breathing Drill",
    category: "posture",
    silhouette: "breathing",
    baseInstructions: ["Sit or stand tall. Lift crown of head.", "Inhale to expand upper chest and ribs.", "Exhale — maintain height. Don't collapse."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 breaths" },
      moderate: { durationSecs: 75, dosage: "10 breaths with hold" },
      hard:     { durationSecs: 90, dosage: "12 breaths, 3 sec hold" },
    },
  },
  {
    id: "anti_slouch",
    name: "Anti-Slouch Reset",
    category: "posture",
    silhouette: "standing",
    baseInstructions: ["Sit or stand. Deliberately slouch fully.", "Slowly unwind to tall posture.", "Overshoot slightly. Find neutral."],
    variants: {
      easy:     { durationSecs: 45, dosage: "5 full cycles" },
      moderate: { durationSecs: 65, dosage: "8 slow cycles" },
      hard:     { durationSecs: 85, dosage: "10 cycles, 5 sec each" },
    },
  },
  {
    id: "head_retraction_gravity",
    name: "Head Retraction Against Gravity",
    category: "posture",
    silhouette: "chin_tuck",
    baseInstructions: ["Lie on back, no pillow.", "Gently flatten neck to floor (chin tuck).", "Hold position. Breathe normally."],
    variants: {
      easy:     { durationSecs: 50, dosage: "15 sec × 3" },
      moderate: { durationSecs: 75, dosage: "25 sec × 3" },
      hard:     { durationSecs: 100, dosage: "35 sec × 3" },
    },
  },
];

const MOBILITY_EXERCISES = [
  {
    id: "cat_cow",
    name: "Cat-Cow",
    category: "mobility",
    silhouette: "cat_cow",
    baseInstructions: ["On all fours, hands under shoulders, knees under hips.", "Inhale — arch spine, lift head and tailbone (Cow).", "Exhale — round spine, tuck chin and pelvis (Cat). Flow."],
    variants: {
      easy:     { durationSecs: 60, dosage: "10 slow reps" },
      moderate: { durationSecs: 80, dosage: "15 reps with breath sync" },
      hard:     { durationSecs: 100, dosage: "20 reps, 2 sec hold each" },
    },
  },
  {
    id: "thoracic_extension",
    name: "Thoracic Extension",
    category: "mobility",
    silhouette: "thoracic",
    baseInstructions: ["Place foam roller or rolled towel under mid-back.", "Support head with hands. Gently extend over it.", "Hold then shift slightly up/down."],
    variants: {
      easy:     { durationSecs: 60, dosage: "30 sec hold, 2 segments" },
      moderate: { durationSecs: 90, dosage: "45 sec, 3 segments" },
      hard:     { durationSecs: 110, dosage: "60 sec, 3 segments" },
    },
  },
  {
    id: "open_book",
    name: "Open Book Rotation",
    category: "mobility",
    silhouette: "side_lying",
    baseInstructions: ["Lie on side, knees stacked at 90°.", "Stack hands together, arms forward.", "Rotate top arm open — follow with eyes. Return."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 reps each side" },
      moderate: { durationSecs: 80, dosage: "12 reps with 2 sec hold" },
      hard:     { durationSecs: 100, dosage: "15 reps, 3 sec hold" },
    },
  },
  {
    id: "hip_flexor_stretch",
    name: "Half-Kneeling Hip Flexor Stretch",
    category: "mobility",
    silhouette: "lunge",
    baseInstructions: ["Kneel with one knee down, other foot forward.", "Shift hips forward until front of back hip stretches.", "Stay tall. Hold and breathe."],
    variants: {
      easy:     { durationSecs: 60, dosage: "20 sec each side × 2" },
      moderate: { durationSecs: 90, dosage: "30 sec each side × 2" },
      hard:     { durationSecs: 110, dosage: "40 sec each side × 2" },
    },
  },
  {
    id: "hamstring_sweep",
    name: "Hamstring Sweep",
    category: "mobility",
    silhouette: "standing",
    baseInstructions: ["Stand with one foot slightly forward.", "Hinge at hips — reach hands toward floor.", "Keep back flat. Sweep slowly. Return."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 reps each side" },
      moderate: { durationSecs: 80, dosage: "12 reps, 2 sec hold" },
      hard:     { durationSecs: 100, dosage: "15 reps, 3 sec hold" },
    },
  },
  {
    id: "lunge_rotation",
    name: "Lunge Rotation Stretch",
    category: "mobility",
    silhouette: "lunge",
    baseInstructions: ["Step into a lunge position.", "Rotate torso toward front knee.", "Reach top arm to ceiling. Hold. Switch sides."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 reps each side" },
      moderate: { durationSecs: 80, dosage: "12 reps with reach" },
      hard:     { durationSecs: 100, dosage: "15 reps, 3 sec hold" },
    },
  },
  {
    id: "childs_pose",
    name: "Child's Pose with Reach",
    category: "mobility",
    silhouette: "childs_pose",
    baseInstructions: ["Kneel and sit back onto heels.", "Reach arms forward on floor — walk hands out.", "Hold and breathe into your lower back."],
    variants: {
      easy:     { durationSecs: 60, dosage: "30 sec hold × 2" },
      moderate: { durationSecs: 90, dosage: "45 sec hold × 2" },
      hard:     { durationSecs: 110, dosage: "60 sec hold" },
    },
  },
];

const STABILITY_EXERCISES = [
  {
    id: "modified_curl_up",
    name: "Modified Curl-Up Hold",
    category: "stability",
    silhouette: "curl_up",
    baseInstructions: ["Lie on back, one knee bent, one leg flat.", "Hands under lower back to maintain curve.", "Lift head and shoulders slightly. Hold."],
    variants: {
      easy:     { durationSecs: 50, dosage: "10 sec hold × 4" },
      moderate: { durationSecs: 75, dosage: "20 sec hold × 3" },
      hard:     { durationSecs: 100, dosage: "30 sec hold × 3" },
    },
  },
  {
    id: "side_plank",
    name: "Side Plank Hold",
    category: "stability",
    silhouette: "side_plank",
    baseInstructions: ["Lie on side, elbow under shoulder.", "Lift hips off floor — straight line head to feet.", "Hold. Breathe steadily."],
    variants: {
      easy:     { durationSecs: 50, dosage: "15 sec each side × 2" },
      moderate: { durationSecs: 80, dosage: "25 sec each side × 2" },
      hard:     { durationSecs: 110, dosage: "35 sec each side × 2" },
    },
  },
  {
    id: "bird_dog",
    name: "Quadruped Opposite Arm/Leg",
    category: "stability",
    silhouette: "bird_dog",
    baseInstructions: ["On all fours. Brace core lightly.", "Extend opposite arm and leg simultaneously.", "Hold. Lower. Switch sides."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 reps each side" },
      moderate: { durationSecs: 80, dosage: "12 reps with 2 sec hold" },
      hard:     { durationSecs: 100, dosage: "15 reps, 3 sec hold" },
    },
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    category: "stability",
    silhouette: "dead_bug",
    baseInstructions: ["Lie on back. Arms up, knees at 90°.", "Brace core. Lower opposite arm and leg to floor.", "Return. Alternate sides. Keep back flat."],
    variants: {
      easy:     { durationSecs: 60, dosage: "8 reps each side" },
      moderate: { durationSecs: 80, dosage: "12 reps with 3 sec hold" },
      hard:     { durationSecs: 100, dosage: "15 reps, slow control" },
    },
  },
  {
    id: "bridge_hold",
    name: "Bridge Hold",
    category: "stability",
    silhouette: "bridge",
    baseInstructions: ["Lie on back, knees bent, feet flat.", "Press through heels — lift hips until straight.", "Squeeze glutes. Hold. Lower slowly."],
    variants: {
      easy:     { durationSecs: 50, dosage: "15 sec hold × 3" },
      moderate: { durationSecs: 75, dosage: "25 sec hold × 3" },
      hard:     { durationSecs: 100, dosage: "35 sec hold × 3" },
    },
  },
  {
    id: "single_leg_balance",
    name: "Single-Leg Balance Hold",
    category: "stability",
    silhouette: "standing",
    baseInstructions: ["Stand tall near a wall for safety.", "Lift one foot slightly off floor.", "Balance on standing leg. Hold."],
    variants: {
      easy:     { durationSecs: 60, dosage: "15 sec each side × 2" },
      moderate: { durationSecs: 80, dosage: "25 sec each side × 2" },
      hard:     { durationSecs: 100, dosage: "35 sec each side × 2, eyes closed" },
    },
  },
  {
    id: "anti_rotation_brace",
    name: "Standing Anti-Rotation Brace",
    category: "stability",
    silhouette: "standing",
    baseInstructions: ["Stand sideways to a resistance band.", "Hold band at chest height. Don't let torso rotate.", "Maintain neutral spine. Hold."],
    variants: {
      easy:     { durationSecs: 50, dosage: "15 sec each side × 2" },
      moderate: { durationSecs: 75, dosage: "25 sec each side × 2" },
      hard:     { durationSecs: 100, dosage: "35 sec each side × 2" },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEATED MODE (override when restrictions apply)
// ─────────────────────────────────────────────────────────────────────────────
export const SEATED_MODE_EXERCISES = [
  {
    id: "seated_chin_tuck",
    name: "Seated Chin Tuck",
    category: "posture",
    silhouette: "chin_tuck",
    durationSecs: 60,
    instructions: ["Sit tall with feet flat on floor.", "Pull chin straight back — not down.", "Hold 5–10 seconds. Release. Repeat."],
    dosage: "5 sec hold × 8 reps",
  },
  {
    id: "seated_scapular",
    name: "Seated Scapular Retraction",
    category: "posture",
    silhouette: "shoulder_retraction",
    durationSecs: 70,
    instructions: ["Sit upright. Arms relaxed at sides.", "Pull shoulder blades back and slightly down.", "Hold 10–20 seconds. Breathe normally."],
    dosage: "15 sec hold × 4 reps",
  },
  {
    id: "seated_thoracic",
    name: "Seated Thoracic Extension",
    category: "mobility",
    silhouette: "seated_extension",
    durationSecs: 70,
    instructions: ["Sit on edge of chair.", "Place hands behind head, elbows wide.", "Gently lift chest and extend upper back. Keep lower back neutral."],
    dosage: "10 sec hold × 5 reps",
  },
  {
    id: "seated_core_brace",
    name: "Seated Core Brace",
    category: "stability",
    silhouette: "seated_brace",
    durationSecs: 70,
    instructions: ["Sit tall on edge of chair, feet flat.", "Brace core lightly — like bracing for a gentle push.", "Hold 15–20 seconds. Breathe naturally."],
    dosage: "15 sec hold × 4 reps",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 7-DAY ROTATION MAP
// ─────────────────────────────────────────────────────────────────────────────
const DAY_ROTATION = [
  // Day 1
  { posture: [0, 1], mobility: 0, stability: 0 },
  // Day 2
  { posture: [2, 3], mobility: 1, stability: 1 },
  // Day 3
  { posture: [4, 5], mobility: 2, stability: 2 },
  // Day 4
  { posture: [6, 7], mobility: 3, stability: 3 },
  // Day 5
  { posture: [8, 9], mobility: 4, stability: 4 },
  // Day 6
  { posture: [10, 11], mobility: 5, stability: 5 },
  // Day 7
  { posture: [12, 13], mobility: 6, stability: 6 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
export const LEVELS = ["easy", "moderate", "hard"];

/**
 * Resolve the current level from a user's check-in history.
 * Level only increases after completing all 7 days.
 */
export function resolveLevel(checkIns, overrideLevel = null) {
  if (overrideLevel) return overrideLevel;
  const completedDays = checkIns.filter((c) => c.completed).length;
  if (completedDays >= 14) return "hard";
  if (completedDays >= 7) return "moderate";
  return "easy";
}

/**
 * Build an exercise object with the variant for the given level.
 */
function withLevel(exercise, level) {
  const variant = exercise.variants[level] || exercise.variants.easy;
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    silhouette: exercise.silhouette,
    durationSecs: variant.durationSecs,
    instructions: exercise.baseInstructions,
    dosage: variant.dosage,
    level,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PLAN GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if seated mode should be active based on adjustments or profile.
 */
export function isSeatedMode(activeAdjustments = []) {
  const SEATED_TRIGGERS = ["back_surgery", "pain_flare", "no_floor", "seated_only", "shoulder_pain"];
  return activeAdjustments.some((a) => SEATED_TRIGGERS.includes(a));
}

/**
 * Generate today's full plan (breathing + 4 exercises).
 * @param {number} dayIndex - 0-based day index (streak % 7)
 * @param {string} level - "easy" | "moderate" | "hard"
 * @param {boolean} seatedMode
 */
export function generateDailySystemPlan(dayIndex, level, seatedMode = false) {
  if (seatedMode) {
    return [BREATHING_EXERCISE, ...SEATED_MODE_EXERCISES];
  }

  const rotation = DAY_ROTATION[dayIndex % 7];
  const [p1idx, p2idx] = rotation.posture;

  const exercises = [
    BREATHING_EXERCISE,
    withLevel(POSTURE_EXERCISES[p1idx], level),
    withLevel(POSTURE_EXERCISES[p2idx], level),
    withLevel(MOBILITY_EXERCISES[rotation.mobility], level),
    withLevel(STABILITY_EXERCISES[rotation.stability], level),
  ];

  return exercises;
}

/**
 * Get the day index (0–6) for today, based on completed check-ins.
 */
export function getDayIndex(checkIns) {
  const completedCount = checkIns.filter((c) => c.completed).length;
  return completedCount % 7;
}

/**
 * Get the day-of-plan number (1–7) shown in the UI.
 */
export function getDayOfPlan(checkIns) {
  return (getDayIndex(checkIns) % 7) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENSITY ADJUSTMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply intensity adjustment, returns the new level.
 * "lower" → easy (today only, tracked separately)
 * "harder" → moderate then hard (permanent)
 */
export function applyIntensity(currentLevel, direction) {
  const idx = LEVELS.indexOf(currentLevel);
  if (direction === "lower") return "easy";
  if (direction === "harder") return LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
  return currentLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
export function getProgressMessage(streak) {
  if (streak === 0) return "Start your first session today";
  if (streak < 3) return "Consistency building";
  if (streak < 7) return "Posture improving";
  if (streak < 14) return "Strong momentum";
  if (streak < 30) return "Excellent consistency";
  return "Elite posture habits";
}