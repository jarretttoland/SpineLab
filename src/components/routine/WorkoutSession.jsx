import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  CheckCircle2,
  Flame,
  Trophy,
  Sparkles,
  Star,
} from "lucide-react";
import ExerciseTimer from "./ExerciseTimer";

function getSessionReward(streak = 0) {
  const nextStreak = (streak || 0) + 1;

  if (nextStreak % 7 === 0) {
    return { points: 30, label: "7-day streak bonus" };
  }

  if (nextStreak % 3 === 0) {
    return { points: 20, label: "3-day streak bonus" };
  }

  return { points: 10, label: "Daily completion" };
}

export default function WorkoutSession({
  exercises = [],
  dayOfPlan,
  streak,
  onComplete,
  onExit,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showFinish, setShowFinish] = useState(false);

  const reward = useMemo(() => getSessionReward(streak), [streak]);
  const current = exercises?.[currentIndex];

  const handleExerciseComplete = () => {
    const next = currentIndex + 1;
    setCompletedCount((c) => c + 1);

    if (next >= exercises.length) {
      setShowFinish(true);
    } else {
      setCurrentIndex(next);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleFinish = () => {
    onComplete?.();
  };

  if (showFinish) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-background flex items-center justify-center px-6"
      >
        <div className="w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-11 h-11 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-black tracking-tight mb-2"
          >
            Day {dayOfPlan} complete
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14 }}
            className="text-muted-foreground mb-3"
          >
            You completed {completedCount} of {exercises.length} exercises today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card px-4 py-4 mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">Daily win locked in</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Small consistent sessions are what move your posture score over time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 mb-5"
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Star className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-700">
                +{reward.points} points earned
              </p>
            </div>
            <p className="text-xs text-amber-700/80">{reward.label}</p>
          </motion.div>

          {streak >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-8"
            >
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                {streak + 1} day streak
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="space-y-3"
          >
            <Button
              onClick={handleFinish}
              className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Save & Finish
            </Button>

            <Button
              variant="ghost"
              onClick={onExit}
              className="w-full h-11 text-muted-foreground text-sm"
            >
              Back to routine
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!current) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-semibold text-lg mb-4">
            Workout unavailable. Please refresh.
          </p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      <button
        onClick={onExit}
        className="fixed top-4 right-4 z-30 w-10 h-10 bg-background/95 border border-border rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm"
        style={{ top: `max(16px, env(safe-area-inset-top, 16px))` }}
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence mode="wait">
        <ExerciseTimer
          key={`${current.id}-${currentIndex}`}
          exercise={current}
          exerciseIndex={currentIndex}
          totalExercises={exercises.length}
          onComplete={handleExerciseComplete}
          onPrev={currentIndex > 0 ? handlePrev : null}
        />
      </AnimatePresence>
    </div>
  );
}