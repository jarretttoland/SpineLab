/**
 * ExerciseDetailView — single exercise detail screen.
 *
 * Layout (non-scrolling, fixed full-screen):
 *   ┌─────────────────────────────┐
 *   │ Header (back + title + tag) │  fixed
 *   ├─────────────────────────────┤
 *   │ Photo / image               │  fixed height
 *   ├─────────────────────────────┤
 *   │ Instructions (scrollable)   │  flex-1 overflow-y-auto
 *   ├─────────────────────────────┤
 *   │ ── NAV CARD ──              │  fixed, with top border + padding
 *   │  [← Prev]      [Next →]    │  clearly above safe area
 *   │  ● ○ ○ ○ ○                 │
 *   └─────────────────────────────┘
 *
 * Navigation card sits ABOVE the bottom safe area with intentional
 * breathing room — never clipped or flush to the screen edge.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import ExerciseIllustration from "./ExerciseIllustration";

const CATEGORY_COLORS = {
  breathing: "text-sky-600 bg-sky-50 border-sky-200",
  posture:   "text-violet-600 bg-violet-50 border-violet-200",
  mobility:  "text-emerald-600 bg-emerald-50 border-emerald-200",
  stability: "text-orange-500 bg-orange-50 border-orange-200",
};

// ── Breathing timer ────────────────────────────────────────────────────────
const BREATH_INHALE = 4;
const BREATH_EXHALE = 5;
const BREATH_CYCLE  = BREATH_INHALE + BREATH_EXHALE;
const TOTAL_BREATHS = 6;

function BreathingTimer() {
  const totalSecs = TOTAL_BREATHS * BREATH_CYCLE;
  const [secondsLeft, setSecondsLeft] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); setDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const breathNum     = Math.min(TOTAL_BREATHS, Math.floor(elapsed / BREATH_CYCLE) + 1);
  const phase         = elapsed % BREATH_CYCLE;
  const isInhale      = phase < BREATH_INHALE;
  const phaseProgress = isInhale ? phase / BREATH_INHALE : (phase - BREATH_INHALE) / BREATH_EXHALE;
  const R             = 36;
  const circumference = 2 * Math.PI * R;
  const progress      = 1 - secondsLeft / totalSecs;

  return (
    <div className="flex items-center gap-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl px-4 py-3 border border-sky-100 dark:border-sky-900/40">
      {/* Circle timer */}
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8"/>
          <motion.circle cx="50" cy="50" r={R} fill="none" stroke="#0ea5e9"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.5, ease: "linear" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done
            ? <CheckCircle2 className="w-5 h-5 text-sky-500"/>
            : <span className="text-lg font-black tabular-nums leading-none text-sky-600">{secondsLeft}</span>
          }
        </div>
      </div>

      {/* Phase cue + controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <AnimatePresence mode="wait">
            <motion.span key={done ? "done" : (running ? (isInhale ? "in" : "out") : "idle")}
              initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm font-semibold text-sky-700 dark:text-sky-400">
              {done
                ? `${TOTAL_BREATHS} breaths complete ✓`
                : running
                  ? (isInhale ? "Inhale through nose…" : "Exhale slowly…")
                  : "Press play to begin"
              }
            </motion.span>
          </AnimatePresence>
          <span className="text-xs text-sky-500 font-medium ml-2 flex-shrink-0">{breathNum}/{TOTAL_BREATHS}</span>
        </div>

        {running && !done && (
          <div className="w-full h-1.5 bg-sky-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-sky-400 rounded-full"
              animate={{ width: `${phaseProgress * 100}%` }}
              transition={{ duration: 0.5, ease: "linear" }}/>
          </div>
        )}

        {!running && !done && elapsed > 0 && (
          <div className="h-1.5"/>
        )}

        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => !done && setRunning((r) => !r)} disabled={done}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-40 ${
              running ? "bg-white border border-sky-200 text-sky-600" : "bg-sky-500 text-white"
            }`}>
            {running ? <Pause className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5 translate-x-0.5"/>}
          </button>
          {elapsed > 0 && !running && !done && (
            <button onClick={() => {
              clearInterval(intervalRef.current);
              setSecondsLeft(totalSecs); setElapsed(0); setRunning(false); setDone(false);
            }} className="w-8 h-8 rounded-full bg-white border border-sky-200 flex items-center justify-center">
              <RotateCcw className="w-3 h-3 text-sky-500"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Navigation card — the key fix ─────────────────────────────────────────
// Sits ABOVE the bottom safe area with intentional padding + visual elevation
function NavCard({ exerciseIndex, totalExercises, onPrev, onNext }) {
  const isFirst = exerciseIndex === 0;
  const isLast  = exerciseIndex === totalExercises - 1;

  return (
    <div className="flex-shrink-0 px-4 pt-3 pb-4"
      style={{ paddingBottom: `max(16px, env(safe-area-inset-bottom, 16px))` }}>

      {/* Step counter + dots */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {Array.from({ length: totalExercises }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === exerciseIndex
              ? "w-5 h-2 bg-primary"
              : i < exerciseIndex
              ? "w-2 h-2 bg-primary/40"
              : "w-2 h-2 bg-border"
          }`}/>
        ))}
      </div>

      {/* Button row — large tap targets, clear visual separation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 h-14 rounded-2xl font-semibold text-sm gap-2 disabled:opacity-25 border-border"
        >
          <ChevronLeft className="w-5 h-5 flex-shrink-0"/>
          Previous
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-14 rounded-2xl font-bold text-sm gap-2 shadow-sm"
        >
          {isLast ? (
            <><CheckCircle2 className="w-5 h-5 flex-shrink-0"/> Done</>
          ) : (
            <>Next <ChevronRight className="w-5 h-5 flex-shrink-0"/></>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ExerciseDetailView({ exercise, exercises, exerciseIndex, onBack, onNavigate }) {
  const totalExercises = exercises?.length || 1;

  const handlePrev = () => {
    if (exerciseIndex > 0) onNavigate(exerciseIndex - 1);
  };

  const handleNext = () => {
    if (exerciseIndex < totalExercises - 1) {
      onNavigate(exerciseIndex + 1);
    } else {
      onBack();
    }
  };

  if (!exercise) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="font-semibold text-lg">Exercise unavailable.</p>
        <Button onClick={onBack}>← Back</Button>
      </div>
    );
  }

  const isBreathing = exercise.category === "breathing";
  const catStyle    = CATEGORY_COLORS[exercise.category] || "text-primary bg-primary/10 border-primary/20";

  return (
    <div className="fixed inset-0 bg-background flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-safe flex items-center gap-3 border-b border-border/40 py-3"
        style={{ paddingTop: `max(12px, env(safe-area-inset-top, 12px))` }}>
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold tracking-tight leading-tight truncate">{exercise.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{exercise.dosage}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize border flex-shrink-0 ${catStyle}`}>
          {exercise.category}
        </span>
      </div>

      {/* ── Photo — fixed 16:9 portrait-friendly height ── */}
      <div className="flex-shrink-0" style={{ height: "36%" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id + "-photo"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <ExerciseIllustration
              type={exercise.silhouette}
              category={exercise.category}
              className="w-full h-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-4 pb-2"
          >
            {/* Instructions */}
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              How to do it
            </h3>
            <div className="space-y-3 mb-4">
              {(exercise.instructions || []).map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-[11px] font-bold text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{line}</p>
                </div>
              ))}
            </div>

            {/* Breathing timer — inline in content area */}
            {isBreathing && (
              <div className="mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Guided Breathing
                </h3>
                <BreathingTimer/>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation card — ABOVE bottom safe area, always visible ── */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm">
        <NavCard
          exerciseIndex={exerciseIndex}
          totalExercises={totalExercises}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

    </div>
  );
}