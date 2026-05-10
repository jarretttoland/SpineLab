import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Zap, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

function getSpineLevel(score) {
  if (score >= 85) return { level: 5, title: "Elite",       color: "text-amber-500",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30",   ring: "#f59e0b" };
  if (score >= 70) return { level: 4, title: "Resilient",   color: "text-violet-500",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/30", ring: "#8b5cf6" };
  if (score >= 55) return { level: 3, title: "Strong",      color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30", ring: "#10b981" };
  if (score >= 40) return { level: 2, title: "Stabilizing", color: "text-sky-500",     bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30",         ring: "#0ea5e9" };
  return                   { level: 1, title: "Rebuilding",  color: "text-rose-500",    bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30",       ring: "#f43f5e" };
}

function getNextLevelThreshold(score) {
  if (score >= 85) return null;
  if (score >= 70) return 85;
  if (score >= 55) return 70;
  if (score >= 40) return 55;
  return 40;
}

function didLevelUp(oldScore, newScore) {
  return [40, 55, 70, 85].some((t) => oldScore < t && newScore >= t);
}

function explainDelta(label, delta, count) {
  if (delta <= 0) return null;
  if (label === "Consistency") return "Showing up daily compounds over time.";
  if (label === "Mobility")    return `${count} mobility exercises improved your range.`;
  if (label === "Strength")    return `${count} strength moves built spinal support.`;
  return null;
}

// ── Animated counter ───────────────────────────────────────────────────────
function CountUp({ from, to, duration = 1000, color, className = "" }) {
  const [display, setDisplay] = useState(from);
  const startTime = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (from === to) { setDisplay(to); return; }
    startTime.current = null;
    const animate = (ts) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed  = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [from, to, duration]);

  return <span className={className} style={{ color }}>{display}</span>;
}

// ── Delta badge ────────────────────────────────────────────────────────────
function Delta({ value }) {
  if (!value || value === 0) return null;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
        value > 0
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {value > 0 ? `+${value}` : value}
    </motion.span>
  );
}

// ── Particle burst ─────────────────────────────────────────────────────────
function ParticleBurst({ color }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle    = (i / 12) * 360;
        const distance = 55 + Math.random() * 35;
        const rad      = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full left-1/2 top-1/2"
            style={{ backgroundColor: color, marginLeft: -4, marginTop: -4 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * distance,
              y: Math.sin(rad) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.65, delay: i * 0.025, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CompletionCelebration({
  dayOfPlan,
  streak,
  scoreSnapshot,
  newScores,
  exerciseCount,
  mobilityCount,
  strengthCount,
  onFinish,
  onBack,
}) {
  const oldScore  = scoreSnapshot?.spineScore  ?? 0;
  const newScore  = newScores?.spineScore      ?? oldScore;
  const scoreDiff = newScore - oldScore;

  const oldLevel   = getSpineLevel(oldScore);
  const newLevel   = getSpineLevel(newScore);
  const leveledUp  = didLevelUp(oldScore, newScore);
  const nextThresh = getNextLevelThreshold(newScore);

  // Use streak passed in + 1 since Routine already incremented it in DB
  // but passes the pre-increment value as the prop
  const newStreak = newScores?.currentStreak ?? (streak ?? 0) + 1;
  const shieldEarned = newStreak % 7 === 0;

  const [phase, setPhase]               = useState("icon");
  const [showParticles, setShowParticles] = useState(true);

  // Sequence the reveals
  useEffect(() => {
    setShowParticles(true);
    const t1 = setTimeout(() => setShowParticles(false),  800);
    const t2 = setTimeout(() => setPhase("score"),        leveledUp ? 600  : 400);
    const t3 = setTimeout(() => setPhase("breakdown"),    leveledUp ? 1400 : 1100);
    const t4 = setTimeout(() => setPhase("stats"),        leveledUp ? 2000 : 1700);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [leveledUp]);

  // Confetti on level up
  useEffect(() => {
    if (!leveledUp) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.5 },
        colors: [newLevel.ring, "#ffffff", "#e0e7ff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 110,
          origin: { y: 0.35 },
          colors: [newLevel.ring, "#fef3c7"],
        });
      }, 350);
    }, 300);
    return () => clearTimeout(t);
  }, [leveledUp, newLevel.ring]);

  const subScores = [
    {
      label:   "Mobility",
      oldVal:  scoreSnapshot?.mobilityScore    ?? 0,
      newVal:  newScores?.mobilityScore        ?? 0,
      color:   "#10b981",
      explain: explainDelta("Mobility",    (newScores?.mobilityScore    ?? 0) - (scoreSnapshot?.mobilityScore    ?? 0), mobilityCount),
    },
    {
      label:   "Strength",
      oldVal:  scoreSnapshot?.strengthScore    ?? 0,
      newVal:  newScores?.strengthScore        ?? 0,
      color:   "#f43f5e",
      explain: explainDelta("Strength",    (newScores?.strengthScore    ?? 0) - (scoreSnapshot?.strengthScore    ?? 0), strengthCount),
    },
    {
      label:   "Consistency",
      oldVal:  scoreSnapshot?.consistencyScore ?? 0,
      newVal:  newScores?.consistencyScore     ?? 0,
      color:   "#0ea5e9",
      explain: explainDelta("Consistency", (newScores?.consistencyScore ?? 0) - (scoreSnapshot?.consistencyScore ?? 0), 0),
    },
  ];

  // Level progress bands
  const levelBands  = [0, 40, 55, 70, 85, 100];
  const oldBandLow  = levelBands[oldLevel.level - 1];
  const oldBandHigh = levelBands[oldLevel.level];
  const newBandLow  = levelBands[newLevel.level - 1];
  const newBandHigh = levelBands[newLevel.level];
  const oldBarPct   = Math.min(100, Math.max(0, Math.round(((oldScore - oldBandLow) / (oldBandHigh - oldBandLow)) * 100)));
  const newBarPct   = Math.min(100, Math.max(0, Math.round(((newScore - newBandLow) / (newBandHigh - newBandLow)) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background overflow-y-auto"
    >
      <div className="max-w-md mx-auto px-5 pt-12 pb-20 flex flex-col items-center">

        {/* ── Icon ── */}
        <div className="relative mb-5">
          {showParticles && <ParticleBurst color={newLevel.ring} />}

          {leveledUp ? (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl ${newLevel.bg}`}
              style={{ borderColor: newLevel.ring }}
            >
              <Zap className="w-9 h-9 mb-0.5" style={{ color: newLevel.ring }} />
              <span className="text-xs font-black tracking-wide" style={{ color: newLevel.ring }}>
                {newLevel.title}
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${newLevel.ring}18` }}
            >
              <TrendingUp className="w-11 h-11" style={{ color: newLevel.ring }} />
            </motion.div>
          )}
        </div>

        {/* ── Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-1"
        >
          {leveledUp ? (
            <>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${newLevel.color}`}>
                Level Up
              </p>
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                You reached{" "}
                <span style={{ color: newLevel.ring }}>{newLevel.title}</span>
              </h1>
            </>
          ) : (
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              Session complete.
            </h1>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="text-sm text-muted-foreground text-center mb-7"
        >
          {exerciseCount} exercises · Day {dayOfPlan} of your plan
        </motion.p>

        {/* ── Spine Score card ── */}
        <AnimatePresence>
          {phase !== "icon" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-3xl border border-border bg-card p-5 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Spine Score
                </p>
                <div className="flex items-center gap-2">
                  {leveledUp && (
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${newLevel.bg} ${newLevel.color}`}>
                      <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                      {newLevel.title}
                    </span>
                  )}
                  <Delta value={scoreDiff} />
                </div>
              </div>

              <div className="flex items-end gap-2 mb-4">
                <p className="text-6xl font-black leading-none">
                  <CountUp from={oldScore} to={newScore} duration={900} color={newLevel.ring} />
                </p>
                <div className="mb-1.5">
                  <p className="text-sm text-muted-foreground leading-none">/ 100</p>
                  {scoreDiff > 0 && (
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: newLevel.ring }}>
                      +{scoreDiff} this session
                    </p>
                  )}
                </div>
              </div>

              {/* Level progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Level {newLevel.level} · {newLevel.title}
                  </p>
                  {nextThresh ? (
                    <p className="text-[11px] text-muted-foreground">
                      {nextThresh - newScore} pts to{" "}
                      <span style={{ color: getSpineLevel(nextThresh).ring }}>
                        {getSpineLevel(nextThresh).title}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-500 font-bold">Max level</p>
                  )}
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: newLevel.ring }}
                    initial={{ width: `${oldBarPct}%` }}
                    animate={{ width: `${newBarPct}%` }}
                    transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── What moved today ── */}
        <AnimatePresence>
          {(phase === "breakdown" || phase === "stats") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-3xl border border-border bg-card p-5 mb-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                What moved today
              </p>
              <div className="space-y-4">
                {subScores.map(({ label, oldVal, newVal, color, explain }, i) => {
                  const delta  = newVal - oldVal;
                  const pct    = Math.min(100, Math.max(0, newVal));
                  const oldPct = Math.min(100, Math.max(0, oldVal));
                  return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{label}</p>
                        <div className="flex items-center gap-1.5">
                          <CountUp from={oldVal} to={newVal} duration={700} color={color} className="text-sm font-black" />
                          <Delta value={delta} />
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: `${oldPct}%` }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                        />
                      </div>
                      {explain && delta > 0 && (
                        <p className="text-[11px] text-muted-foreground">{explain}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Streak + Shield + Next level ── */}
        <AnimatePresence>
          {phase === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-3 mb-8"
            >
              {/* Streak */}
              <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-primary" />
                  </div>
                  <div>
  <p className="text-sm font-bold">
    {newStreak === 1
      ? "Day 1 done. The streak starts now."
      : newStreak % 7 === 0
      ? `${newStreak} days straight. You earned a shield.`
      : newStreak >= 14
      ? `${newStreak} days. This is becoming who you are.`
      : newStreak >= 3
      ? `${newStreak} days in a row. You're building a habit.`
      : `${newStreak} days in a row. Keep going.`}
  </p>
  <p className="text-xs text-muted-foreground">
    {newStreak % 7 === 0
      ? "Next shield in 7 days"
      : `${7 - (newStreak % 7)} days to next shield`}
  </p>
</div>
                </div>
                <p className="text-2xl font-black text-primary">{newStreak}</p>
              </div>

              {/* Shield earned */}
              {shieldEarned && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: 0.15 }}
                  className="rounded-2xl border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-800/40 px-5 py-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-700 dark:text-violet-400">
                      Streak Shield earned
                    </p>
                    <p className="text-xs text-violet-600/80 dark:text-violet-400/70">
                      Miss a day without losing your streak.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Next level teaser */}
              {nextThresh && !leveledUp && (
                <div
                  className="rounded-2xl border px-5 py-4 flex items-center justify-between"
                  style={{
                    borderColor: `${getSpineLevel(nextThresh).ring}40`,
                    backgroundColor: `${getSpineLevel(nextThresh).ring}08`,
                  }}
                >
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Next level</p>
                    <p className="text-sm font-bold" style={{ color: getSpineLevel(nextThresh).ring }}>
                      {getSpineLevel(nextThresh).title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: getSpineLevel(nextThresh).ring }}>
                      {nextThresh - newScore}
                    </p>
                    <p className="text-xs text-muted-foreground">pts away</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTAs ── */}
        <AnimatePresence>
          {phase === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-3"
            >
              <Button
                onClick={onFinish}
                className="w-full h-14 rounded-2xl text-base font-bold gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Return to Dashboard
              </Button>

              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full h-11 text-muted-foreground text-sm"
              >
                Back to routine
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}