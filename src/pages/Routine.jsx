import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, SlidersHorizontal, Play, Check, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { useCurrentUser } from "@/lib/useCurrentUser";
import MedicalDisclaimer from "@/components/legal/MedicalDisclaimer";
import ExerciseSilhouette from "@/components/routine/ExerciseSilhouette";
import WorkoutSession from "@/components/routine/WorkoutSession";
import ExerciseDetailView from "@/components/routine/ExerciseDetailView";
import DailyAdjustSheet from "@/components/routine/DailyAdjustSheet";
import {
  generateDailySystemPlan,
  resolveLevel,
  getDayIndex,
  getDayOfPlan,
  isSeatedMode,
  applyIntensity,
  getProgressMessage,
  LEVELS,
} from "@/lib/dailySystem";

const CATEGORY_COLORS = {
  breathing: "bg-sky-100 text-sky-700",
  posture:   "bg-violet-100 text-violet-700",
  mobility:  "bg-emerald-100 text-emerald-700",
  stability: "bg-orange-100 text-orange-700",
};

export default function Routine() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: checkIns } = useQuery({
    queryKey: ["checkIns", user?.email],
    queryFn: () => base44.entities.DailyCheckIn.filter({ created_by: user.email }, "-created_date", 60),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCheckIn = checkIns.find((c) => c.date === todayStr);
  const routineCompleted = todayCheckIn?.completed;

  // ── Session state ────────────────────────────────────────────────────────
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null); // single exercise preview
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [activeRestrictions, setActiveRestrictions] = useState([]);
  const [tempLevelOverride, setTempLevelOverride] = useState(null); // "easy" for today only
  const [permanentLevelBoost, setPermanentLevelBoost] = useState(null); // forced level up

  // ── Plan generation ──────────────────────────────────────────────────────
  const baseLevel = resolveLevel(checkIns);
  const effectiveLevel = permanentLevelBoost
    ? permanentLevelBoost
    : tempLevelOverride
    ? tempLevelOverride
    : baseLevel;

  const seatedMode = isSeatedMode(activeRestrictions);
  const dayIndex   = getDayIndex(checkIns);
  const dayOfPlan  = getDayOfPlan(checkIns);

  // Real consecutive streak — computed from actual check-in dates
  const completedDates = useMemo(() => new Set(checkIns.filter((c) => c.completed).map((c) => c.date)), [checkIns]);
  const computeStreak = (datesSet) => {
    let count = 0;
    let cur = new Date();
    // Don't count today yet if not completed
    if (!datesSet.has(format(cur, "yyyy-MM-dd"))) cur = subDays(cur, 1);
    while (datesSet.has(format(cur, "yyyy-MM-dd"))) { count++; cur = subDays(cur, 1); }
    return count;
  };
  const streak = useMemo(() => computeStreak(completedDates), [completedDates]);

  const exercises = useMemo(
    () => generateDailySystemPlan(dayIndex, effectiveLevel, seatedMode),
    [dayIndex, effectiveLevel, seatedMode]
  );

  const totalMins = Math.round(exercises.reduce((a, e) => a + e.durationSecs, 0) / 60);
  const progressMsg = getProgressMessage(streak);

  // ── Mutations ────────────────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async () => {
      const newScore = Math.min(100, (profile?.spine_score || 50) + 1);

      // Save today's check-in
      if (todayCheckIn) {
        await base44.entities.DailyCheckIn.update(todayCheckIn.id, { completed: true, spine_score: newScore });
      } else {
        await base44.entities.DailyCheckIn.create({ date: todayStr, completed: true, spine_score: newScore });
      }

      // Compute real streak from dates (today now counts)
      const newDatesSet = new Set([...completedDates, todayStr]);
      let newStreak = 0;
      let cur = new Date();
      while (newDatesSet.has(format(cur, "yyyy-MM-dd"))) { newStreak++; cur = subDays(cur, 1); }
      const longestStreak = Math.max(newStreak, profile?.longest_streak || 0);

      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          current_streak: newStreak,
          longest_streak: longestStreak,
          spine_score: newScore,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.email] });
    },
  });

  const handleWorkoutComplete = () => {
    setSessionActive(false);
    setTempLevelOverride(null); // Reset today-only override
    completeMutation.mutate();
  };

  const handleLowerIntensity = () => setTempLevelOverride("easy");

  const handleMakeHarder = () => {
    const idx = LEVELS.indexOf(permanentLevelBoost || baseLevel);
    const next = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
    setPermanentLevelBoost(next);
  };

  const handleRestriction = (id) => {
    setActiveRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // ── Single exercise detail view ───────────────────────────────────────────
  if (selectedExercise !== null) {
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

  // ── Full session active → full screen ────────────────────────────────────
  if (sessionActive) {
    return (
      <WorkoutSession
        exercises={exercises}
        dayOfPlan={dayOfPlan}
        streak={streak}
        onComplete={handleWorkoutComplete}
        onExit={() => setSessionActive(false)}
      />
    );
  }

  return (
    <div className="px-5 pt-12 pb-10">
      <DailyAdjustSheet
        open={showAdjuster}
        onClose={() => setShowAdjuster(false)}
        onLowerIntensity={handleLowerIntensity}
        onMakeHarder={handleMakeHarder}
        onRestriction={handleRestriction}
        activeRestrictions={activeRestrictions}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">SpineLab Daily</p>
          <button
            onClick={() => setShowAdjuster(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Adjust</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Today's Routine</h1>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground">
            ~{totalMins} min · {exercises.length} exercises
          </span>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-0.5">
              <Flame className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">{streak}</span>
            </div>
          )}
        </div>

        {/* Day + level badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border">
            Day {dayOfPlan} of 7
          </span>
          <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border capitalize">
            {seatedMode ? "Seated Mode" : effectiveLevel}
          </span>
          {progressMsg && (
            <span className="text-xs text-muted-foreground italic">{progressMsg}</span>
          )}
        </div>
      </motion.div>

      {/* Exercise preview list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2.5 mb-6"
      >
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            className="w-full flex items-center gap-3.5 bg-secondary/60 active:bg-secondary rounded-2xl px-4 py-3 transition-colors text-left"
          >
            {/* Silhouette thumbnail */}
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-background rounded-xl">
              <ExerciseSilhouette type={ex.silhouette} className="w-8 h-8" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{ex.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] || "bg-secondary text-muted-foreground"}`}>
                  {ex.category}
                </span>
                <span className="text-[11px] text-muted-foreground">{ex.dosage}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {ex.durationSecs < 60 ? `${ex.durationSecs}s` : `${Math.ceil(ex.durationSecs / 60)}m`}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </button>
        ))}
      </motion.div>

      <MedicalDisclaimer className="mb-6" />

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        {routineCompleted ? (
          <div className="bg-primary/10 rounded-3xl p-6 text-center">
            <Check className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Today's routine done!</p>
            <p className="text-sm text-muted-foreground">Great work. See you tomorrow.</p>
          </div>
        ) : (
          <Button
            onClick={() => setSessionActive(true)}
            className="w-full h-16 rounded-2xl text-base font-bold gap-3 shadow-lg"
          >
            <Play className="w-5 h-5" />
            Start Today's Routine
          </Button>
        )}
      </motion.div>
    </div>
  );
}