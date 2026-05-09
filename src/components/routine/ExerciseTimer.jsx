import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wind,
  RefreshCw,
} from "lucide-react";
import ExerciseMedia from "./ExerciseMedia";

const CATEGORY_COLORS = {
  breathing: "text-sky-600 bg-sky-50 border-sky-200",
  posture: "text-violet-600 bg-violet-50 border-violet-200",
  mobility: "text-emerald-600 bg-emerald-50 border-emerald-200",
  stability: "text-orange-500 bg-orange-50 border-orange-200",
  strength: "text-rose-600 bg-rose-50 border-rose-200",
};

const HOLD_CATEGORY_STYLES = {
  posture: { ring: "#7c3aed", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40", text: "text-violet-700", bar: "bg-violet-400" },
  mobility: { ring: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40", text: "text-emerald-700", bar: "bg-emerald-400" },
  stability: { ring: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40", text: "text-orange-600", bar: "bg-orange-400" },
  strength: { ring: "#e11d48", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40", text: "text-rose-700", bar: "bg-rose-400" },
};

const BREATH_INHALE = 4;
const BREATH_EXHALE = 5;
const BREATH_CYCLE = BREATH_INHALE + BREATH_EXHALE;
const TOTAL_BREATHS = 6;

const HOLD_EXERCISES = [
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

const PER_SIDE_EXERCISES = [
  "Side Plank",
  "Hip Flexor Stretch",
  "Bent Arm Chest Stretch",
  "Single Leg Glute Bridge",
];

function parseDosage(exercise) {
  const dosage = exercise.dosage || "";
  const match = dosage.match(/(\d+)\s*x\s*(\d+)s/);
  if (match) {
    return {
      sets: parseInt(match[1], 10),
      secsPerSet: parseInt(match[2], 10),
    };
  }
  return {
    sets: 1,
    secsPerSet: exercise.durationSecs || 30,
  };
}

function BreathingTimer() {
  const totalSecs = TOTAL_BREATHS * BREATH_CYCLE;
  const [secondsLeft, setSecondsLeft] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const breathNum = Math.min(TOTAL_BREATHS, Math.floor(elapsed / BREATH_CYCLE) + 1);
  const phase = elapsed % BREATH_CYCLE;
  const isInhale = phase < BREATH_INHALE;
  const phaseProgress = isInhale
    ? phase / BREATH_INHALE
    : (phase - BREATH_INHALE) / BREATH_EXHALE;

  const R = 34;
  const circumference = 2 * Math.PI * R;
  const progress = 1 - secondsLeft / totalSecs;

  return (
    <div className="rounded-3xl border border-sky-100 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/40 p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
            <motion.circle
              cx="50" cy="50" r={R} fill="none" stroke="#0ea5e9"
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <CheckCircle2 className="w-6 h-6 text-sky-500" />
            ) : (
              <>
                <span className="text-lg font-black leading-none text-sky-600">{secondsLeft}</span>
                <span className="text-[10px] text-muted-foreground">{breathNum}/{TOTAL_BREATHS}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={done ? "done" : isInhale ? "in" : "out"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold text-sky-700 mb-2"
            >
              {done
                ? `${TOTAL_BREATHS} breaths complete`
                : running
                ? isInhale ? "Inhale through your nose" : "Exhale slowly"
                : "Press play to begin"}
            </motion.p>
          </AnimatePresence>

          {running && !done && (
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-sky-400 rounded-full"
                animate={{ width: `${phaseProgress * 100}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>
          )}

          <button
            onClick={() => !done && setRunning((r) => !r)}
            disabled={done}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow transition-all active:scale-95 disabled:opacity-40 ${
              running ? "bg-secondary text-foreground" : "bg-sky-500 text-white"
            }`}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoldTimer({ exercise }) {
  const isPerSide = PER_SIDE_EXERCISES.includes(exercise.name);
  const { sets, secsPerSet } = parseDosage(exercise);

  const category = exercise.category || "mobility";
  const style = HOLD_CATEGORY_STYLES[category] || HOLD_CATEGORY_STYLES.mobility;

  const totalStages = isPerSide ? sets * 2 : sets;

  const [stage, setStage] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(secsPerSet);
  const [running, setRunning] = useState(false);
  const [stageDone, setStageDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecondsLeft(secsPerSet);
    setRunning(false);
    setStageDone(false);
  }, [stage, secsPerSet]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setStageDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleNextStage = () => {
    const nextStage = stage + 1;
    if (nextStage >= totalStages) {
      setAllDone(true);
    } else {
      setStage(nextStage);
    }
  };

  const R = 34;
  const circumference = 2 * Math.PI * R;
  const progress = 1 - secondsLeft / secsPerSet;

  function getStageLabel() {
    if (allDone) return "All sets complete!";
    if (stageDone) {
      if (isPerSide) {
        const side = stage % 2 === 0 ? "Left" : "Right";
        const nextSide = side === "Left" ? "right" : "left";
        if (stage + 1 < totalStages) return `${side} side done — switch to ${nextSide}`;
        return "Both sides complete!";
      }
      const setNum = stage + 1;
      if (setNum < sets) return `Set ${setNum} done — rest, then start set ${setNum + 1}`;
      return "All sets complete!";
    }
    if (isPerSide) {
      const side = stage % 2 === 0 ? "Left" : "Right";
      return running ? `${side} side — hold steady` : `${side} side — press play`;
    }
    const setNum = stage + 1;
    return running
      ? `Set ${setNum} of ${sets} — hold steady`
      : sets === 1
      ? "Press play to start"
      : `Set ${setNum} of ${sets} — press play`;
  }

  function renderDots() {
    return (
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalStages }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stage && !allDone
                ? "w-4 h-2 bg-current opacity-100"
                : i < stage || allDone
                ? "w-2 h-2 bg-current opacity-40"
                : "w-2 h-2 bg-current opacity-20"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border p-4 ${style.bg}`}>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
            <motion.circle
              cx="50" cy="50" r={R} fill="none"
              stroke={style.ring}
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - (allDone ? 1 : progress)) }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {allDone ? (
              <CheckCircle2 className={`w-6 h-6 ${style.text}`} />
            ) : stageDone ? (
              <RefreshCw className={`w-5 h-5 ${style.text}`} />
            ) : (
              <>
                <span className={`text-lg font-black leading-none ${style.text}`}>{secondsLeft}</span>
                <span className="text-[10px] text-muted-foreground">sec</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={style.text}>
            {renderDots()}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={`${stage}-${stageDone}-${allDone}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm font-semibold mb-2 ${style.text}`}
            >
              {getStageLabel()}
            </motion.p>
          </AnimatePresence>

          {running && !stageDone && !allDone && (
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div
                className={`h-full rounded-full ${style.bar}`}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>
          )}

          {!stageDone && !allDone && (
            <button
              onClick={() => setRunning((r) => !r)}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow transition-all active:scale-95 ${
                running ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>
          )}

          {stageDone && !allDone && (
            <button
              onClick={handleNextStage}
              className="px-4 h-11 rounded-full flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold shadow transition-all active:scale-95"
            >
              {isPerSide
                ? stage % 2 === 0 ? "Switch sides" : stage + 1 < totalStages ? "Next set" : "Done"
                : "Start next set"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
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
          className="flex-1 h-12 rounded-2xl font-semibold gap-2 disabled:opacity-25"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button onClick={onNext} className="flex-1 h-12 rounded-2xl font-bold gap-2 shadow-sm">
          {isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Finish
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

export default function ExerciseTimer({
  exercise,
  exerciseIndex,
  totalExercises,
  onComplete,
  onPrev,
}) {
  if (!exercise) return null;

  const catStyle =
    CATEGORY_COLORS[exercise.category] ||
    "text-primary bg-primary/10 border-primary/20";

  const isBreathing = exercise.category === "breathing";
  const isHold = HOLD_EXERCISES.includes(exercise.name);

  return (
    <motion.div
      key={`${exercise.id}-${exerciseIndex}`}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 bg-background"
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="max-w-lg mx-auto flex flex-col px-4 pt-4 pb-16"
        style={{ minHeight: "100%" }}
      >
        <div className="h-1 bg-secondary rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((exerciseIndex + 1) / totalExercises) * 100}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {exerciseIndex + 1} / {totalExercises}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${catStyle}`}>
            {exercise.category}
          </span>
        </div>

        <div className="mb-3">
          <h1 className="text-xl font-bold tracking-tight leading-tight">{exercise.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{exercise.dosage}</p>
        </div>

        <div className="space-y-3 pb-2">
          {isBreathing ? (
            <BreathingTimer />
          ) : isHold ? (
            <HoldTimer exercise={exercise} />
          ) : null}

          {!isBreathing && (
            <MidNav
              exerciseIndex={exerciseIndex}
              totalExercises={totalExercises}
              onPrev={onPrev || (() => {})}
              onNext={onComplete}
            />
          )}

          <div className="rounded-3xl overflow-hidden border border-border bg-card">
            <div className="h-[220px] bg-white dark:bg-slate-950">
              <ExerciseMedia exercise={exercise} className="w-full h-full" />
            </div>
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {exercise.video ? "Video demo" : exercise.gif ? "Animated demo" : exercise.image ? "Reference image" : "Exercise preview"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">Exercise cues</p>
            </div>
            <div className="space-y-2">
              {(exercise.instructions || []).map((line, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {isBreathing && (
            <MidNav
              exerciseIndex={exerciseIndex}
              totalExercises={totalExercises}
              onPrev={onPrev || (() => {})}
              onNext={onComplete}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}