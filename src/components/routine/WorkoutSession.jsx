import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import ExerciseTimer from "./ExerciseTimer";
import CompletionCelebration from "./CompletionCelebration";

export default function WorkoutSession({
  exercises = [],
  dayOfPlan,
  streak,
  mobilityCount,
  strengthCount,
  onComplete,
  onReturnDashboard,
  onExit,
}) {
  const [currentIndex, setCurrentIndex]       = useState(0);
  const [completedCount, setCompletedCount]   = useState(0);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  const current = exercises?.[currentIndex];

  const handleExerciseComplete = async () => {
    const next              = currentIndex + 1;
    const nextCompletedCount = completedCount + 1;
    setCompletedCount(nextCompletedCount);

    if (next >= exercises.length) {
      setSavingCompletion(true);
      try {
        const result = await onComplete?.();
        if (!result?.scoreSnapshot || !result?.newScores) {
          console.error("[WorkoutSession] Missing completion result:", result);
          return;
        }
        setCompletionResult(result);
      } catch (err) {
        console.error("[WorkoutSession] completion error:", err);
      } finally {
        setSavingCompletion(false);
      }
      return;
    }

    setCurrentIndex(next);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (savingCompletion) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="font-semibold text-lg">Saving your progress...</p>
          <p className="text-sm text-muted-foreground mt-1">Building today's score update.</p>
        </div>
      </div>
    );
  }

  if (completionResult) {
    return (
      <CompletionCelebration
        dayOfPlan={dayOfPlan}
        streak={streak}
        scoreSnapshot={completionResult.scoreSnapshot}
        newScores={completionResult.newScores}
        exerciseCount={exercises.length}
        mobilityCount={mobilityCount}
        strengthCount={strengthCount}
        onFinish={onReturnDashboard}
        onBack={onExit}
      />
    );
  }

  if (!current) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-semibold text-lg mb-4">Workout unavailable. Please refresh.</p>
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