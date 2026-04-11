import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Target,
  Wind,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import ExerciseMedia from "./ExerciseMedia";

const CATEGORY_COLORS = {
  breathing: "text-sky-600 bg-sky-50 border-sky-200",
  posture: "text-violet-600 bg-violet-50 border-violet-200",
  mobility: "text-emerald-600 bg-emerald-50 border-emerald-200",
  stability: "text-orange-500 bg-orange-50 border-orange-200",
  strength: "text-rose-600 bg-rose-50 border-rose-200",
};

function parseInstructions(instructions = []) {
  return {
    setup: instructions[0] || "Set up in a comfortable starting position.",
    movement: instructions[1] || "Move slowly and with control.",
    breathing: instructions[2] || "Breathe normally while staying relaxed.",
  };
}

function CueBlock({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MidNav({ exerciseIndex, totalExercises, onPrev, onNext }) {
  const isFirst = exerciseIndex === 0;
  const isLast = exerciseIndex === totalExercises - 1;

  return (
    <div className="rounded-3xl border border-border bg-card p-3">
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {Array.from({ length: totalExercises }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === exerciseIndex
                ? "w-5 h-2 bg-primary"
                : i < exerciseIndex
                ? "w-2 h-2 bg-primary/40"
                : "w-2 h-2 bg-border"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 h-12 rounded-2xl font-semibold text-sm gap-2 disabled:opacity-25"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          onClick={onNext}
          className="flex-1 h-12 rounded-2xl font-bold text-sm gap-2 shadow-sm"
        >
          {isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Done
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function getMediaLabel(exercise) {
  if (exercise?.video) return "Video demo";
  if (exercise?.gif) return "Animated demo";
  if (exercise?.image) return "Reference image";
  return "Exercise preview";
}

export default function ExerciseDetailView({
  exercise,
  exercises,
  exerciseIndex,
  onBack,
  onNavigate,
}) {
  const totalExercises = exercises?.length || 1;

  if (!exercise) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-semibold text-lg mb-4">Exercise unavailable.</p>
          <Button onClick={onBack}>Back</Button>
        </div>
      </div>
    );
  }

  const { setup, movement, breathing } = parseInstructions(exercise.instructions);

  const catStyle =
    CATEGORY_COLORS[exercise.category] ||
    "text-primary bg-primary/10 border-primary/20";

  const handlePrev = () => {
    if (exerciseIndex > 0) onNavigate(exerciseIndex - 1);
  };

  const handleNext = () => {
    if (exerciseIndex < totalExercises - 1) onNavigate(exerciseIndex + 1);
    else onBack();
  };

  const isBreathing = exercise.category === "breathing";

  return (
    <div className="fixed inset-0 bg-background">
      <div
        className="px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-20"
        style={{ paddingTop: `max(12px, env(safe-area-inset-top, 12px))` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Exercise {exerciseIndex + 1} of {totalExercises}
            </p>
            <h1 className="text-lg font-bold leading-tight truncate">{exercise.name}</h1>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize border ${catStyle}`}
          >
            {exercise.category}
          </span>
        </div>
      </div>

      <div
        className="max-w-lg mx-auto h-[calc(100vh-76px)] overflow-y-auto px-4 pt-4 pb-24"
        style={{ paddingBottom: `max(96px, env(safe-area-inset-bottom, 96px))` }}
      >
        <div className="space-y-3">
          <MidNav
            exerciseIndex={exerciseIndex}
            totalExercises={totalExercises}
            onPrev={handlePrev}
            onNext={handleNext}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden border border-border bg-card"
          >
            <div className="h-[220px] bg-white dark:bg-slate-950">
              <ExerciseMedia exercise={exercise} className="w-full h-full" />
            </div>

            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-sm font-semibold">
                {exercise.dosage || "Move with control"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getMediaLabel(exercise)}
              </p>
            </div>
          </motion.div>

          <div className="space-y-3">
            <CueBlock icon={Info} title="Set up" text={setup} />

            <CueBlock icon={Target} title="How to do it" text={movement} />

            {isBreathing && (
              <CueBlock icon={Wind} title="Breathing cue" text={breathing} />
            )}

            <CueBlock
              icon={AlertCircle}
              title="Common mistake"
              text="Move slowly, stay controlled, and do not force range or strain into pain."
            />
          </div>
        </div>
      </div>
    </div>
  );
}