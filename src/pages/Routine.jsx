import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Play,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import MedicalDisclaimer from "@/components/legal/MedicalDisclaimer";
import WorkoutSession from "@/components/routine/WorkoutSession";
import ExerciseDetailView from "@/components/routine/ExerciseDetailView";
import ExerciseMedia from "@/components/routine/ExerciseMedia";
import DailyAdjustSheet from "@/components/routine/DailyAdjustSheet";
import ProtocolSelectSheet from "@/components/routine/ProtocolSelectSheet";
import PaywallScreen from "@/components/paywall/PaywallScreen";
import { supabase } from "@/lib/supabase";
import { getActiveWeeklyMinutes, getEffortPercent, calcSpineAge } from "@/lib/spineScore";

const STORAGE_KEYS = {
  routineDayKey:   "spinelab_routine_day_key",
  lockedDayIndex:  "spinelab_locked_day_index",
  completedDayKey: "spinelab_completed_day_key",
};

const CATEGORY_COLORS = {
  breathing: "bg-sky-100 text-sky-700 border-sky-200",
  posture:   "bg-violet-100 text-violet-700 border-violet-200",
  mobility:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  stability: "bg-orange-100 text-orange-700 border-orange-200",
  strength:  "bg-rose-100 text-rose-700 border-rose-200",
};

const CATEGORY_LABELS = {
  breathing: "Breathing",
  posture:   "Posture",
  mobility:  "Mobility",
  stability: "Stability",
  strength:  "Strength",
};

function getSpineLevel(score) {
  if (score >= 85) return { level: 5, title: "Elite",       color: "text-amber-500",   bg: "bg-amber-50 border-amber-200",   ring: "#f59e0b" };
  if (score >= 70) return { level: 4, title: "Resilient",   color: "text-violet-500",  bg: "bg-violet-50 border-violet-200", ring: "#8b5cf6" };
  if (score >= 55) return { level: 3, title: "Strong",      color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", ring: "#10b981" };
  if (score >= 40) return { level: 2, title: "Stabilizing", color: "text-sky-500",     bg: "bg-sky-50 border-sky-200",       ring: "#0ea5e9" };
  return                   { level: 1, title: "Rebuilding",  color: "text-rose-500",    bg: "bg-rose-50 border-rose-200",     ring: "#f43f5e" };
}

function loadLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveLocalJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDuration(totalSeconds = 0) {
  if (!totalSeconds) return "—";
  if (totalSeconds < 60) return `${totalSeconds}s`;
  return `${Math.ceil(totalSeconds / 60)} min`;
}

function getTodayFocus(planType) {
  if (planType === "neck")          return "Neck + posture reset";
  if (planType === "mid_back")      return "Upper back + posture opening";
  if (planType === "low_back")      return "Core + pelvic support";
  if (planType === "desk_worker")   return "Desk Worker Protocol";
  if (planType === "low_back_pain") return "Low Back Pain Protocol";
  return "Balanced spine support";
}

function buildExerciseLibrary() {
  return {
    "360 Breathing": {
      name: "360 Breathing", category: "breathing",
      video: "/exercises/99751201-Sitting-Lateral-Costal-Breathing-(female)_Waist_.mp4",
      instructions: ["Breathe into your ribs, sides, and low back.", "Keep your shoulders relaxed.", "Take slow, full breaths and stay relaxed."],
    },
    "Hip Flexor Stretch": {
      name: "Hip Flexor Stretch", category: "mobility",
      image: "/exercises/10531101-Kneeling-Hip-Flexor-Stretch_Hips-FIX_medium.png",
      instructions: ["Set up in a half-kneeling position with one knee down.", "Gently shift forward until you feel a stretch in the front of the hip.", "Breathe slowly and keep your ribs stacked over your pelvis."],
    },
    "Bent Arm Chest Stretch": {
      name: "Bent Arm Chest Stretch", category: "mobility",
      image: "/exercises/17801101-Bent-Arm-Chest-Stretch_Chest_medium.png",
      instructions: ["Place the arm against the wall with the elbow bent.", "Rotate your chest gently away until you feel the front of the chest open.", "Do not arch your low back while you hold the stretch."],
    },
    "Sitting Neck Flexion Stretch": {
      name: "Sitting Neck Flexion Stretch", category: "mobility",
      image: "/exercises/18351101-Sitting-Neck-Flexion-Stretch_Neck_medium.png",
      instructions: ["Sit tall with your shoulders relaxed.", "Gently nod and bring your chin downward until a stretch is felt.", "Stay easy and do not pull aggressively into pain."],
    },
    "Shoulder Lateral Rotation": {
      name: "Shoulder Lateral Rotation", category: "posture",
      gif: "/exercises/27791301-Shoulder---Lateral-Rotation-(External-Rotation)_Articulations_360.gif",
      instructions: ["Stand or sit tall with elbows close to your sides.", "Rotate the forearms outward with control without shrugging.", "Keep the movement smooth and controlled the whole time."],
    },
    "Side Plank": {
      name: "Side Plank", category: "stability",
      image: "/exercises/28991101-Side-Plank-(beginner)-(female)_medium.png",
      instructions: ["Set up with your elbow under your shoulder.", "Lift your hips and keep your ribs stacked over your pelvis.", "Breathe steadily while keeping the trunk braced."],
    },
    "Glute Bridge": {
      name: "Glute Bridge", category: "strength",
      gif: "/exercises/30131301-Low-Glute-Bridge-on-floor_Hips_360.gif",
      instructions: ["Lie on your back with knees bent and feet planted.", "Drive through your heels and lift your hips without over-arching.", "Squeeze the glutes at the top and lower with control."],
    },
    "Bird Dog": {
      name: "Bird Dog", category: "stability",
      gif: "/exercises/31411301-Bird-Dog-(female)-FIX_360.gif",
      instructions: ["Start on hands and knees with a neutral spine.", "Reach opposite arm and leg away while keeping the trunk still.", "Move slowly and avoid twisting through the low back."],
    },
    "Pelvic Tilt": {
      name: "Pelvic Tilt", category: "mobility",
      gif: "/exercises/31471301-Pelvic-Tilt_Hips-FIX_360.gif",
      instructions: ["Lie on your back with knees bent.", "Gently rock the pelvis to flatten the low back, then release.", "Keep the motion small and controlled."],
    },
    "Chin Tuck": {
      name: "Chin Tuck", category: "posture",
      image: "/exercises/31491101-Chin-Tuck_Neck_medium.png",
      instructions: ["Sit or stand tall with eyes level.", "Draw your chin straight back like making a double chin.", "Do not tilt the head down while you move."],
    },
    "Cat Cow Stretch": {
      name: "Cat Cow Stretch", category: "mobility",
      image: "/exercises/45801101-Cat-Cow-Stretch_Stretching_medium.png",
      instructions: ["Start on hands and knees.", "Move smoothly between rounding and extending the spine.", "Keep the movement easy and do not force range."],
    },
    "Holding Squat": {
      name: "Holding Squat", category: "strength",
      image: "/exercises/63441101-Holding-Squat-(male)_Thighs_medium.png",
      instructions: ["Lower into a comfortable squat depth.", "Keep your chest tall and heels grounded.", "Breathe steadily while holding the position."],
    },
    "Forward Head Posture Hold": {
      name: "Forward Head Posture Hold", category: "posture",
      video: "/exercises/77911201-Forward-Head-Posture-Hold-(female)_Stretching_.mp4",
      instructions: ["Stack your head over your shoulders.", "Gently retract the chin and keep the neck long.", "Hold without straining or tensing the shoulders."],
    },
    "Standing Scapular External Rotation": {
      name: "Standing Scapular External Rotation", category: "posture",
      video: "/exercises/77921201-Standing-Scapular-External-Rotation-Hold-(female)_.mp4",
      instructions: ["Stand tall with elbows near your sides.", "Rotate outward while keeping the shoulder blades controlled.", "Avoid shrugging or flaring the ribs."],
    },
    "Dead Bug": {
      name: "Dead Bug", category: "stability",
      gif: "/exercises/78391301-Dead-Bug-(VERSION-3)-(female)_Waist_360.gif",
      instructions: ["Lie on your back with knees and arms up.", "Lower the opposite arm and leg slowly while bracing the core.", "Keep the low back steady against the floor."],
    },
    "Seated Upright Twists": {
      name: "Seated Upright Twists", category: "mobility",
      gif: "/exercises/83031301-Seated-Upright-Twists-on-a-Chair-(male)_Waist_360.gif",
      instructions: ["Sit tall near the front of the chair.", "Rotate gently through the upper back from side to side.", "Keep the motion smooth and easy."],
    },
    "Wall Angels Standing": {
      name: "Wall Angels Standing", category: "posture",
      video: "/exercises/84351201-Standing-Angel-Wall-Supported-(male)_Shoulders_.mp4",
      instructions: ["Stand against the wall with ribs down.", "Slide your arms upward while keeping control through the shoulders.", "Move slowly and do not force contact with the wall."],
    },
    "Lying Floor Row Hold": {
      name: "Lying Floor Row Hold", category: "strength",
      video: "/exercises/90291201-Lying-Floor-Row-Hold-with-Bent-Knee_Back_.mp4",
      instructions: ["Lie face down or in the demonstrated row-hold position.", "Pull the elbows back and squeeze the upper back.", "Hold without shrugging toward the ears."],
    },
    "Sitting Thoracic Spine Flexion": {
      name: "Sitting Thoracic Spine Flexion", category: "mobility",
      video: "/exercises/93331201-Sitting-Thoracic-Spine-Flexion-(male)_Stretching_.mp4",
      instructions: ["Sit tall with feet grounded.", "Round gently through the upper back while keeping the movement controlled.", "Ease in and out without forcing the stretch."],
    },
    "Kneeling Thoracic Spine Extension": {
      name: "Kneeling Thoracic Spine Extension", category: "mobility",
      video: "/exercises/98851201-Kneeling-Thoracic-Spine-Extension-(female)_Hips_.mp4",
      instructions: ["Set up in kneeling as shown.", "Open through the chest and upper back with control.", "Keep the low back quiet and breathe normally."],
    },
    "Single Leg Glute Bridge": {
      name: "Single Leg Glute Bridge", category: "strength",
      gif: "/exercises/51981301-Single-Straight-Leg-Glute-Bridge-Hold-(female)_Hips_360.gif",
      instructions: ["Set up on your back with one foot planted.", "Lift the hips while keeping them level.", "Hold with glutes engaged and avoid twisting."],
    },
  };
}

function withLevel(exercise, level) {
  const base = { ...exercise };
  const config = {
    easy:     { hold: 20, reps: 6,  sets: 1, perSideHold: 15, perSideReps: 5  },
    moderate: { hold: 30, reps: 10, sets: 2, perSideHold: 20, perSideReps: 8  },
    hard:     { hold: 45, reps: 14, sets: 2, perSideHold: 30, perSideReps: 10 },
  };
  const c = config[level] || config.moderate;

  const breathingExercises   = ["360 Breathing"];
  const holdExercises        = ["Side Plank","Forward Head Posture Hold","Single Leg Glute Bridge","Lying Floor Row Hold","Holding Squat","Hip Flexor Stretch","Bent Arm Chest Stretch","Sitting Neck Flexion Stretch","Kneeling Thoracic Spine Extension"];
  const perSideRepExercises  = ["Seated Upright Twists","Bird Dog","Dead Bug","Shoulder Lateral Rotation"];
  const repExercises         = ["Glute Bridge","Pelvic Tilt","Chin Tuck","Cat Cow Stretch","Standing Scapular External Rotation","Wall Angels Standing","Sitting Thoracic Spine Flexion"];
  const perSideHoldExercises = ["Side Plank","Hip Flexor Stretch","Bent Arm Chest Stretch","Single Leg Glute Bridge"];

  if (breathingExercises.includes(base.name))   { base.durationSecs = 54; base.dosage = "6 slow breaths"; return base; }
  if (perSideHoldExercises.includes(base.name)) { base.durationSecs = c.perSideHold * 2; base.dosage = `${c.sets} x ${c.perSideHold}s each side`; return base; }
  if (holdExercises.includes(base.name))        { base.durationSecs = c.hold; base.dosage = `${c.sets} x ${c.hold}s hold`; return base; }
  if (perSideRepExercises.includes(base.name))  { base.durationSecs = c.reps * 3; base.dosage = `${c.sets} x ${c.reps} reps per side`; return base; }
  if (repExercises.includes(base.name))         { base.durationSecs = c.reps * 3; base.dosage = `${c.sets} x ${c.reps} reps`; return base; }

  base.durationSecs = c.hold; base.dosage = `${c.sets} x ${c.hold}s`;
  return base;
}

function normalizeExercise(ex, index = 0) {
  return {
    id: ex?.id || `${ex?.name || "exercise"}-${index}`,
    name: ex?.name || "Exercise",
    category: ex?.category || "mobility",
    durationSecs: ex?.durationSecs || 30,
    dosage: ex?.dosage || "",
    instructions: Array.isArray(ex?.instructions) && ex.instructions.length
      ? ex.instructions : ["Move slowly and stay controlled."],
    video: ex?.video || "", gif: ex?.gif || "", image: ex?.image || "",
  };
}

function getChairOnlyPlan() {
  return ["360 Breathing","Sitting Neck Flexion Stretch","Seated Upright Twists","Sitting Thoracic Spine Flexion","Chin Tuck"];
}

// ── Finding → targeted exercises ──────────────────────────────────────────
// Maps the top_finding stored on the profile to the exercises that best
// address it. If none of those are already in today's plan, one is swapped
// in at position 3 (keeping the breathing opener and early mobility intact).

const FINDING_TARGETS = {
  forward_head:      ["Chin Tuck", "Forward Head Posture Hold", "Sitting Neck Flexion Stretch"],
  rounded_shoulders: ["Wall Angels Standing", "Standing Scapular External Rotation", "Bent Arm Chest Stretch", "Lying Floor Row Hold"],
  pelvic_tilt:       ["Pelvic Tilt", "Dead Bug", "Glute Bridge", "Bird Dog"],
  kyphosis:          ["Kneeling Thoracic Spine Extension", "Sitting Thoracic Spine Flexion", "Seated Upright Twists", "Cat Cow Stretch"],
};

// ── Protocol plans (phased, premium) ──────────────────────────────────────
// Phases 1-3 = structured 6-week program (weeks 1-2, 3-4, 5-6).
// Phase 4 = ongoing Maintenance (week 7+) — rotating mix of best exercises.
// Phase is calculated from protocol_start_date on the profile.

const PROTOCOL_PLANS = {
  desk_worker: {
    1: [ // Foundation — weeks 1-2
      ["360 Breathing", "Chin Tuck", "Sitting Neck Flexion Stretch", "Hip Flexor Stretch", "Bent Arm Chest Stretch"],
      ["360 Breathing", "Forward Head Posture Hold", "Seated Upright Twists", "Shoulder Lateral Rotation", "Sitting Thoracic Spine Flexion"],
    ],
    2: [ // Activation — weeks 3-4
      ["360 Breathing", "Wall Angels Standing", "Kneeling Thoracic Spine Extension", "Standing Scapular External Rotation", "Hip Flexor Stretch"],
      ["360 Breathing", "Chin Tuck", "Bent Arm Chest Stretch", "Bird Dog", "Forward Head Posture Hold"],
    ],
    3: [ // Reinforcement — weeks 5-6
      ["360 Breathing", "Wall Angels Standing", "Dead Bug", "Lying Floor Row Hold", "Seated Upright Twists"],
      ["360 Breathing", "Standing Scapular External Rotation", "Side Plank", "Kneeling Thoracic Spine Extension", "Chin Tuck"],
    ],
    4: [ // Maintenance — week 7+
      ["360 Breathing", "Chin Tuck", "Wall Angels Standing", "Hip Flexor Stretch", "Seated Upright Twists"],
      ["360 Breathing", "Forward Head Posture Hold", "Standing Scapular External Rotation", "Kneeling Thoracic Spine Extension", "Bent Arm Chest Stretch"],
      ["360 Breathing", "Chin Tuck", "Dead Bug", "Wall Angels Standing", "Sitting Neck Flexion Stretch"],
    ],
  },
  low_back_pain: {
    1: [ // Gentle Activation — weeks 1-2
      ["360 Breathing", "Pelvic Tilt", "Cat Cow Stretch", "Hip Flexor Stretch", "Sitting Thoracic Spine Flexion"],
      ["360 Breathing", "Pelvic Tilt", "Glute Bridge", "Seated Upright Twists", "Cat Cow Stretch"],
    ],
    2: [ // Stability — weeks 3-4
      ["360 Breathing", "Dead Bug", "Glute Bridge", "Hip Flexor Stretch", "Cat Cow Stretch"],
      ["360 Breathing", "Bird Dog", "Pelvic Tilt", "Holding Squat", "Sitting Thoracic Spine Flexion"],
    ],
    3: [ // Strength — weeks 5-6
      ["360 Breathing", "Dead Bug", "Side Plank", "Single Leg Glute Bridge", "Glute Bridge"],
      ["360 Breathing", "Bird Dog", "Holding Squat", "Single Leg Glute Bridge", "Pelvic Tilt"],
    ],
    4: [ // Maintenance — week 7+
      ["360 Breathing", "Pelvic Tilt", "Bird Dog", "Glute Bridge", "Cat Cow Stretch"],
      ["360 Breathing", "Dead Bug", "Hip Flexor Stretch", "Single Leg Glute Bridge", "Sitting Thoracic Spine Flexion"],
      ["360 Breathing", "Bird Dog", "Pelvic Tilt", "Glute Bridge", "Holding Squat"],
    ],
  },
};

const PROTOCOL_PHASE_LABELS = {
  desk_worker:   ["Foundation", "Activation", "Reinforcement", "Maintenance"],
  low_back_pain: ["Gentle Activation", "Stability", "Strength", "Maintenance"],
};

function getProtocolPhase(startDateStr) {
  if (!startDateStr) return 1;
  const days = Math.floor((Date.now() - new Date(startDateStr)) / 86_400_000);
  if (days < 14) return 1;
  if (days < 28) return 2;
  if (days < 42) return 3;
  return 4; // Maintenance — week 7+
}

function applyFindingSwap(exercises, topFinding, level) {
  if (!topFinding || !FINDING_TARGETS[topFinding]) return exercises;

  const targets = FINDING_TARGETS[topFinding];
  const alreadyCovered = exercises.some((ex) => targets.includes(ex.name));
  if (alreadyCovered) return exercises;

  // Swap in the first available targeted exercise at position 3.
  const library    = buildExerciseLibrary();
  const targetName = targets.find((name) => library[name]);
  if (!targetName) return exercises;

  const swapped = normalizeExercise(withLevel(library[targetName], level), 3);
  const result  = [...exercises];
  result[3]     = swapped;
  return result;
}

function getPlanTemplate(planType, dayIndex, phase = 1) {
  // Phased premium protocols
  if (PROTOCOL_PLANS[planType]) {
    const phaseData = PROTOCOL_PLANS[planType][phase] || PROTOCOL_PLANS[planType][1];
    return phaseData[dayIndex % phaseData.length];
  }
  // Standard rotating plans
  const plans = {
    neck: [
      ["360 Breathing","Chin Tuck","Forward Head Posture Hold","Bent Arm Chest Stretch","Wall Angels Standing"],
      ["360 Breathing","Sitting Neck Flexion Stretch","Standing Scapular External Rotation","Seated Upright Twists","Bent Arm Chest Stretch"],
    ],
    mid_back: [
      ["360 Breathing","Wall Angels Standing","Kneeling Thoracic Spine Extension","Lying Floor Row Hold","Bent Arm Chest Stretch"],
      ["360 Breathing","Seated Upright Twists","Sitting Thoracic Spine Flexion","Standing Scapular External Rotation","Wall Angels Standing"],
    ],
    low_back: [
      ["360 Breathing","Pelvic Tilt","Dead Bug","Glute Bridge","Cat Cow Stretch"],
      ["360 Breathing","Bird Dog","Side Plank","Single Leg Glute Bridge","Pelvic Tilt"],
    ],
    balanced: [
      ["360 Breathing","Chin Tuck","Seated Upright Twists","Glute Bridge","Wall Angels Standing"],
      ["360 Breathing","Forward Head Posture Hold","Kneeling Thoracic Spine Extension","Bird Dog","Bent Arm Chest Stretch"],
      ["360 Breathing","Sitting Neck Flexion Stretch","Sitting Thoracic Spine Flexion","Dead Bug","Standing Scapular External Rotation"],
    ],
  };
  const selected = plans[planType] || plans.balanced;
  return selected[dayIndex % selected.length];
}

function getExerciseObjects(planType, dayIndex, level, chairOnly, phase = 1) {
  const library = buildExerciseLibrary();
  const names   = chairOnly ? getChairOnlyPlan() : getPlanTemplate(planType, dayIndex, phase);
  return names.map((name, index) =>
    normalizeExercise(withLevel(library[name] || { name, category: "mobility" }, level), index)
  );
}

function getNextHigherLevel(level) {
  if (level === "easy")     return "moderate";
  if (level === "moderate") return "hard";
  return "hard";
}

function getNextLowerLevel(level) {
  if (level === "hard")     return "moderate";
  if (level === "moderate") return "easy";
  return "easy";
}

export default function Routine() {
  const [loading, setLoading]                   = useState(true);
  const [user, setUser]                         = useState(null);
  const [profile, setProfile]                   = useState(null);
  const [sessionActive, setSessionActive]       = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [routineCompleted, setRoutineCompleted] = useState(false);
  const [earnedToday, setEarnedToday]           = useState(null);
  const [showAdjuster, setShowAdjuster]           = useState(false);
  const [showProtocolSelect, setShowProtocolSelect] = useState(false);
  const [showPaywall, setShowPaywall]             = useState(false);
  const [chairOnlyToday, setChairOnlyToday]       = useState(false);
  const [todayKey, setTodayKey]                 = useState(getTodayKey());
  const [lockedDayIndex, setLockedDayIndex]     = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setChairOnlyToday(false);
        const storedDayKey          = loadLocalJSON(STORAGE_KEYS.routineDayKey,   null);
        const storedLockedDayIndex  = loadLocalJSON(STORAGE_KEYS.lockedDayIndex,  null);
        const storedCompletedDayKey = loadLocalJSON(STORAGE_KEYS.completedDayKey, null);
        const currentDayKey         = getTodayKey();

        setTodayKey(currentDayKey);
        setRoutineCompleted(storedCompletedDayKey === currentDayKey);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser ?? null);
        if (!currentUser?.id) { setLoading(false); return; }

        const { data, error } = await supabase
          .from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        if (error) throw error;
        setProfile(data || null);

        const currentStreak    = data?.current_streak || 0;
        const computedDayIndex = currentStreak % 7;

        if (storedDayKey === currentDayKey && typeof storedLockedDayIndex === "number") {
          setLockedDayIndex(storedLockedDayIndex);
        } else {
          setLockedDayIndex(computedDayIndex);
          saveLocalJSON(STORAGE_KEYS.routineDayKey,  currentDayKey);
          saveLocalJSON(STORAGE_KEYS.lockedDayIndex, computedDayIndex);
        }
      } catch (err) {
        console.error("[Routine] load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTodayKey = getTodayKey();
      if (newTodayKey !== todayKey) {
        setTodayKey(newTodayKey);
        const nextDayIndex = (profile?.current_streak || 0) % 7;
        setLockedDayIndex(nextDayIndex);
        setRoutineCompleted(false);
        setEarnedToday(null);
        setChairOnlyToday(false);
        saveLocalJSON(STORAGE_KEYS.routineDayKey,   newTodayKey);
        saveLocalJSON(STORAGE_KEYS.lockedDayIndex,  nextDayIndex);
        saveLocalJSON(STORAGE_KEYS.completedDayKey, null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [todayKey, profile]);

  const streak         = profile?.current_streak  || 0;
  const dayIndex       = lockedDayIndex;
  const planType       = profile?.plan_type       || "balanced";
  const routineLevel   = profile?.routine_level   || "moderate";
  const effectiveLevel = chairOnlyToday ? "easy" : routineLevel;
  const spineScore     = typeof profile?.spine_score === "number" ? profile.spine_score : 0;
  const spineLevel     = getSpineLevel(spineScore);
  const isPremium      = profile?.subscription_tier === "premium";
  const spineAge = calcSpineAge(spineScore, profile?.age_range);
  const protocolPhase  = getProtocolPhase(profile?.protocol_start_date);

  // Free users can use any non-premium protocol; only phased (premium) ones are gated
  const effectivePlanType = (!isPremium && PROTOCOL_PLANS[planType]) ? "balanced" : planType;

  const exercises = useMemo(() => {
    const base = getExerciseObjects(effectivePlanType, dayIndex, effectiveLevel, chairOnlyToday, protocolPhase);
    return applyFindingSwap(base, profile?.top_finding, effectiveLevel);
  }, [effectivePlanType, dayIndex, effectiveLevel, chairOnlyToday, profile?.top_finding, protocolPhase]);

  const totalMins = Math.round(
    exercises.reduce((sum, ex) => sum + (ex.durationSecs || 0), 0) / 60
  );

  const mobilityCount = exercises.filter((e) => e.category === "mobility").length;
  const strengthCount = exercises.filter(
    (e) => e.category === "strength" || e.category === "stability"
  ).length;

  const todayFocus  = chairOnlyToday ? "Chair-only recovery day" : getTodayFocus(effectivePlanType);

  // Phase label for phased protocols
  const phaseLabels   = PROTOCOL_PHASE_LABELS[effectivePlanType];
  const phaseLabel    = phaseLabels ? phaseLabels[protocolPhase - 1] : null;

  const handleTooEasy = async () => {
    if (!user?.id || !profile) return;
    try {
      const nextLevel = getNextHigherLevel(profile?.routine_level || "moderate");
      const { data, error } = await supabase.from("profiles")
        .update({ routine_level: nextLevel, updated_at: new Date().toISOString() })
        .eq("id", user.id).select().single();
      if (error) throw error;
      setProfile(data);
    } catch (err) { console.error("[Routine] too easy error:", err); }
  };

  const handleTooHard = async () => {
    if (!user?.id || !profile) return;
    try {
      const nextLevel = getNextLowerLevel(profile?.routine_level || "moderate");
      const { data, error } = await supabase.from("profiles")
        .update({ routine_level: nextLevel, updated_at: new Date().toISOString() })
        .eq("id", user.id).select().single();
      if (error) throw error;
      setProfile(data);
    } catch (err) { console.error("[Routine] too hard error:", err); }
  };

  const handleChairOnly = () => setChairOnlyToday(true);

  const handleProtocolSelect = async (newPlanType) => {
    if (!user?.id) return;
    try {
      const isPhased = !!PROTOCOL_PLANS[newPlanType];
      const { data, error } = await supabase.from("profiles")
        .update({
          plan_type:             newPlanType,
          // Reset start date when switching into a phased protocol
          ...(isPhased ? { protocol_start_date: new Date().toISOString().split("T")[0] } : {}),
          updated_at:            new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      setShowProtocolSelect(false);
    } catch (err) {
      console.error("[Routine] protocol select error:", err);
    }
  };

  const handleWorkoutComplete = async () => {
    if (routineCompleted) return null;
    if (!user?.id || !profile) return null;

    try {
      const structuralScore     = Number(profile?.structural_score  ?? 50);
      const previousMobility    = Number(profile?.mobility_score    ?? 50);
      const previousStrength    = Number(profile?.strength_score    ?? 50);
      const previousSpineScore  = Number(profile?.spine_score       ?? 0);

      // Effort = real minutes exercised this week, not a flat per-day bump.
      // getActiveWeeklyMinutes already rolls over to 0 if the last completion
      // fell in a previous week, so no separate reset step is needed here.
      const previousWeeklyMinutes = getActiveWeeklyMinutes(profile);
      const previousEffortPercent = getEffortPercent(previousWeeklyMinutes);

      const snapshot = {
        spineScore:    previousSpineScore,
        mobilityScore: previousMobility,
        strengthScore: previousStrength,
        effortScore:   previousEffortPercent,
      };

      const newWeeklyMinutes = previousWeeklyMinutes + totalMins;
      const newEffortPercent = getEffortPercent(newWeeklyMinutes);
      const newMobility      = Math.min(100, previousMobility + mobilityCount * 0.8);
      const newStrength      = Math.min(100, previousStrength + strengthCount * 0.8);

      const rawSpineScore = Math.round(
        structuralScore * 0.4 +
        newEffortPercent * 0.2 +
        newMobility      * 0.2 +
        newStrength      * 0.2
      );

      const newSpineScore = previousSpineScore >= 100
        ? 100
        : Math.min(100, Math.max(previousSpineScore + 1, rawSpineScore));

      const newStreak        = (profile?.current_streak || 0) + 1;
      const newLongestStreak = Math.max(newStreak, profile?.longest_streak || 0);
      let nextLevel          = profile?.routine_level || "moderate";
      if (newStreak % 7 === 0) nextLevel = getNextHigherLevel(nextLevel);

      const { data, error } = await supabase.from("profiles")
        .update({
          // NOTE: still the `consistency_score` column (no migration), but it
          // now stores raw minutes exercised this week, not a 0-100 score.
          consistency_score: Math.round(newWeeklyMinutes),
          mobility_score:    Math.round(newMobility),
          strength_score:    Math.round(newStrength),
          spine_score:       newSpineScore,
          current_streak:    newStreak,
          longest_streak:    newLongestStreak,
          routine_level:     nextLevel,
          last_active_date:  new Date().toISOString().split("T")[0],
          updated_at:        new Date().toISOString(),
        })
        .eq("id", user.id).select().single();
      if (error) throw error;

      setProfile(data);
      setRoutineCompleted(true);
      setEarnedToday({ spineScore: newSpineScore, prevSpineScore: previousSpineScore });
      setChairOnlyToday(false);

      saveLocalJSON(STORAGE_KEYS.routineDayKey,   todayKey);
      saveLocalJSON(STORAGE_KEYS.lockedDayIndex,  dayIndex);
      saveLocalJSON(STORAGE_KEYS.completedDayKey, todayKey);

      return {
        scoreSnapshot: snapshot,
        newScores: {
          spineScore:      newSpineScore,
          mobilityScore:   Math.round(newMobility),
          strengthScore:   Math.round(newStrength),
          effortScore:     Math.round(newEffortPercent),
          effortMinutes:   Math.round(newWeeklyMinutes),
          currentStreak:   newStreak,
        },
      };
    } catch (err) {
      console.error("[Routine] complete error:", err);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedExercise) {
    const selectedIndex = exercises.findIndex((e) => e.id === selectedExercise.id);
    return (
      <ExerciseDetailView
        exercise={exercises[selectedIndex] || exercises[0]}
        exercises={exercises}
        exerciseIndex={selectedIndex >= 0 ? selectedIndex : 0}
        onBack={() => setSelectedExercise(null)}
        onNavigate={(idx) => setSelectedExercise(exercises[idx])}
      />
    );
  }

  if (sessionActive) {
    return (
      <WorkoutSession
        exercises={exercises}
        dayOfPlan={dayIndex + 1}
        streak={streak}
        spineAge={spineAge}
        mobilityCount={mobilityCount}
        strengthCount={strengthCount}
        onComplete={handleWorkoutComplete}
        onReturnDashboard={() => {
          setSessionActive(false);
          window.location.assign("/dashboard");
        }}
        onExit={() => setSessionActive(false)}
      />
    );
  }

  // Paywall shown full-screen
  if (showPaywall) {
    return (
      <PaywallScreen
        source="protocol"
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          // RevenueCat purchase flow wired here later
          setShowPaywall(false);
        }}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">
      <DailyAdjustSheet
        open={showAdjuster}
        onClose={() => setShowAdjuster(false)}
        onTooEasy={handleTooEasy}
        onTooHard={handleTooHard}
        onChairOnly={handleChairOnly}
        currentLevel={routineLevel}
      />

      <ProtocolSelectSheet
        open={showProtocolSelect}
        onClose={() => setShowProtocolSelect(false)}
        currentPlanType={effectivePlanType}
        isPremium={isPremium}
        currentPhase={protocolPhase}
        onSelect={handleProtocolSelect}
        onUpgrade={() => { setShowProtocolSelect(false); setShowPaywall(true); }}
      />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">
              SpineLab Daily
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">Today's Routine</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              ~{totalMins} min · {exercises.length} moves
            </p>

            {/* Tappable plan chip */}
            <button
              onClick={() => setShowProtocolSelect(true)}
              className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-secondary border border-border active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold text-foreground/70">{todayFocus}</span>
              {phaseLabel && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">
                  {phaseLabel}
                </span>
              )}
              {!isPremium && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">· Upgrade for more</span>
              )}
              <ChevronRight className="w-3 h-3 text-muted-foreground/50 ml-auto" />
            </button>
          </div>

          <button
            onClick={() => setShowAdjuster(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors shrink-0 mt-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Adjust</span>
          </button>
        </div>

        {/* Start button — top, prominent */}
        {routineCompleted ? (
          <div className="bg-primary/10 rounded-3xl p-5 text-center border border-primary/10">
            <Check className="w-7 h-7 text-primary mx-auto mb-2" />
            <p className="font-semibold text-base">Today's routine done!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Great work. Come back tomorrow to keep building.
            </p>
            {earnedToday && earnedToday.spineScore > earnedToday.prevSpineScore && (
              <p className="text-sm font-semibold mt-3" style={{ color: spineLevel.ring }}>
                Spine Score: {earnedToday.prevSpineScore} → {earnedToday.spineScore}
              </p>
            )}
          </div>
        ) : (
          <Button
            onClick={() => setSessionActive(true)}
            className="w-full h-14 rounded-2xl text-base font-bold gap-3 shadow-md shadow-primary/20"
            disabled={exercises.length === 0}
          >
            <Play className="w-5 h-5" />
            Start Today's Routine
          </Button>
        )}
      </motion.div>

      {/* Exercise preview list — not tappable, just a preview of what's in the session */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="space-y-3 mb-6"
      >
        {exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="w-full rounded-[26px] border border-border bg-card px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-border bg-white dark:bg-slate-950">
                <ExerciseMedia exercise={ex} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    CATEGORY_COLORS[ex.category] || "bg-secondary text-muted-foreground border-border"
                  }`}>
                    {CATEGORY_LABELS[ex.category] || ex.category}
                  </span>
                </div>
                <p className="text-[15px] font-semibold leading-snug">{ex.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ex.dosage || ex.instructions?.[0] || "Move slowly and stay controlled."}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground/80">{formatDuration(ex.durationSecs)}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <MedicalDisclaimer className="mb-5" />
    </div>
  );
}