import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ExerciseTimer from "./ExerciseTimer";
import CompletionCelebration from "./CompletionCelebration";

function getSessionReward(streak = 0) {
  const nextStreak = (streak || 0) + 1;
  if (nextStreak % 7 === 0) return { points: 30, label: "7-day streak bonus" };
  if (nextStreak % 3 === 0) return { points: 20, label: "3-day streak bonus" };
  return { points: 10, label: "Daily completion" };
}

export default function WorkoutSession({
  exercises = [],
  dayOfPlan,
  streak,
  scoreSnapshot,
  newScores,
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
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (showFinish) {
    return (
      <CompletionCelebration
        dayOfPlan={dayOfPlan}
        streak={streak}
        reward={reward}
        scoreSnapshot={scoreSnapshot}
        newScores={newScores}
        exerciseCount={completedCount}
        onFinish={onComplete}
        onBack={onExit}
      />
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