/**
 * SpineLab Exercise Library
 * Each exercise tagged with: category, targetAreas, difficulty, painFocus
 */

export const CATEGORIES = {
  posture_reset: { label: "Posture Reset", color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"    },
  mobility:      { label: "Mobility",       color: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  strength:      { label: "Strength",       color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  stretching:    { label: "Stretching",     color: "bg-amber-100 text-amber-700",  dot: "bg-amber-500"  },
};

// target areas: cervical | thoracic | lumbar | hips | shoulders
// painFocus: which user pain areas this is ideal for (neck | mid_back | low_back | radiating)
// sittingFocus: true = prioritize for high-sitting-hour users

export const EXERCISE_LIBRARY = [
  // ── POSTURE RESET ──────────────────────────────────────────────────────────
  {
    id: "chin-tuck",
    name: "Chin Tucks",
    category: "posture_reset",
    targetAreas: ["cervical"],
    difficulty: "easy",
    painFocus: ["neck", "radiating"],
    sittingFocus: false,
    benefit: "Corrects forward head posture",
    dosage: "10 reps × 2 sets",
    duration: "2 min",
    description: "Pull your chin straight back, creating a double chin. Hold for 5 seconds. Keep eyes level throughout.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/ab032331f_generated_image.png",
    silhouette: "chin-tuck",
    tier: "free",
  },
  {
    id: "wall-angel",
    name: "Wall Angels",
    category: "posture_reset",
    targetAreas: ["thoracic", "shoulders"],
    difficulty: "easy",
    painFocus: ["mid_back", "neck"],
    sittingFocus: true,
    benefit: "Opens chest, fixes rounded shoulders",
    dosage: "12 reps × 2 sets",
    duration: "2 min",
    description: "Stand with back against a wall. Slide arms up and down while keeping full contact with the wall at all times.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1322fff58_generated_image.png",
    silhouette: "wall-angel",
    tier: "free",
  },
  {
    id: "shoulder-blade-squeeze",
    name: "Shoulder Blade Squeeze",
    category: "posture_reset",
    targetAreas: ["thoracic", "shoulders"],
    difficulty: "easy",
    painFocus: ["mid_back", "neck"],
    sittingFocus: true,
    benefit: "Activates postural muscles of the upper back",
    dosage: "15 reps × 2 sets",
    duration: "2 min",
    description: "Sit or stand tall. Squeeze your shoulder blades together as if holding a pencil between them. Hold 5 sec, release.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1322fff58_generated_image.png",
    silhouette: "shoulder-squeeze",
    tier: "free",
  },
  {
    id: "chest-opener",
    name: "Doorway Chest Opener",
    category: "posture_reset",
    targetAreas: ["shoulders", "thoracic"],
    difficulty: "easy",
    painFocus: ["mid_back", "neck"],
    sittingFocus: true,
    benefit: "Stretches tight pec muscles from prolonged sitting",
    dosage: "30 sec × 3 holds",
    duration: "3 min",
    description: "Stand in a doorway with arms at 90°. Step one foot forward and gently lean into the stretch. Breathe deeply.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1322fff58_generated_image.png",
    silhouette: "chest-opener",
    tier: "pro",
  },
  {
    id: "forward-head-correction",
    name: "Neck Retraction",
    category: "posture_reset",
    targetAreas: ["cervical"],
    difficulty: "easy",
    painFocus: ["neck", "radiating"],
    sittingFocus: false,
    benefit: "Reduces strain from forward head syndrome",
    dosage: "10 reps × 3 sets",
    duration: "2 min",
    description: "Sit upright. Without tilting your head, slide it directly backward. Feel the stretch at the base of your skull.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/ab032331f_generated_image.png",
    silhouette: "chin-tuck",
    tier: "pro",
  },

  // ── MOBILITY ───────────────────────────────────────────────────────────────
  {
    id: "cat-cow",
    name: "Cat-Cow",
    category: "mobility",
    targetAreas: ["thoracic", "lumbar"],
    difficulty: "easy",
    painFocus: ["mid_back", "low_back"],
    sittingFocus: true,
    benefit: "Mobilizes the entire spine",
    dosage: "10 cycles × 1 set",
    duration: "3 min",
    description: "On hands and knees, alternate between rounding your back (cat) and arching it down (cow). Move slowly and breathe.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/6cdc933a7_generated_image.png",
    silhouette: "cat-cow",
    tier: "free",
  },
  {
    id: "thoracic-extension",
    name: "Thoracic Extension",
    category: "mobility",
    targetAreas: ["thoracic"],
    difficulty: "easy",
    painFocus: ["mid_back"],
    sittingFocus: true,
    benefit: "Reverses thoracic stiffness from desk work",
    dosage: "8 reps × 2 sets",
    duration: "3 min",
    description: "Sit in a chair with hands behind your head. Gently extend your upper back over the backrest. Open your chest upward.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/32ff77f97_generated_image.png",
    silhouette: "thoracic-extension",
    tier: "free",
  },
  {
    id: "seated-spinal-rotation",
    name: "Seated Spinal Rotation",
    category: "mobility",
    targetAreas: ["thoracic", "lumbar"],
    difficulty: "easy",
    painFocus: ["mid_back", "low_back"],
    sittingFocus: true,
    benefit: "Improves rotational mobility in the spine",
    dosage: "10 reps each side",
    duration: "2 min",
    description: "Sit tall in a chair. Cross arms over chest and rotate your torso left and right slowly. Keep hips square.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/32ff77f97_generated_image.png",
    silhouette: "spinal-rotation",
    tier: "free",
  },
  {
    id: "hip-90-90",
    name: "90/90 Hip Mobility",
    category: "mobility",
    targetAreas: ["hips", "lumbar"],
    difficulty: "medium",
    painFocus: ["low_back", "radiating"],
    sittingFocus: true,
    benefit: "Unlocks tight hip rotators",
    dosage: "60 sec each side",
    duration: "3 min",
    description: "Sit on the floor with both legs at 90°. Keep torso upright and lean gently over the front shin. Switch sides.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
    silhouette: "hip-90",
    tier: "pro",
  },
  {
    id: "neck-circles",
    name: "Neck Mobility Flow",
    category: "mobility",
    targetAreas: ["cervical"],
    difficulty: "easy",
    painFocus: ["neck"],
    sittingFocus: false,
    benefit: "Restores cervical range of motion",
    dosage: "5 slow circles each direction",
    duration: "2 min",
    description: "Slowly tilt ear to shoulder, drop chin to chest, tilt to other side, and look up. Never force a stretch — stay gentle.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/ab032331f_generated_image.png",
    silhouette: "chin-tuck",
    tier: "pro",
  },

  // ── STRENGTH ───────────────────────────────────────────────────────────────
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    category: "strength",
    targetAreas: ["lumbar", "hips"],
    difficulty: "easy",
    painFocus: ["low_back"],
    sittingFocus: true,
    benefit: "Strengthens glutes, supports lumbar spine",
    dosage: "15 reps × 3 sets",
    duration: "3 min",
    description: "Lie on your back with knees bent. Drive hips up, squeeze glutes at the top. Hold for 2 seconds, then lower slowly.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1fae1bfb0_generated_image.png",
    silhouette: "glute-bridge",
    tier: "free",
  },
  {
    id: "bird-dog",
    name: "Bird Dog",
    category: "strength",
    targetAreas: ["lumbar", "thoracic"],
    difficulty: "medium",
    painFocus: ["low_back", "mid_back"],
    sittingFocus: false,
    benefit: "Builds core stability and spinal control",
    dosage: "8 reps each side × 2 sets",
    duration: "3 min",
    description: "From all fours, extend opposite arm and leg straight out. Hold 5 seconds. Keep spine perfectly neutral — no rotation.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/00978c8aa_generated_image.png",
    silhouette: "bird-dog",
    tier: "free",
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    category: "strength",
    targetAreas: ["lumbar"],
    difficulty: "medium",
    painFocus: ["low_back"],
    sittingFocus: false,
    benefit: "Trains deep core without loading the spine",
    dosage: "8 reps each side × 2 sets",
    duration: "3 min",
    description: "Lie on your back, arms and legs raised. Lower opposite arm and leg slowly toward the floor, return, then switch.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1f754e086_generated_image.png",
    silhouette: "dead-bug",
    tier: "free",
  },
  {
    id: "plank",
    name: "Forearm Plank",
    category: "strength",
    targetAreas: ["lumbar", "thoracic"],
    difficulty: "medium",
    painFocus: ["low_back", "mid_back"],
    sittingFocus: false,
    benefit: "Builds full-body spinal stability",
    dosage: "3 × 30 sec holds",
    duration: "2 min",
    description: "Hold a forearm plank with your body in a straight line from head to heels. Breathe steadily and keep core tight.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/4d99991d0_generated_image.png",
    silhouette: "plank",
    tier: "pro",
  },
  {
    id: "shoulder-t-raise",
    name: "Prone T-Raise",
    category: "strength",
    targetAreas: ["thoracic", "shoulders"],
    difficulty: "medium",
    painFocus: ["mid_back", "neck"],
    sittingFocus: false,
    benefit: "Strengthens mid-back and corrects rounded posture",
    dosage: "12 reps × 3 sets",
    duration: "3 min",
    description: "Lie face down with arms stretched out in a T. Lift arms off the floor by squeezing shoulder blades. Hold 2 sec.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/00978c8aa_generated_image.png",
    silhouette: "bird-dog",
    tier: "pro",
  },
  {
    id: "wall-sit",
    name: "Wall Sit",
    category: "strength",
    targetAreas: ["hips", "lumbar"],
    difficulty: "medium",
    painFocus: ["low_back"],
    sittingFocus: false,
    benefit: "Builds quad and glute endurance for spinal support",
    dosage: "3 × 30 sec holds",
    duration: "3 min",
    description: "Slide down a wall until thighs are parallel to the floor. Keep back flat against the wall and hold the position.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/4d99991d0_generated_image.png",
    silhouette: "plank",
    tier: "pro",
  },

  // ── STRETCHING ─────────────────────────────────────────────────────────────
  {
    id: "hip-flexor-stretch",
    name: "Hip Flexor Stretch",
    category: "stretching",
    targetAreas: ["hips", "lumbar"],
    difficulty: "easy",
    painFocus: ["low_back", "radiating"],
    sittingFocus: true,
    benefit: "Relieves lower back tension from sitting",
    dosage: "30 sec each side × 2 sets",
    duration: "2 min",
    description: "Kneel on one knee in a lunge. Push hips gently forward while keeping your torso upright and core tight.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
    silhouette: "hip-flexor",
    tier: "free",
  },
  {
    id: "childs-pose",
    name: "Child's Pose",
    category: "stretching",
    targetAreas: ["lumbar", "thoracic", "hips"],
    difficulty: "easy",
    painFocus: ["low_back", "mid_back"],
    sittingFocus: true,
    benefit: "Full spinal decompression and relaxation",
    dosage: "60 sec × 2 holds",
    duration: "2 min",
    description: "Kneel and sit back on your heels, stretching arms forward on the floor. Breathe deeply and let the spine lengthen.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
    silhouette: "hip-flexor",
    tier: "free",
  },
  {
    id: "piriformis-stretch",
    name: "Piriformis Stretch",
    category: "stretching",
    targetAreas: ["hips", "lumbar"],
    difficulty: "easy",
    painFocus: ["low_back", "radiating"],
    sittingFocus: true,
    benefit: "Releases hip and sciatic nerve tension",
    dosage: "45 sec each side × 2 sets",
    duration: "3 min",
    description: "Lie on back, cross one ankle over the opposite knee. Gently pull the uncrossed leg toward your chest.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
    silhouette: "hip-flexor",
    tier: "free",
  },
  {
    id: "upper-trap-stretch",
    name: "Upper Trap Stretch",
    category: "stretching",
    targetAreas: ["cervical", "shoulders"],
    difficulty: "easy",
    painFocus: ["neck", "mid_back"],
    sittingFocus: false,
    benefit: "Relieves neck and shoulder tension",
    dosage: "30 sec each side × 2 sets",
    duration: "2 min",
    description: "Sit tall, tilt ear to shoulder, and gently hold your head with one hand for a deeper stretch. Keep opposite shoulder down.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/ab032331f_generated_image.png",
    silhouette: "chin-tuck",
    tier: "free",
  },
  {
    id: "thread-needle",
    name: "Thread the Needle",
    category: "stretching",
    targetAreas: ["thoracic", "shoulders"],
    difficulty: "easy",
    painFocus: ["mid_back"],
    sittingFocus: true,
    benefit: "Releases thoracic rotation tightness",
    dosage: "30 sec each side × 2 sets",
    duration: "2 min",
    description: "Start on all fours. Slide one arm under the body along the floor. Rest your shoulder and cheek down. Breathe deeply.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/32ff77f97_generated_image.png",
    silhouette: "cat-cow",
    tier: "pro",
  },
  {
    id: "supine-twist",
    name: "Supine Spinal Twist",
    category: "stretching",
    targetAreas: ["lumbar", "thoracic", "hips"],
    difficulty: "easy",
    painFocus: ["low_back", "mid_back"],
    sittingFocus: true,
    benefit: "Decompress and rotate the lumbar spine",
    dosage: "45 sec each side",
    duration: "3 min",
    description: "Lie on your back, pull one knee across your body and let it fall to the opposite side. Extend that arm out wide.",
    mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
    silhouette: "hip-flexor",
    tier: "pro",
  },
];

/**
 * Deterministic seeded RNG — same date always produces same shuffle for a user.
 * seed = dateStr + userId
 */
function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >> 7; h ^= h << 17;
    return (h >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a recency-weighted map of exercise IDs from the past N days.
 * Returns Map<id, daysAgo> so we can penalize recent exercises more.
 */
function getRecentUsageMap(checkIns, dateStr, windowDays = 7) {
  const usageMap = new Map(); // id → daysAgo (smallest = most recent)
  const today = new Date(dateStr);

  for (const ci of checkIns) {
    if (ci.date === dateStr) continue; // skip today's saved plan
    if (!ci.exerciseIds) continue;
    const ciDate = new Date(ci.date);
    const daysAgo = Math.round((today - ciDate) / 86400000);
    if (daysAgo > windowDays) continue;
    ci.exerciseIds.forEach((id) => {
      // Keep the most recent occurrence
      if (!usageMap.has(id) || usageMap.get(id) > daysAgo) {
        usageMap.set(id, daysAgo);
      }
    });
  }
  return usageMap;
}

/**
 * Score an exercise for a user's profile + recency.
 * Higher = better match. Penalizes recently-used exercises.
 */
function scoreExercise(ex, profile, usageMap) {
  let score = 0;
  const painAreas = profile?.pain_areas || [];
  const sittingHours = profile?.sitting_hours || 0;

  // Personalization bonus
  if (painAreas.some((p) => ex.painFocus?.includes(p))) score += 10;
  if (sittingHours >= 6 && ex.sittingFocus) score += 5;

  // Recency penalty — heavily penalize exercises used in the past 7 days
  if (usageMap.has(ex.id)) {
    const daysAgo = usageMap.get(ex.id);
    // 1 day ago = -20, 2 days = -15, 3 days = -10, 4-7 days = -5
    if (daysAgo <= 1) score -= 20;
    else if (daysAgo <= 2) score -= 15;
    else if (daysAgo <= 3) score -= 10;
    else score -= 5;
  }

  return score;
}

/**
 * Generate today's plan (one per category), personalized with smart variety.
 * All exercises available — no tier restrictions during testing.
 */
export function generateDailyPlan(profile, checkIns, dateStr) {
  const available = EXERCISE_LIBRARY; // all exercises, no paywall
  const usageMap = getRecentUsageMap(checkIns, dateStr, 7);

  const rng = seededRandom(dateStr + (profile?.id || "anon"));

  const categories = Object.keys(CATEGORIES);
  const plan = [];

  for (const cat of categories) {
    const pool = available.filter((e) => e.category === cat);

    // Shuffle first for tie-breaking variety, then sort by score desc
    const shuffled = seededShuffle(pool, rng);
    const sorted = [...shuffled].sort(
      (a, b) => scoreExercise(b, profile, usageMap) - scoreExercise(a, profile, usageMap)
    );

    if (sorted.length > 0) plan.push(sorted[0]);
  }

  return plan;
}

// Keep backward-compat exports consumed elsewhere
export const exercises = {
  free: EXERCISE_LIBRARY.filter((e) => e.tier === "free"),
  pro:  EXERCISE_LIBRARY.filter((e) => e.tier === "pro"),
};

export function getRoutineForUser(painAreas) {
  return generateDailyPlan({ pain_areas: painAreas }, [], new Date().toISOString().slice(0, 10));
}