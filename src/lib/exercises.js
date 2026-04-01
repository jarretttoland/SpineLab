export const exercises = {
  free: [
    {
      id: "chin-tuck",
      name: "Chin Tucks",
      benefit: "Helps forward head posture",
      dosage: "10 reps, 2x/day",
      description: "Pull your chin straight back, creating a double chin. Hold for 5 seconds. Keep eyes level throughout.",
      duration: "2 min",
      targets: ["neck", "upper_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/ab032331f_generated_image.png",
      videoUrl: "",
    },
    {
      id: "wall-angel",
      name: "Wall Angels",
      benefit: "Opens chest and fixes rounded shoulders",
      dosage: "12 reps, 2x/day",
      description: "Stand with your back against a wall. Slide arms up and down while keeping full contact with the wall.",
      duration: "2 min",
      targets: ["upper_back", "neck"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1322fff58_generated_image.png",
      videoUrl: "",
    },
    {
      id: "thoracic-extension",
      name: "Thoracic Extension",
      benefit: "Reduces upper back stiffness",
      dosage: "8 reps, 1x/day",
      description: "Sit in a chair with hands behind head, gently extend your upper back over the backrest. Open your chest upward.",
      duration: "3 min",
      targets: ["upper_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/32ff77f97_generated_image.png",
      videoUrl: "",
    },
    {
      id: "cat-cow",
      name: "Cat-Cow Stretch",
      benefit: "Mobilizes the entire spine",
      dosage: "10 cycles, 1x/day",
      description: "On hands and knees, alternate between rounding your back up (cat) and arching it down (cow). Breathe deeply.",
      duration: "3 min",
      targets: ["upper_back", "lower_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/6cdc933a7_generated_image.png",
      videoUrl: "",
    },
  ],
  pro: [
    {
      id: "hip-flexor-stretch",
      name: "Hip Flexor Stretch",
      benefit: "Relieves lower back tension from sitting",
      dosage: "30 sec each side, 2x/day",
      description: "Kneel on one knee in a lunge. Push hips gently forward while keeping your torso upright and core tight.",
      duration: "2 min",
      targets: ["lower_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/7ac2e0c61_generated_image.png",
      videoUrl: "",
    },
    {
      id: "glute-bridge",
      name: "Glute Bridge",
      benefit: "Strengthens glutes, supports lumbar spine",
      dosage: "15 reps, 3x/day",
      description: "Lie on your back with knees bent. Drive hips up, squeeze glutes at the top. Hold for 2 seconds.",
      duration: "3 min",
      targets: ["lower_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1fae1bfb0_generated_image.png",
      videoUrl: "",
    },
    {
      id: "bird-dog",
      name: "Bird Dog",
      benefit: "Builds core stability and spinal control",
      dosage: "8 reps each side, 2x/day",
      description: "From all fours, extend opposite arm and leg straight out, hold 5 seconds. Keep spine perfectly neutral.",
      duration: "3 min",
      targets: ["lower_back", "upper_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/00978c8aa_generated_image.png",
      videoUrl: "",
    },
    {
      id: "dead-bug",
      name: "Dead Bug",
      benefit: "Trains deep core without loading the spine",
      dosage: "8 reps each side, 2x/day",
      description: "Lie on your back with arms and legs raised. Lower opposite arm and leg slowly toward the floor, then return.",
      duration: "3 min",
      targets: ["lower_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/1f754e086_generated_image.png",
      videoUrl: "",
    },
    {
      id: "plank",
      name: "Forearm Plank",
      benefit: "Builds full-body spinal stability",
      dosage: "3 x 30 sec holds, 1x/day",
      description: "Hold a forearm plank with your body in a straight line from head to heels. Breathe steadily and keep core tight.",
      duration: "2 min",
      targets: ["lower_back", "upper_back"],
      mediaType: "image",
      mediaUrl: "https://media.base44.com/images/public/69bee6e14c4292fd177635fd/4d99991d0_generated_image.png",
      videoUrl: "",
    },
  ],
};

// Map new problem area keys to exercise target keys
const AREA_TO_TARGET = {
  neck: ["neck"],
  mid_back: ["upper_back"],
  low_back: ["lower_back"],
  radiating: ["lower_back", "neck"],
  upper_back: ["upper_back"],
  lower_back: ["lower_back"],
};

export function getRoutineForUser(painAreas, isPro) {
  const allExercises = isPro ? [...exercises.free, ...exercises.pro] : exercises.free;
  if (!painAreas || painAreas.length === 0) return allExercises;

  const targets = painAreas.flatMap((a) => AREA_TO_TARGET[a] || [a]);
  const matched = allExercises.filter((e) =>
    e.targets.some((t) => targets.includes(t))
  );

  if (matched.length >= 3) return matched.slice(0, 5);
  return allExercises.slice(0, isPro ? 5 : 4);
}

export function calculateSpineScore(painAreas, sittingHours, worksOut) {
  let score = 70;
  score -= (painAreas?.length || 0) * 8;
  if (sittingHours > 8) score -= 15;
  else if (sittingHours > 6) score -= 10;
  else if (sittingHours > 4) score -= 5;
  if (worksOut) score += 10;
  return Math.max(15, Math.min(100, score));
}