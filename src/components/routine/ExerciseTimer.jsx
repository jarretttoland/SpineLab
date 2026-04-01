/**
 * ExerciseTimer — used inside WorkoutSession for the full daily routine.
 * Layout: fixed full-screen, scrollable content, STICKY bottom nav with Prev/Next.
 * Breathing: guided timer. All others: instruction-based.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import ExerciseIllustration from "./ExerciseIllustration";

const CATEGORY_COLORS = {
  breathing: "text-sky-600 bg-sky-50 border-sky-200",
  posture:   "text-violet-600 bg-violet-50 border-violet-200",
  mobility:  "text-emerald-600 bg-emerald-50 border-emerald-200",
  stability: "text-orange-500 bg-orange-50 border-orange-200",
};

const BREATH_INHALE = 4;
const BREATH_EXHALE = 5;
const BREATH_CYCLE  = BREATH_INHALE + BREATH_EXHALE;
const TOTAL_BREATHS = 6;

// ── Breathing timer widget ─────────────────────────────────────────────────
function BreathingTimer() {
  const totalSecs = TOTAL_BREATHS * BREATH_CYCLE;
  const [secondsLeft, setSecondsLeft] = useState(totalSecs);
  const [running, setRunning]         = useState(false);
  const [done, setDone]               = useState(false);
  const [elapsed, setElapsed]         = useState(0);
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
  const R             = 40;
  const circumference = 2 * Math.PI * R;
  const progress      = 1 - secondsLeft / totalSecs;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative w-22 h-22">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7"/>
          <motion.circle cx="50" cy="50" r={R} fill="none" stroke="#0ea5e9"
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.5, ease: "linear" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? <CheckCircle2 className="w-6 h-6 text-sky-500"/> : (
            <>
              <span className="text-xl font-black tabular-nums leading-none text-sky-600">{secondsLeft}</span>
              <span className="text-[9px] text-muted-foreground">{breathNum}/{TOTAL_BREATHS}</span>
            </>
          )}
        </div>
      </div>
      {!done && (
        <AnimatePresence mode="wait">
          <motion.span key={isInhale ? "in" : "out"}
            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            className="text-sm font-semibold text-sky-600">
            {running ? (isInhale ? "Inhale through nose…" : "Exhale slowly…") : "Press play to begin"}
          </motion.span>
        </AnimatePresence>
      )}
      {running && !done && (
        <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-sky-400 rounded-full"
            animate={{ width: `${phaseProgress * 100}%` }} transition={{ duration: 0.5, ease: "linear" }}/>
        </div>
      )}
      {done && <p className="text-sm font-semibold text-sky-600">{TOTAL_BREATHS} breaths ✓</p>}
      <button onClick={() => !done && setRunning((r) => !r)} disabled={done}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow transition-all active:scale-95 disabled:opacity-40 ${
          running ? "bg-secondary text-foreground" : "bg-sky-500 text-white"
        }`}>
        {running ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4 translate-x-0.5"/>}
      </button>
    </div>
  );
}

// ── Navigation card ────────────────────────────────────────────────────────
function StickyNav({ exerciseIndex, totalExercises, onPrev, onNext }) {
  const isFirst = exerciseIndex === 0;
  const isLast  = exerciseIndex === totalExercises - 1;
  return (
    <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-4 pt-3 pb-4"
      style={{ paddingBottom: `max(16px, env(safe-area-inset-bottom, 16px))` }}>
      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {Array.from({ length: totalExercises }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === exerciseIndex ? "w-5 h-2 bg-primary" : i < exerciseIndex ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-border"
          }`}/>
        ))}
      </div>
      {/* Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}
          className="flex-1 h-14 rounded-2xl font-semibold gap-2 disabled:opacity-25">
          <ChevronLeft className="w-5 h-5"/> Prev
        </Button>
        <Button onClick={onNext} className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-sm">
          {isLast ? <><CheckCircle2 className="w-5 h-5"/> Finish</> : <>Next <ChevronRight className="w-5 h-5"/></>}
        </Button>
      </div>
    </div>
  );
}

// ── Shared layout ──────────────────────────────────────────────────────────
function ExerciseLayout({ exercise, exerciseIndex, totalExercises, onComplete, onPrev }) {
  const catStyle = CATEGORY_COLORS[exercise.category] || "text-primary bg-primary/10 border-primary/20";
  const isBreathing = exercise.category === "breathing";

  return (
    <motion.div
      key={exercise.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col w-full h-full bg-background"
    >
      {/* Progress bar */}
      <div className="h-1 bg-secondary flex-shrink-0">
        <motion.div className="h-full bg-primary" initial={{ width: 0 }}
          animate={{ width: `${(exerciseIndex / totalExercises) * 100}%` }} transition={{ duration: 0.5 }}/>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{exerciseIndex + 1} / {totalExercises}</span>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${catStyle}`}>
          {exercise.category}
        </span>
      </div>
      <div className="flex-shrink-0 px-4 pb-2">
        <h1 className="text-lg font-bold tracking-tight leading-tight">{exercise.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{exercise.dosage}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {/* Illustration */}
        <div className="relative rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: "4/3" }}>
          <ExerciseIllustration type={exercise.silhouette} category={exercise.category} className="w-full h-full"/>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-background/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Video coming soon
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 mb-3">
          {(exercise.instructions || []).map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{line}</p>
            </div>
          ))}
        </div>

        {/* Breathing timer */}
        {isBreathing && (
          <div className="bg-sky-50 dark:bg-sky-950/30 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/40 mb-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-sky-600 mb-3 text-center">Guided Breathing</h3>
            <BreathingTimer/>
          </div>
        )}
      </div>

      {/* Sticky nav */}
      <StickyNav
        exerciseIndex={exerciseIndex}
        totalExercises={totalExercises}
        onPrev={onPrev || (() => {})}
        onNext={onComplete}
      />
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ExerciseTimer({ exercise, exerciseIndex, totalExercises, onComplete, onSkip, onPrev }) {
  if (!exercise) return null;
  return (
    <ExerciseLayout
      exercise={exercise}
      exerciseIndex={exerciseIndex}
      totalExercises={totalExercises}
      onComplete={onComplete}
      onPrev={onPrev}
    />
  );
}