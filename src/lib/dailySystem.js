/**
 * SpineLab Daily System
 * Smart routine generation with media support, restrictions, pain targeting,
 * posture scan biasing, and easy/moderate/hard progression.
 */

export const LEVELS = ["easy", "moderate", "hard"];

/**
 * -----------------------------
 * MEDIA HELPERS
 * -----------------------------
 * Update these paths to match where you store your assets.
 * For Vite, placing files in /public/exercises/... works well.
 */

const MEDIA = {
  neckStretch: { image: "/exercises/18351101-Sitting-Neck-Flexion-Stretch_Neck_medium.png" },
  gluteBridge: { gif: "/exercises/30131301-Low-Glute-Bridge-on-floor_Hips_360.gif" },
  deadBug: { gif: "/exercises/78391301-Dead-Bug-(VERSION-3)-(female)_Waist_360.gif" },
  birdDog: { gif: "/exercises/31411301-Bird-Dog-(female)-FIX_360.gif" },
  lyingFloorRow: { video: "/exercises/90291201-Lying-Floor-Row-Hold-with-Bent-Knee_Back_.mp4" },
  forwardHeadHold: { video: "/exercises/77911201-Forward-Head-Posture-Hold-(female)_Stretching_.mp4" },
  bentArmChestStretch: { image: "/exercises/17801101-Bent-Arm-Chest-Stretch_Chest_medium.png" },
  seatedUprightTwists: { gif: "/exercises/83031301-Seated-Upright-Twists-on-a-Chair-(male)_Waist_360.gif" },
  squatHold: { image: "/exercises/63441101-Holding-Squat-(male)_Thighs_medium.png" },
  singleLegGluteBridge: { gif: "/exercises/51981301-Single-Straight-Leg-Glute-Bridge-Hold-(female)_Hips_360.gif" },

  kneelingThoracicExtension: { video: "/exercises/98851201-Kneeling-Thoracic-Spine-Extension-(female)_Hips_.mp4" },
  sidePlank: { image: "/exercises/28991101-Side-Plank-(beginner)-(female)_medium.png" },
  chinTuck: { image: "/exercises/31491101-Chin-Tuck_Neck_medium.png" },
  kneelingHipFlexorStretch: { image: "/exercises/10531101-Kneeling-Hip-Flexor-Stretch_Hips-FIX_medium.png" },
  catCow: { image: "/exercises/45801101-Cat-Cow-Stretch_Stretching_medium.png" },
  thoracicFlexion: { video: "/exercises/93331201-Sitting-Thoracic-Spine-Flexion-(male)_Stretching_.mp4" },
  standingScapularExternalRotationHold: { video: "/exercises/77921201-Standing-Scapular-External-Rotation-Hold-(female)_.mp4" },
  pelvicTilt: { gif: "/exercises/31471301-Pelvic-Tilt_Hips-FIX_360.gif" },
  lateralCostalBreathing: { video: "/exercises/99751201-Sitting-Lateral-Costal-Breathing-(female)_Waist_.mp4" },
  shoulderExternalRotation: { gif: "/exercises/27791301-Shoulder---Lateral-Rotation-(External-Rotation)_Articulations_360.gif" },
  wallAngels: { video: "/exercises/84351201-Standing-Angel-Wall-Supported-(male)_Shoulders_.mp4" },
};

function mergeMedia(base, media = {}) {
  return {
    ...base,
    video: media.video || null,
    gif: media.gif || null,
    image: media.image || null,
  };
}

function hasAnyMedia(ex) {
  return Boolean(ex.video || ex.gif || ex.image);
}

/**
 * -----------------------------
 * BASE EXERCISES
 * -----------------------------
 */

export const BREATHING_EXERCISE = mergeMedia(
  {
    id: "360_breathing",
    name: "360 Ribcage Breathing",
    category: "breathing",
    durationSecs: 54,
    instructions: [
      "Sit tall or stand tall with your ribs stacked over your pelvis.",
      "Breathe in through your nose and expand your ribs into the sides and back.",
      "Exhale slowly, let the ribs come down, and lightly brace your core.",
    ],
    dosage: "6 breaths · 4s inhale / 5s exhale",
    tags: ["breathing", "all", "warmup"],
    seatedFriendly: true,
    standingFriendly: true,
    floorRequired: false,
    contraindications: [],
  },
  MEDIA.lateralCostalBreathing
);

const EXERCISES = [
  mergeMedia(
    {
      id: "forward_head_hold",
      name: "Forward Head Posture Hold",
      category: "posture",
      baseInstructions: [
        "Sit or stand tall with your eyes level.",
        "Pull your chin straight back as if making a double chin.",
        "Keep the chin level and avoid looking down.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "10 sec hold × 4 reps" },
        moderate: { durationSecs: 75, dosage: "20 sec hold × 3 reps" },
        hard: { durationSecs: 105, dosage: "30 sec hold × 3 reps" },
      },
      tags: ["neck", "forward_head", "posture"],
      seatedFriendly: true,
      standingFriendly: true,
      floorRequired: false,
      contraindications: [],
    },
    MEDIA.forwardHeadHold
  ),

  mergeMedia(
    {
      id: "chin_tuck",
      name: "Chin Tuck",
      category: "posture",
      baseInstructions: [
        "Sit or stand tall with your shoulders relaxed.",
        "Pull your chin straight back without tipping your head down.",
        "Hold softly and breathe normally.",
      ],
      variants: {
        easy: { durationSecs: 40, dosage: "5 sec hold × 8 reps" },
        moderate: { durationSecs: 70, dosage: "10 sec hold × 6 reps" },
        hard: { durationSecs: 90, dosage: "15 sec hold × 6 reps" },
      },
      tags: ["neck", "forward_head", "posture"],
      seatedFriendly: true,
      standingFriendly: true,
      floorRequired: false,
      contraindications: [],
    },
    MEDIA.chinTuck
  ),

  mergeMedia(
    {
      id: "neck_stretch",
      name: "Neck Stretch",
      category: "mobility",
      baseInstructions: [
        "Sit tall with your shoulders relaxed.",
        "Gently tuck the chin and feel a stretch through the back of the neck.",
        "Do not force the movement or round aggressively.",
      ],
      variants: {
        easy: { durationSecs: 40, dosage: "15 sec hold × 2 reps" },
        moderate: { durationSecs: 60, dosage: "20 sec hold × 2 reps" },
        hard: { durationSecs: 80, dosage: "30 sec hold × 2 reps" },
      },
      tags: ["neck", "mobility", "forward_head"],
      seatedFriendly: true,
      standingFriendly: true,
      floorRequired: false,
      contraindications: [],
    },
    MEDIA.neckStretch
  ),

  mergeMedia(
    {
      id: "standing_scapular_external_rotation_hold",
      name: "Standing Scapular External Rotation Hold",
      category: "posture",
      baseInstructions: [
        "Stand tall with elbows bent and tucked by your sides.",
        "Rotate your forearms outward while keeping shoulders down and back.",
        "Do not shrug or arch your low back.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "10 sec hold × 4 reps" },
        moderate: { durationSecs: 70, dosage: "20 sec hold × 3 reps" },
        hard: { durationSecs: 95, dosage: "30 sec hold × 3 reps" },
      },
      tags: ["mid_back", "shoulders", "rounded_shoulders", "thoracic"],
      seatedFriendly: false,
      standingFriendly: true,
      floorRequired: false,
      contraindications: ["shoulder_pain"],
    },
    MEDIA.standingScapularExternalRotationHold
  ),

  mergeMedia(
    {
      id: "shoulder_external_rotation",
      name: "Shoulder External Rotation",
      category: "posture",
      baseInstructions: [
        "Keep your elbows tucked at your sides.",
        "Rotate the forearms outward in a controlled way.",
        "Keep the shoulders relaxed and neck soft.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "8 slow reps" },
        moderate: { durationSecs: 65, dosage: "12 reps" },
        hard: { durationSecs: 85, dosage: "15 reps with pause" },
      },
      tags: ["shoulders", "rounded_shoulders", "thoracic"],
      seatedFriendly: true,
      standingFriendly: true,
      floorRequired: false,
      contraindications: ["shoulder_pain"],
    },
    MEDIA.shoulderExternalRotation
  ),

  mergeMedia(
    {
      id: "wall_angels",
      name: "Wall Angels",
      category: "posture",
      baseInstructions: [
        "Stand with your back against a wall if possible.",
        "Raise and lower the arms slowly while keeping the ribs quiet.",
        "Move in control and do not force range.",
      ],
      variants: {
        easy: { durationSecs: 50, dosage: "8 slow reps" },
        moderate: { durationSecs: 75, dosage: "12 reps with 2 sec pause" },
        hard: { durationSecs: 95, dosage: "15 reps full control" },
      },
      tags: ["thoracic", "mid_back", "rounded_shoulders", "posture"],
      seatedFriendly: false,
      standingFriendly: true,
      floorRequired: false,
      contraindications: ["shoulder_pain"],
    },
    MEDIA.wallAngels
  ),

  mergeMedia(
    {
      id: "bent_arm_chest_stretch",
      name: "Bent Arm Chest Stretch",
      category: "mobility",
      baseInstructions: [
        "Place your forearm against a wall or doorway with the elbow bent.",
        "Gently turn your chest away until you feel a stretch in the front of the shoulder and chest.",
        "Keep the shoulder down and neck relaxed.",
      ],
      variants: {
        easy: { durationSecs: 40, dosage: "20 sec each side" },
        moderate: { durationSecs: 60, dosage: "30 sec each side" },
        hard: { durationSecs: 80, dosage: "40 sec each side" },
      },
      tags: ["chest", "rounded_shoulders", "thoracic", "mid_back"],
      seatedFriendly: false,
      standingFriendly: true,
      floorRequired: false,
      contraindications: ["shoulder_pain"],
    },
    MEDIA.bentArmChestStretch
  ),

  mergeMedia(
    {
      id: "kneeling_thoracic_extension",
      name: "Kneeling Thoracic Extension",
      category: "mobility",
      baseInstructions: [
        "Start kneeling with elbows supported if needed.",
        "Open through the upper back and chest without forcing your neck.",
        "Move slowly and breathe into the upper ribs.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "5 reps with gentle hold" },
        moderate: { durationSecs: 70, dosage: "8 reps with 2 sec hold" },
        hard: { durationSecs: 95, dosage: "10 reps with 3 sec hold" },
      },
      tags: ["thoracic", "mid_back", "mobility", "posture"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.kneelingThoracicExtension
  ),

  mergeMedia(
    {
      id: "thoracic_flexion",
      name: "Thoracic Flexion",
      category: "mobility",
      baseInstructions: [
        "Sit tall near the edge of a chair.",
        "Round gently through the mid-back, then return to upright.",
        "Move slowly with your breath.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "6 slow reps" },
        moderate: { durationSecs: 65, dosage: "10 reps" },
        hard: { durationSecs: 85, dosage: "12 reps with pause" },
      },
      tags: ["thoracic", "mid_back", "mobility"],
      seatedFriendly: true,
      standingFriendly: false,
      floorRequired: false,
      contraindications: [],
    },
    MEDIA.thoracicFlexion
  ),

  mergeMedia(
    {
      id: "seated_upright_twists",
      name: "Seated Upright Twists",
      category: "mobility",
      baseInstructions: [
        "Sit tall with your feet flat.",
        "Rotate through the mid-back, not by yanking with the arms.",
        "Keep the movement smooth and easy.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "5 reps each side" },
        moderate: { durationSecs: 65, dosage: "8 reps each side" },
        hard: { durationSecs: 85, dosage: "10 reps each side with pause" },
      },
      tags: ["thoracic", "mid_back", "rotation", "mobility"],
      seatedFriendly: true,
      standingFriendly: false,
      floorRequired: false,
      contraindications: ["pain_flare"],
    },
    MEDIA.seatedUprightTwists
  ),

  mergeMedia(
    {
      id: "cat_cow",
      name: "Cat-Cow Stretch",
      category: "mobility",
      baseInstructions: [
        "Start on hands and knees with a light brace.",
        "Gently arch and round your spine segment by segment.",
        "Let your breathing guide the motion.",
      ],
      variants: {
        easy: { durationSecs: 50, dosage: "8 slow reps" },
        moderate: { durationSecs: 70, dosage: "12 reps" },
        hard: { durationSecs: 90, dosage: "15 reps with 2 sec hold" },
      },
      tags: ["low_back", "thoracic", "mobility", "spine"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.catCow
  ),

  mergeMedia(
    {
      id: "kneeling_hip_flexor_stretch",
      name: "Kneeling Hip Flexor Stretch",
      category: "mobility",
      baseInstructions: [
        "Start in a half-kneeling position with one foot forward.",
        "Shift your hips forward while staying tall.",
        "Do not arch your low back.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "20 sec each side" },
        moderate: { durationSecs: 65, dosage: "30 sec each side" },
        hard: { durationSecs: 85, dosage: "40 sec each side" },
      },
      tags: ["low_back", "hip_flexor", "anterior_pelvic_tilt", "mobility"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.kneelingHipFlexorStretch
  ),

  mergeMedia(
    {
      id: "pelvic_tilt",
      name: "Pelvic Tilt",
      category: "stability",
      baseInstructions: [
        "Lie on your back or sit tall if modified.",
        "Gently tuck the pelvis and flatten the low back slightly.",
        "Move with control and do not force it.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "8 slow reps" },
        moderate: { durationSecs: 65, dosage: "12 reps" },
        hard: { durationSecs: 85, dosage: "15 reps with 2 sec hold" },
      },
      tags: ["low_back", "pelvis", "core", "anterior_pelvic_tilt"],
      seatedFriendly: true,
      standingFriendly: false,
      floorRequired: false,
      contraindications: [],
    },
    MEDIA.pelvicTilt
  ),

  mergeMedia(
    {
      id: "glute_bridge",
      name: "Glute Bridge",
      category: "stability",
      baseInstructions: [
        "Lie on your back with knees bent and feet flat.",
        "Press through your heels and lift your hips.",
        "Squeeze the glutes without arching the low back.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "8 reps" },
        moderate: { durationSecs: 65, dosage: "12 reps" },
        hard: { durationSecs: 85, dosage: "15 reps with pause" },
      },
      tags: ["low_back", "glutes", "pelvis", "stability"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.gluteBridge
  ),

  mergeMedia(
    {
      id: "single_leg_glute_bridge_hold",
      name: "Single Leg Glute Bridge Hold",
      category: "strength",
      baseInstructions: [
        "Start in a bridge position and extend one leg.",
        "Lift your hips and hold steady through the planted leg.",
        "Keep your pelvis level and controlled.",
      ],
      variants: {
        easy: { durationSecs: 40, dosage: "10 sec each side × 2" },
        moderate: { durationSecs: 60, dosage: "15 sec each side × 2" },
        hard: { durationSecs: 80, dosage: "20 sec each side × 2" },
      },
      tags: ["low_back", "glutes", "strength", "advanced"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.singleLegGluteBridge
  ),

  mergeMedia(
    {
      id: "dead_bug",
      name: "Dead Bug",
      category: "stability",
      baseInstructions: [
        "Lie on your back with arms up and hips/knees bent.",
        "Lower opposite arm and leg while keeping your trunk steady.",
        "Keep the ribs down and move slowly.",
      ],
      variants: {
        easy: { durationSecs: 50, dosage: "6 reps each side" },
        moderate: { durationSecs: 70, dosage: "8 reps each side" },
        hard: { durationSecs: 90, dosage: "10 reps each side, slower tempo" },
      },
      tags: ["low_back", "core", "stability"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.deadBug
  ),

  mergeMedia(
    {
      id: "bird_dog",
      name: "Bird Dog",
      category: "stability",
      baseInstructions: [
        "Start on hands and knees.",
        "Reach one arm and the opposite leg long without twisting.",
        "Keep the trunk steady and controlled.",
      ],
      variants: {
        easy: { durationSecs: 50, dosage: "6 reps each side" },
        moderate: { durationSecs: 70, dosage: "8 reps each side" },
        hard: { durationSecs: 90, dosage: "10 reps each side with pause" },
      },
      tags: ["low_back", "core", "stability", "spine_control"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.birdDog
  ),

  mergeMedia(
    {
      id: "side_plank",
      name: "Side Plank",
      category: "strength",
      baseInstructions: [
        "Set up on your side with elbow under shoulder.",
        "Lift your hips until your body forms a straight line.",
        "Keep breathing and do not let the shoulder shrug.",
      ],
      variants: {
        easy: { durationSecs: 35, dosage: "10 sec each side × 2" },
        moderate: { durationSecs: 55, dosage: "15 sec each side × 2" },
        hard: { durationSecs: 75, dosage: "20 sec each side × 2" },
      },
      tags: ["low_back", "core", "strength", "lateral_stability"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["back_surgery", "pain_flare", "no_floor", "shoulder_pain"],
    },
    MEDIA.sidePlank
  ),

  mergeMedia(
    {
      id: "lying_floor_row",
      name: "Lying Floor Row",
      category: "strength",
      baseInstructions: [
        "Lie face down or in the provided supported position.",
        "Pull the elbows back while opening the chest.",
        "Move slowly and avoid shrugging the shoulders.",
      ],
      variants: {
        easy: { durationSecs: 45, dosage: "8 reps" },
        moderate: { durationSecs: 65, dosage: "12 reps" },
        hard: { durationSecs: 85, dosage: "15 reps with pause" },
      },
      tags: ["mid_back", "thoracic", "rounded_shoulders", "strength"],
      seatedFriendly: false,
      standingFriendly: false,
      floorRequired: true,
      contraindications: ["shoulder_pain", "back_surgery", "pain_flare", "no_floor"],
    },
    MEDIA.lyingFloorRow
  ),

  mergeMedia(
    {
      id: "squat_hold",
      name: "Squat Hold",
      category: "strength",
      baseInstructions: [
        "Stand with feet comfortable and drop into a supported squat hold if needed.",
        "Keep your chest lifted and heels grounded.",
        "Hold only as low as feels safe and controlled.",
      ],
      variants: {
        easy: { durationSecs: 35, dosage: "10 sec hold × 2" },
        moderate: { durationSecs: 55, dosage: "15 sec hold × 2" },
        hard: { durationSecs: 75, dosage: "20 sec hold × 2" },
      },
      tags: ["low_back", "hips", "glutes", "strength", "standing"],
      seatedFriendly: false,
      standingFriendly: true,
      floorRequired: false,
      contraindications: ["back_surgery", "pain_flare"],
    },
    MEDIA.squatHold
  ),
];

/**
 * -----------------------------
 * CHAIR / STANDING FRIENDLY EASY MODE
 * -----------------------------
 */

export const SEATED_MODE_EXERCISES = [
  withFixedVariant(
    mergeMedia(
      {
        id: "seated_chair_breathing",
        name: "360 Ribcage Breathing",
        category: "breathing",
        instructions: BREATHING_EXERCISE.instructions,
        durationSecs: 54,
        dosage: "6 breaths · 4s inhale / 5s exhale",
        tags: ["breathing", "all"],
        seatedFriendly: true,
        standingFriendly: true,
        floorRequired: false,
      },
      MEDIA.lateralCostalBreathing
    )
  ),
  withFixedVariant(
    mergeMedia(
      {
        id: "seated_chin_tuck",
        name: "Seated Chin Tuck",
        category: "posture",
        instructions: [
          "Sit tall with both feet flat.",
          "Pull the chin straight back without looking down.",
          "Hold gently and breathe normally.",
        ],
        durationSecs: 50,
        dosage: "5 sec hold × 8 reps",
        tags: ["neck", "forward_head", "posture"],
        seatedFriendly: true,
        standingFriendly: false,
        floorRequired: false,
      },
      MEDIA.chinTuck
    )
  ),
  withFixedVariant(
    mergeMedia(
      {
        id: "seated_thoracic_flexion",
        name: "Seated Thoracic Flexion",
        category: "mobility",
        instructions: [
          "Sit tall near the edge of a chair.",
          "Round gently through the mid-back and return to upright.",
          "Move slowly with the breath.",
        ],
        durationSecs: 55,
        dosage: "8 slow reps",
        tags: ["thoracic", "mid_back", "mobility"],
        seatedFriendly: true,
        standingFriendly: false,
        floorRequired: false,
      },
      MEDIA.thoracicFlexion
    )
  ),
  withFixedVariant(
    mergeMedia(
      {
        id: "seated_upright_twists_easy",
        name: "Seated Upright Twists",
        category: "mobility",
        instructions: [
          "Sit tall with your feet flat.",
          "Rotate through the mid-back in a controlled way.",
          "Do not force the twist.",
        ],
        durationSecs: 55,
        dosage: "5 reps each side",
        tags: ["thoracic", "mid_back", "mobility"],
        seatedFriendly: true,
        standingFriendly: false,
        floorRequired: false,
      },
      MEDIA.seatedUprightTwists
    )
  ),
  withFixedVariant(
    mergeMedia(
      {
        id: "seated_shoulder_external_rotation",
        name: "Shoulder External Rotation",
        category: "posture",
        instructions: [
          "Keep elbows tucked at your sides while seated.",
          "Rotate the forearms outward slowly.",
          "Keep the neck and shoulders relaxed.",
        ],
        durationSecs: 55,
        dosage: "8 slow reps",
        tags: ["shoulders", "rounded_shoulders", "thoracic"],
        seatedFriendly: true,
        standingFriendly: false,
        floorRequired: false,
      },
      MEDIA.shoulderExternalRotation
    )
  ),
];

function withFixedVariant(ex) {
  return {
    ...ex,
    level: "easy",
  };
}

/**
 * -----------------------------
 * HELPERS
 * -----------------------------
 */

function withLevel(exercise, level) {
  if (!exercise.variants) {
    return {
      ...exercise,
      level,
      instructions: exercise.instructions || ["Move slowly and stay controlled."],
      durationSecs: exercise.durationSecs || 45,
      dosage: exercise.dosage || "",
    };
  }

  const variant = exercise.variants[level] || exercise.variants.easy;

  return {
    ...exercise,
    level,
    instructions: exercise.baseInstructions || exercise.instructions || [],
    durationSecs: variant.durationSecs,
    dosage: variant.dosage,
  };
}

function scoreExercise(ex, { painAreas, scanBias, restrictions, level, seatedMode, noFloorMode, usedIds }) {
  let score = 0;

  if (usedIds.has(ex.id)) score -= 100;

  if (seatedMode && ex.seatedFriendly) score += 6;
  if (seatedMode && !ex.seatedFriendly) score -= 20;

  if (noFloorMode && ex.floorRequired) score -= 30;

  if (restrictions.includes("shoulder_pain") && ex.contraindications?.includes("shoulder_pain")) score -= 30;
  if (restrictions.includes("back_surgery") && ex.contraindications?.includes("back_surgery")) score -= 30;
  if (restrictions.includes("pain_flare") && ex.contraindications?.includes("pain_flare")) score -= 30;
  if (restrictions.includes("no_floor") && ex.contraindications?.includes("no_floor")) score -= 30;

  if (painAreas.lowBack && ex.tags.includes("low_back")) score += 8;
  if (painAreas.midBack && (ex.tags.includes("mid_back") || ex.tags.includes("thoracic"))) score += 8;
  if (painAreas.neck && ex.tags.includes("neck")) score += 8;
  if (painAreas.shoulder && ex.tags.includes("shoulders")) score -= 8;

  if (scanBias.forwardHead && (ex.tags.includes("forward_head") || ex.tags.includes("neck"))) score += 7;
  if (scanBias.thoracic && (ex.tags.includes("thoracic") || ex.tags.includes("rounded_shoulders"))) score += 7;
  if (scanBias.lumbar && (ex.tags.includes("low_back") || ex.tags.includes("pelvis") || ex.tags.includes("glutes") || ex.tags.includes("core"))) score += 7;

  if (level === "hard" && ex.tags.includes("advanced")) score += 3;
  if (level === "easy" && ex.floorRequired) score -= 3;

  if (hasAnyMedia(ex)) score += 2;

  return score;
}

function pickBestExercise(pool, ctx) {
  if (!pool.length) return null;

  const ranked = [...pool]
    .map((ex) => ({ ex, score: scoreExercise(ex, ctx) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.ex || null;
}

function filterAllowed(pool, restrictions = [], seatedMode = false, noFloorMode = false) {
  return pool.filter((ex) => {
    if (seatedMode && !ex.seatedFriendly) return false;
    if (noFloorMode && ex.floorRequired) return false;

    if (restrictions.includes("shoulder_pain") && ex.contraindications?.includes("shoulder_pain")) return false;
    if (restrictions.includes("back_surgery") && ex.contraindications?.includes("back_surgery")) return false;
    if (restrictions.includes("pain_flare") && ex.contraindications?.includes("pain_flare")) return false;
    if (restrictions.includes("no_floor") && ex.contraindications?.includes("no_floor")) return false;

    return true;
  });
}

function rotatePool(pool, dayIndex) {
  if (!pool.length) return [];
  const shift = dayIndex % pool.length;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

function dedupeAndCompact(list) {
  const seen = new Set();
  return list.filter((item) => {
    if (!item?.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * -----------------------------
 * PUBLIC HELPERS
 * -----------------------------
 */

export function resolveLevel(checkIns, overrideLevel = null) {
  if (overrideLevel) return overrideLevel;
  const completedDays = checkIns.filter((c) => c.completed).length;
  if (completedDays >= 14) return "hard";
  if (completedDays >= 7) return "moderate";
  return "easy";
}

export function isSeatedMode(activeAdjustments = []) {
  const TRIGGERS = ["back_surgery", "pain_flare", "seated_only"];
  return activeAdjustments.some((a) => TRIGGERS.includes(a));
}

export function getDayIndex(checkIns = []) {
  return checkIns.filter((c) => c.completed).length % 7;
}

export function getDayOfPlan(checkIns = []) {
  return getDayIndex(checkIns) + 1;
}

export function getProgressMessage(streak = 0) {
  if (streak >= 14) return "You're building serious momentum.";
  if (streak >= 7) return "Great consistency — keep the streak alive.";
  if (streak >= 3) return "Nice rhythm. Keep stacking days.";
  if (streak >= 1) return "Good start. Come back tomorrow.";
  return "Today’s routine builds tomorrow’s posture.";
}

/**
 * -----------------------------
 * SMART PLAN GENERATOR
 * -----------------------------
 */

export function generateDailySystemPlan(dayIndex, level, thirdArg = false) {
  const legacySeatedMode = typeof thirdArg === "boolean" ? thirdArg : null;

  const options =
    typeof thirdArg === "object" && thirdArg !== null
      ? thirdArg
      : {
          seatedMode: legacySeatedMode ?? false,
        };

  const {
    seatedMode = false,
    noFloorMode = false,
    restrictions = [],
    painAreas = {
      lowBack: false,
      midBack: false,
      neck: false,
      shoulder: false,
    },
    scanBias = {
      forwardHead: false,
      thoracic: false,
      lumbar: false,
    },
    startWithBreathing = true,
  } = options;

  const safeLevel = LEVELS.includes(level) ? level : "easy";
  const usedIds = new Set();
  const plan = [];

  if (startWithBreathing) {
    plan.push(BREATHING_EXERCISE);
    usedIds.add(BREATHING_EXERCISE.id);
  }

  // Easy mode / chair-friendly route for surgery, flare, seated-only
  const forceChairFriendly =
    seatedMode ||
    restrictions.includes("seated_only") ||
    restrictions.includes("back_surgery") ||
    restrictions.includes("pain_flare");

  if (forceChairFriendly) {
    const chairPlan = dedupeAndCompact([
      BREATHING_EXERCISE,
      ...SEATED_MODE_EXERCISES,
    ]);

    return chairPlan.slice(0, 5);
  }

  const allowed = filterAllowed(EXERCISES, restrictions, seatedMode, noFloorMode);

  const posturePool = rotatePool(
    allowed.filter((ex) => ex.category === "posture"),
    dayIndex
  );

  const mobilityPool = rotatePool(
    allowed.filter((ex) => ex.category === "mobility"),
    dayIndex + 1
  );

  const stabilityPool = rotatePool(
    allowed.filter((ex) => ex.category === "stability"),
    dayIndex + 2
  );

  const strengthPool = rotatePool(
    allowed.filter((ex) => ex.category === "strength"),
    dayIndex + 3
  );

  const ctx = {
    painAreas,
    scanBias,
    restrictions,
    level: safeLevel,
    seatedMode,
    noFloorMode,
    usedIds,
  };

  // slot 1: posture/corrective
  const corrective = pickBestExercise(posturePool, ctx);
  if (corrective) {
    plan.push(withLevel(corrective, safeLevel));
    usedIds.add(corrective.id);
  }

  // slot 2: mobility
  const mobility = pickBestExercise(mobilityPool, { ...ctx, usedIds });
  if (mobility) {
    plan.push(withLevel(mobility, safeLevel));
    usedIds.add(mobility.id);
  }

  // slot 3: stability or strength depending on profile
  const lowerBias =
    painAreas.lowBack || scanBias.lumbar || restrictions.includes("back_surgery");

  const slot3Pool = lowerBias ? stabilityPool : strengthPool;
  const slot3 = pickBestExercise(slot3Pool, { ...ctx, usedIds });

  if (slot3) {
    plan.push(withLevel(slot3, safeLevel));
    usedIds.add(slot3.id);
  }

  // slot 4: final targeted exercise
  let finalPool = [...posturePool, ...mobilityPool, ...stabilityPool, ...strengthPool]
    .filter((ex) => !usedIds.has(ex.id));

  finalPool = rotatePool(finalPool, dayIndex + 4);

  const finisher = pickBestExercise(finalPool, { ...ctx, usedIds });
  if (finisher) {
    plan.push(withLevel(finisher, safeLevel));
    usedIds.add(finisher.id);
  }

  const cleaned = dedupeAndCompact(plan).slice(0, 5);

  // fallback safety
  if (cleaned.length < 5) {
    const fallback = dedupeAndCompact([
      ...cleaned,
      ...allowed
        .filter((ex) => !cleaned.some((c) => c.id === ex.id))
        .slice(0, 5 - cleaned.length)
        .map((ex) => withLevel(ex, safeLevel)),
    ]);
    return fallback.slice(0, 5);
  }

  return cleaned;
}