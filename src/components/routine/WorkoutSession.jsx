/**
 * WorkoutSession — runs the full daily workout flow.
 * Handles the exercise sequence with auto-transition between exercises.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, Flame, Trophy } from "lucide-react";
import ExerciseTimer from "./ExerciseTimer";

export default function WorkoutSession({ exercises, dayOfPlan, streak, onComplete, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showFinish, setShowFinish] = useState(false);

  const handleExerciseComplete = () => {
    const next = currentIndex + 1;
    setCompletedCount((c) => c + 1);
    if (next >= exercises.length) {
      setShowFinish(true);
    } else {
      setCurrentIndex(next);
    }
  };

  const handleSkip = () => {
    const next = currentIndex + 1;
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
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col min-h-screen bg-background items-center justify-center px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black tracking-tight mb-2"
        >
          Day {dayOfPlan} done!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-2"
        >
          {completedCount} of {exercises.length} exercises completed
        </motion.p>

        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-8"
          >
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{streak + 1} day streak</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-3"
        >
          <Button onClick={onComplete} className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
            <CheckCircle2 className="w-5 h-5" /> Save & Finish
          </Button>
          <Button variant="ghost" onClick={onExit} className="w-full h-10 text-muted-foreground text-sm">
            Back to routine
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  const current = exercises[currentIndex];

  // Safety: if exercises array is somehow empty
  if (!current) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="font-semibold text-lg">Workout unavailable. Please refresh.</p>
        <Button onClick={onExit}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Exit button — sits above ExerciseTimer content */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-20 w-9 h-9 bg-secondary rounded-full flex items-center justify-center"
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
          onSkip={handleSkip}
          onPrev={currentIndex > 0 ? handlePrev : null}
        />
      </AnimatePresence>
    </div>
  );
}