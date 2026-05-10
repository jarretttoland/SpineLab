import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Play,
  Check,
  ChevronRight,
  Sparkles,
  Trophy,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import MedicalDisclaimer from "@/components/legal/MedicalDisclaimer";
import WorkoutSession from "@/components/routine/WorkoutSession";
import ExerciseDetailView from "@/components/routine/ExerciseDetailView";
import ExerciseMedia from "@/components/routine/ExerciseMedia";
import DailyAdjustSheet from "@/components/routine/DailyAdjustSheet";
import { supabase } from "@/lib/supabase";

const STORAGE_KEYS = {
  routineDayKey: "spinelab_routine_day_key",
  lockedDayIndex: "spinelab_locked_day_index",
  completedDayKey: "spinelab_completed_day_key",
};

const CATEGORY_COLORS = {
  breathing: "bg-sky-100 text-sky-700 border-sky-200",
  posture: "bg-violet-100 text-violet-700 border-violet-200",
  mobility: "bg-emerald-100 text-emerald-700 border-emerald-200",
  stability: "bg-orange-100 text-orange-700 border-orange-200",
  strength: "bg-rose-100 text-rose-700 border-rose-200",
};

const CATEGORY_LABELS = {
  breathing: "Breathing",
  posture: "Posture",
  mobility: "Mobility",
  stability: "Stability",
  strength: "Strength",
};

function getSpineLevel(score) {
  if (score >= 85) return { level: 5, title: "Elite", color: "text-amber-500", bg: "bg-amber-50 border-amber-200", ring: "#f59e0b" };
  if (score >= 70) return { level: 4, title: "Resilient", color: "text-violet-500", bg: "bg-violet-50 border-violet-200", ring: "#8b5cf6" };
  if (score >= 55) return { level: 3, title: "Strong", color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", ring: "#10b981" };
  if (score >= 40) return { level: 2, title: "Stabilizing", color: "text-sky-500", bg: "bg-sky-50 border-sky-200", ring: "#0ea5e9" };
  return { level: 1, title: "Rebuilding", color: "text-rose-500", bg: "bg-rose-50 border-rose-200", ring: "#f43f5e" };
}

function getNextLevelThreshold(score) {
  if (score >= 85) return null;
  if (score >= 70) return 85;
  if (score >= 55) return 70;
  if (score >= 40) return 55;
  return 40;
}

function loadLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
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

function getProgressMessage(streak) {
  if (streak >= 13) return "You're building real momentum. Keep it rolling.";
  if (streak >= 6) return "One more strong week and this starts becoming a habit.";
  if (streak >= 2) return "Nice work. Consistency is starting to stack.";
  return "Start today and build your first streak.";
}

function getTodayFocus(planType) {
  if (planType === "neck") return "Neck + posture reset";
  if (planType === "mid_back") return "Upper back + posture opening";
  if (planType === "low_back") return "Core + pelvic support";
  return "Balanced spine support";
}

function buildExerciseLibrary() {
  return {
    "360 Breathing": {
      name: "360 Breathing",
      category: "breathing",
      video: "/exercises/99751201-Sitting-Lateral-Costal-Breathing-(female)_Waist_.mp4",
      instructions: [
        "Breathe into your ribs, sides, and low back.",
        "Keep your shoulders relaxed.",
        "Take slow, full breaths and stay relaxed.",
      ],
    },
    "Hip Flexor Stretch": {
      name: "Hip Flexor Stretch",
      category: "mobility",
      image: "/exercises/10531101-Kneeling-Hip-Flexor-Stretch_Hips-FIX_medium.png",
      instructions: [
        "Set up in a half-kneeling position with one knee down.",
        "Gently shift forward until you feel a stretch in the front of the hip.",
        "Breathe slowly and keep your ribs stacked over your pelvis.",
      ],
    },
    "Bent Arm Chest Stretch": {
      name: "Bent Arm Chest Stretch",
      category: "mobility",
      image: "/exercises/17801101-Bent-Arm-Chest-Stretch_Chest_medium.png",
      instructions: [
        "Place the arm against the wall with the elbow bent.",
        "Rotate your chest gently away until you feel the front of the chest open.",
        "Do not arch your low back while you hold the stretch.",
      ],
    },
    "Sitting Neck Flexion Stretch": {
      name: "Sitting Neck Flexion Stretch",
      category: "mobility",
      image: "/exercises/18351101-Sitting-Neck-Flexion-Stretch_Neck_medium.png",
      instructions: [
        "Sit tall with your shoulders relaxed.",
        "Gently nod and bring your chin downward until a stretch is felt.",
        "Stay easy and do not pull aggressively into pain.",
      ],
    },
    "Shoulder Lateral Rotation": {
      name: "Shoulder Lateral Rotation",
      category: "posture",
      gif: "/exercises/27791301-Shoulder---Lateral-Rotation-(External-Rotation)_Articulations_360.gif",
      instructions: [
        "Stand or sit tall with elbows close to your sides.",
        "Rotate the forearms outward with control without shrugging.",
        "Keep the movement smooth and controlled the whole time.",
      ],
    },
    "Side Plank": {
      name: "Side Plank",
      category: "stability",
      image: "/exercises/28991101-Side-Plank-(beginner)-(female)_medium.png",
      instructions: [
        "Set up with your elbow under your shoulder.",
        "Lift your hips and keep your ribs stacked over your pelvis.",
        "Breathe steadily while keeping the trunk braced.",
      ],
    },
    "Glute Bridge": {
      name: "Glute Bridge",
      category: "strength",
      gif: "/exercises/30131301-Low-Glute-Bridge-on-floor_Hips_360.gif",
      instructions: [
        "Lie on your back with knees bent and feet planted.",
        "Drive through your heels and lift your hips without over-arching.",
        "Squeeze the glutes at the top and lower with control.",
      ],
    },
    "Bird Dog": {
      name: "Bird Dog",
      category: "stability",
      gif: "/exercises/31411301-Bird-Dog-(female)-FIX_360.gif",
      instructions: [
        "Start on hands and knees with a neutral spine.",
        "Reach opposite arm and leg away while keeping the trunk still.",
        "Move slowly and avoid twisting through the low back.",
      ],
    },
    "Pelvic Tilt": {
      name: "Pelvic Tilt",
      category: "mobility",
      gif: "/exercises/31471301-Pelvic-Tilt_Hips-FIX_360.gif",
      instructions: [
        "Lie on your back with knees bent.",
        "Gently rock the pelvis to flatten the low back, then release.",
        "Keep the motion small and controlled.",
      ],
    },
    "Chin Tuck": {
      name: "Chin Tuck",
      category: "posture",
      image: "/exercises/31491101-Chin-Tuck_Neck_medium.png",
      instructions: [
        "Sit or stand tall with eyes level.",
        "Draw your chin straight back like making a double chin.",
        "Do not tilt the head down while you move.",
      ],
    },
    "Cat Cow Stretch": {
      name: "Cat Cow Stretch",
      category: "mobility",
      image: "/exercises/45801101-Cat-Cow-Stretch_Stretching_medium.png",
      instructions: [
        "Start on hands and knees.",
        "Move smoothly between rounding and extending the spine.",
        "Keep the movement easy and do not force range.",
      ],
    },
    "Holding Squat": {
      name: "Holding Squat",
      category: "strength",
      image: "/exercises/63441101-Holding-Squat-(male)_Thighs_medium.png",
      instructions: [
        "Lower into a comfortable squat depth.",
        "Keep your chest tall and heels grounded.",
        "Breathe steadily while holding the position.",
      ],
    },
    "Forward Head Posture Hold": {
      name: "Forward Head Posture Hold",
      category: "posture",
      video: "/exercises/77911201-Forward-Head-Posture-Hold-(female)_Stretching_.mp4",
      instructions: [
        "Stack your head over your shoulders.",
        "Gently retract the chin and keep the neck long.",
        "Hold without straining or tensing the shoulders.",
      ],
    },
    "Standing Scapular External Rotation": {
      name: "Standing Scapular External Rotation",
      category: "posture",
      video: "/exercises/77921201-Standing-Scapular-External-Rotation-Hold-(female)_.mp4",
      instructions: [
        "Stand tall with elbows near your sides.",
        "Rotate outward while keeping the shoulder blades controlled.",
        "Avoid shrugging or flaring the ribs.",
      ],
    },
    "Dead Bug": {
      name: "Dead Bug",
      category: "stability",
      gif: "/exercises/78391301-Dead-Bug-(VERSION-3)-(female)_Waist_360.gif",
      instructions: [
        "Lie on your back with knees and arms up.",
        "Lower the opposite arm and leg slowly while bracing the core.",
        "Keep the low back steady against the floor.",
      ],
    },
    "Seated Upright Twists": {
      name: "Seated Upright Twists",
      category: "mobility",
      gif: "/exercises/83031301-Seated-Upright-Twists-on-a-Chair-(male)_Waist_360.gif",
      instructions: [
        "Sit tall near the front of the chair.",
        "Rotate gently through the upper back from side to side.",
        "Keep the motion smooth and easy.",
      ],
    },
    "Wall Angels Standing": {
      name: "Wall Angels Standing",
      category: "posture",
      video: "/exercises/84351201-Standing-Angel-Wall-Supported-(male)_Shoulders_.mp4",
      instructions: [
        "Stand against the wall with ribs down.",
        "Slide your arms upward while keeping control through the shoulders.",
        "Move slowly and do not force contact with the wall.",
      ],
    },
    "Lying Floor Row Hold": {
      name: "Lying Floor Row Hold",
      category: "strength",
      video: "/exercises/90291201-Lying-Floor-Row-Hold-with-Bent-Knee_Back_.mp4",
      instructions: [
        "Lie face down or in the demonstrated row-hold position.",
        "Pull the elbows back and squeeze the upper back.",
        "Hold without shrugging toward the ears.",
      ],
    },
    "Sitting Thoracic Spine Flexion": {
      name: "Sitting Thoracic Spine Flexion",
      category: "mobility",
      video: "/exercises/93331201-Sitting-Thoracic-Spine-Flexion-(male)_Stretching_.mp4",
      instructions: [
        "Sit tall with feet grounded.",
        "Round gently through the upper back while keeping the movement controlled.",
        "Ease in and out without forcing the stretch.",
      ],
    },
    "Kneeling Thoracic Spine Extension": {
      name: "Kneeling Thoracic Spine Extension",
      category: "mobility",
      video: "/exercises/98851201-Kneeling-Thoracic-Spine-Extension-(female)_Hips_.mp4",
      instructions: [
        "Set up in kneeling as shown.",
        "Open through the chest and upper back with control.",
        "Keep the low back quiet and breathe normally.",
      ],
    },
    "Single Leg Glute Bridge": {
      name: "Single Leg Glute Bridge",
      category: "strength",
      gif: "/exercises/51981301-Single-Straight-Leg-Glute-Bridge-Hold-(female)_Hips_360.gif",
      instructions: [
        "Set up on your back with one foot planted.",
        "Lift the hips while keeping them level.",
        "Hold with glutes engaged and avoid twisting.",
      ],
    },
  };
}

function withLevel(exercise, level) {
  const base = { ...exercise };
  const config = {
    easy: { hold: 20, reps: 6, sets: 1, perSideHold: 15, perSideReps: 5 },
    moderate: { hold: 30, reps: 10, sets: 2, perSideHold: 20, perSideReps: 8 },
    hard: { hold: 45, reps: 14, sets: 2, perSideHold: 30, perSideReps: 10 },
  };

  const c = config[level] || config.moderate;

  const breathingExercises = ["360 Breathing"];
  const holdExercises = [
    "Side Plank",
    "Forward Head Posture Hold",
    "Single Leg Glute Bridge",
    "Lying Floor Row Hold",
    "Holding Squat",
    "Hip Flexor Stretch",
    "Bent Arm Chest Stretch",
    "Sitting Neck Flexion Stretch",
    "Kneeling Thoracic Spine Extension",
  ];
  const perSideRepExercises = ["Seated Upright Twists", "Bird Dog", "Dead Bug", "Shoulder Lateral Rotation"];
  const repExercises = [
    "Glute Bridge",
    "Pelvic Tilt",
    "Chin Tuck",
    "Cat Cow Stretch",
    "Standing Scapular External Rotation",
    "Wall Angels Standing",
    "Sitting Thoracic Spine Flexion",
  ];
  const perSideHoldExercises = ["Side Plank", "Hip Flexor Stretch", "Bent Arm Chest Stretch", "Single Leg Glute Bridge"];

  if (breathingExercises.includes(base.name)) {
    base.durationSecs = 54;
    base.dosage = "6 slow breaths";
    return base;
  }

  if (perSideHoldExercises.includes(base.name)) {
    base.durationSecs = c.perSideHold * 2;
    base.dosage = `${c.sets} x ${c.perSideHold}s each side`;
    return base;
  }

  if (holdExercises.includes(base.name)) {
    base.durationSecs = c.hold;
    base.dosage = `${c.sets} x ${c.hold}s hold`;
    return base;
  }

  if (perSideRepExercises.includes(base.name)) {
    base.durationSecs = c.reps * 3;
    base.dosage = `${c.sets} x ${c.reps} reps per side`;
    return base;
  }

  if (repExercises.includes(base.name)) {
    base.durationSecs = c.reps * 3;
    base.dosage = `${c.sets} x ${c.reps} reps`;
    return base;
  }

  base.durationSecs = c.hold;
  base.dosage = `${c.sets} x ${c.hold}s`;
  return base;
}

function normalizeExercise(ex, index = 0) {
  return {
    id: ex?.id || `${ex?.name || "exercise"}-${index}`,
    name: ex?.name || "Exercise",
    category: ex?.category || "mobility",
    durationSecs: ex?.durationSecs || 30,
    dosage: ex?.dosage || "",
    instructions:
      Array.isArray(ex?.instructions) && ex.instructions.length
        ? ex.instructions
        : ["Move slowly and stay controlled."],
    video: ex?.video || "",
    gif: ex?.gif || "",
    image: ex?.image || "",
  };
}

function getChairOnlyPlan() {
  return [
    "360 Breathing",
    "Sitting Neck Flexion Stretch",
    "Seated Upright Twists",
    "Sitting Thoracic Spine Flexion",
    "Chin Tuck",
  ];
}

function getPlanTemplate(planType, dayIndex) {
  const plans = {
    neck: [
      ["360 Breathing", "Chin Tuck", "Forward Head Posture Hold", "Bent Arm Chest Stretch", "Wall Angels Standing"],
      ["360 Breathing", "Sitting Neck Flexion Stretch", "Standing Scapular External Rotation", "Seated Upright Twists", "Bent Arm Chest Stretch"],
    ],
    mid_back: [
      ["360 Breathing", "Wall Angels Standing", "Kneeling Thoracic Spine Extension", "Lying Floor Row Hold", "Bent Arm Chest Stretch"],
      ["360 Breathing", "Seated Upright Twists", "Sitting Thoracic Spine Flexion", "Standing Scapular External Rotation", "Wall Angels Standing"],
    ],
    low_back: [
      ["360 Breathing", "Pelvic Tilt", "Dead Bug", "Glute Bridge", "Cat Cow Stretch"],
      ["360 Breathing", "Bird Dog", "Side Plank", "Single Leg Glute Bridge", "Pelvic Tilt"],
    ],
    balanced: [
      ["360 Breathing", "Chin Tuck", "Seated Upright Twists", "Glute Bridge", "Wall Angels Standing"],
      ["360 Breathing", "Forward Head Posture Hold", "Kneeling Thoracic Spine Extension", "Bird Dog", "Bent Arm Chest Stretch"],
      ["360 Breathing", "Sitting Neck Flexion Stretch", "Sitting Thoracic Spine Flexion", "Dead Bug", "Standing Scapular External Rotation"],
    ],
  };

  const selected = plans[planType] || plans.balanced;
  return selected[dayIndex % selected.length];
}

function getExerciseObjects(planType, dayIndex, level, chairOnly) {
  const library = buildExerciseLibrary();
  const names = chairOnly ? getChairOnlyPlan() : getPlanTemplate(planType, dayIndex);

  return names.map((name, index) =>
    normalizeExercise(withLevel(library[name] || { name, category: "mobility" }, level), index)
  );
}

function getNextHigherLevel(level) {
  if (level === "easy") return "moderate";
  if (level === "moderate") return "hard";
  return "hard";
}

function getNextLowerLevel(level) {
  if (level === "hard") return "moderate";
  if (level === "moderate") return "easy";
  return "easy";
}

export default function Routine() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [routineCompleted, setRoutineCompleted] = useState(false);
  const [earnedToday, setEarnedToday] = useState(null);
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [chairOnlyToday, setChairOnlyToday] = useState(false);
  const [scoreSnapshot, setScoreSnapshot] = useState(null);
  const [completedScores, setCompletedScores] = useState(null);
  const [todayKey, setTodayKey] = useState(getTodayKey());
  const [lockedDayIndex, setLockedDayIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setChairOnlyToday(false);

        const storedDayKey = loadLocalJSON(STORAGE_KEYS.routineDayKey, null);
        const storedLockedDayIndex = loadLocalJSON(STORAGE_KEYS.lockedDayIndex, null);
        const storedCompletedDayKey = loadLocalJSON(STORAGE_KEYS.completedDayKey, null);
        const currentDayKey = getTodayKey();

        setTodayKey(currentDayKey);
        setRoutineCompleted(storedCompletedDayKey === currentDayKey);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser ?? null);

        if (!currentUser?.id) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) throw error;

        setProfile(data || null);

        const currentStreak = data?.current_streak || 0;
        const computedDayIndex = currentStreak % 7;

        if (storedDayKey === currentDayKey && typeof storedLockedDayIndex === "number") {
          setLockedDayIndex(storedLockedDayIndex);
        } else {
          setLockedDayIndex(computedDayIndex);
          saveLocalJSON(STORAGE_KEYS.routineDayKey, currentDayKey);
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
        setScoreSnapshot(null);
        setCompletedScores(null);

        saveLocalJSON(STORAGE_KEYS.routineDayKey, newTodayKey);
        saveLocalJSON(STORAGE_KEYS.lockedDayIndex, nextDayIndex);
        saveLocalJSON(STORAGE_KEYS.completedDayKey, null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [todayKey, profile]);

  const streak = profile?.current_streak || 0;
  const dayIndex = lockedDayIndex;
  const planType = profile?.plan_type || "balanced";
  const routineLevel = profile?.routine_level || "moderate";
  const effectiveLevel = chairOnlyToday ? "easy" : routineLevel;
  const spineScore = typeof profile?.spine_score === "number" ? profile.spine_score : 0;
  const spineLevel = getSpineLevel(spineScore);
  const nextThresh = getNextLevelThreshold(spineScore);

  const exercises = useMemo(() => {
    return getExerciseObjects(planType, dayIndex, effectiveLevel, chairOnlyToday);
  }, [planType, dayIndex, effectiveLevel, chairOnlyToday]);

  const totalMins = Math.round(
    exercises.reduce((sum, ex) => sum + (ex.durationSecs || 0), 0) / 60
  );

  const mobilityCount = exercises.filter((e) => e.category === "mobility").length;
  const strengthCount = exercises.filter(
    (e) => e.category === "strength" || e.category === "stability"
  ).length;

  const todayFocus = chairOnlyToday ? "Chair-only recovery day" : getTodayFocus(planType);
  const progressMsg = getProgressMessage(streak);

  const handleTooEasy = async () => {
    if (!user?.id || !profile) return;

    try {
      const nextLevel = getNextHigherLevel(profile?.routine_level || "moderate");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          routine_level: nextLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (err) {
      console.error("[Routine] too easy error:", err);
    }
  };

  const handleTooHard = async () => {
    if (!user?.id || !profile) return;

    try {
      const nextLevel = getNextLowerLevel(profile?.routine_level || "moderate");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          routine_level: nextLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (err) {
      console.error("[Routine] too hard error:", err);
    }
  };

  const handleChairOnly = () => setChairOnlyToday(true);

  const handleWorkoutComplete = async () => {
    if (routineCompleted) {
      return {
        scoreSnapshot,
        newScores: completedScores,
      };
    }

    if (!user?.id || !profile) return null;

    try {
      const previousConsistency = Number(profile?.consistency_score ?? 50);
      const structuralScore = Number(profile?.structural_score ?? 50);
      const previousMobility = Number(profile?.mobility_score ?? 50);
      const previousStrength = Number(profile?.strength_score ?? 50);
      const previousSpineScore = Number(profile?.spine_score ?? 0);

      const snapshot = {
        spineScore: previousSpineScore,
        mobilityScore: previousMobility,
        strengthScore: previousStrength,
        consistencyScore: previousConsistency,
      };

      const newConsistency = Math.min(100, previousConsistency + 2);
      const newMobility = Math.min(100, previousMobility + mobilityCount * 0.8);
      const newStrength = Math.min(100, previousStrength + strengthCount * 0.8);

      const scores = {
        spineScore: Math.round(
          structuralScore * 0.4 +
            newConsistency * 0.2 +
            newMobility * 0.2 +
            newStrength * 0.2
        ),
        mobilityScore: Math.round(newMobility),
        strengthScore: Math.round(newStrength),
        consistencyScore: Math.round(newConsistency),
      };

      setScoreSnapshot(snapshot);
      setCompletedScores(scores);

      const newStreak = (profile?.current_streak || 0) + 1;
      const newLongestStreak = Math.max(newStreak, profile?.longest_streak || 0);

      let nextLevel = profile?.routine_level || "moderate";
      if (newStreak % 7 === 0) nextLevel = getNextHigherLevel(nextLevel);

      const { data, error } = await supabase
        .from("profiles")
        .update({
          consistency_score: scores.consistencyScore,
          mobility_score: scores.mobilityScore,
          strength_score: scores.strengthScore,
          spine_score: scores.spineScore,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          routine_level: nextLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setRoutineCompleted(true);
      setEarnedToday({
        spineScore: scores.spineScore,
        prevSpineScore: previousSpineScore,
      });
      setChairOnlyToday(false);

      saveLocalJSON(STORAGE_KEYS.routineDayKey, todayKey);
      saveLocalJSON(STORAGE_KEYS.lockedDayIndex, dayIndex);
      saveLocalJSON(STORAGE_KEYS.completedDayKey, todayKey);

      return {
        scoreSnapshot: snapshot,
        newScores: scores,
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
        scoreSnapshot={scoreSnapshot}
        newScores={completedScores}
        mobilityCount={mobilityCount}
        strengthCount={strengthCount}
        onComplete={handleWorkoutComplete}
        onSeeProgress={() => {
          setSessionActive(false);
          window.location.href = "/progress";
        }}
        onExit={() => setSessionActive(false)}
      />
    );
  }

  return (
    <div className="px-4 pt-8 pb-28 max-w-lg mx-auto">
      <DailyAdjustSheet
        open={showAdjuster}
        onClose={() => setShowAdjuster(false)}
        onTooEasy={handleTooEasy}
        onTooHard={handleTooHard}
        onChairOnly={handleChairOnly}
        currentLevel={routineLevel}
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">
              SpineLab Daily
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              Today's Routine
            </h1>
          </div>

          <button
            onClick={() => setShowAdjuster(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
              Adjust
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border capitalize">
            {chairOnlyToday ? "chair only" : routineLevel}
          </span>

          <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border capitalize">
            {planType.replace("_", " ")}
          </span>

          {streak > 0 && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-xl border border-primary/10">
              <Flame className="w-3 h-3" />
              {streak} day streak
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl border ${spineLevel.bg} ${spineLevel.color}`}
          >
            <Zap className="w-3 h-3" />
            {spineLevel.title}
          </span>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-1">Today's focus</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {todayFocus}. Each session moves your Spine Score closer to the next level.
              </p>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-2xl bg-secondary/70 px-3 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Time
              </p>
              <p className="text-sm font-bold">~{totalMins} min</p>
            </div>

            <div className="rounded-2xl bg-secondary/70 px-3 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Moves
              </p>
              <p className="text-sm font-bold">{exercises.length}</p>
            </div>

            <div className="rounded-2xl bg-secondary/70 px-3 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Level
              </p>
              <p className="text-sm font-bold" style={{ color: spineLevel.ring }}>
                {spineLevel.title}
              </p>
            </div>
          </div>

          {nextThresh && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Progress to {getSpineLevel(nextThresh).title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {nextThresh - spineScore} pts to go
                </p>
              </div>

              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: spineLevel.ring,
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round(
                          ((spineScore -
                            ([0, 40, 55, 70, 85, 100][spineLevel.level - 1] || 0)) /
                            (nextThresh -
                              ([0, 40, 55, 70, 85, 100][spineLevel.level - 1] || 0))) *
                            100
                        )
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {progressMsg && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-primary/5 border border-primary/10 px-3 py-3">
              <Trophy className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/85">{progressMsg}</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="space-y-3 mb-6"
      >
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            className="w-full rounded-[26px] border border-border bg-card px-4 py-3.5 text-left hover:bg-secondary/40 active:scale-[0.995] transition-all"
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

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      CATEGORY_COLORS[ex.category] ||
                      "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {CATEGORY_LABELS[ex.category] || ex.category}
                  </span>

                  {i === 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-100 text-sky-700 border-sky-200">
                      Start here
                    </span>
                  )}
                </div>

                <p className="text-[15px] font-semibold leading-snug">
                  {ex.name}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  {ex.dosage || ex.instructions?.[0] || "Move slowly and stay controlled."}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground/80">
                  {formatDuration(ex.durationSecs)}
                </p>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 ml-auto mt-1.5" />
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      <MedicalDisclaimer className="mb-5" />

      {!showAdjuster && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-3"
          style={{ paddingBottom: `max(10px, env(safe-area-inset-bottom, 10px))` }}
        >
          {routineCompleted ? (
            <div className="bg-primary/10 rounded-3xl p-6 text-center border border-primary/10">
              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
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
              className="w-full h-16 rounded-2xl text-base font-bold gap-3 shadow-lg"
              disabled={exercises.length === 0}
            >
              <Play className="w-5 h-5" />
              Start Today's Routine
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}