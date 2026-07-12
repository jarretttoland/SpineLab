import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Scan, Flame, Shield, ChevronRight, Zap, X, Info } from "lucide-react";
import SpineScoreRing from "@/components/SpineScoreRing";
import { getRoutineForUser } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";
import {
  getActiveWeeklyMinutes,
  getEffortPercent,
  WEEKLY_EFFORT_GOAL_MINUTES,
  calcSpineAge,
} from "@/lib/spineScore";

// ── Helpers ────────────────────────────────────────────────────────────────

function getSpineLevel(spineScore) {
  if (spineScore >= 85) return { level: 5, title: "Elite",       color: "text-amber-500",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",   ring: "#f59e0b" };
  if (spineScore >= 70) return { level: 4, title: "Resilient",   color: "text-violet-500",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40", ring: "#8b5cf6" };
  if (spineScore >= 55) return { level: 3, title: "Strong",      color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", ring: "#10b981" };
  if (spineScore >= 40) return { level: 2, title: "Stabilizing", color: "text-sky-500",     bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40",             ring: "#0ea5e9" };
  return                       { level: 1, title: "Rebuilding",  color: "text-rose-500",    bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40",         ring: "#f43f5e" };
}

function getNextLevelThreshold(spineScore) {
  if (spineScore >= 85) return null;
  if (spineScore >= 70) return 85;
  if (spineScore >= 55) return 70;
  if (spineScore >= 40) return 55;
  return 40;
}

function calcShields(streak) {
  return Math.floor((streak || 0) / 7);
}

// ── Info Sheet (slide-up overlay) ─────────────────────────────────────────

function InfoSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        className="relative bg-background rounded-t-[2rem] px-5 pt-5 overflow-y-auto"
        style={{
          maxHeight: "88vh",
          paddingBottom: `max(calc(env(safe-area-inset-bottom) + 112px), 128px)`,
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ── Levels content ─────────────────────────────────────────────────────────

const LEVELS_DATA = [
  {
    level: 1, title: "Rebuilding", range: "0 – 39", ring: "#f43f5e",
    bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40",
    color: "text-rose-500",
    desc: "You're at the start. Daily effort is what matters most right now. Show up, do the work, and your score will move.",
  },
  {
    level: 2, title: "Stabilizing", range: "40 – 54", ring: "#0ea5e9",
    bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40",
    color: "text-sky-500",
    desc: "You're building a foundation. Your spine is starting to respond to the work. Keep stacking sessions.",
  },
  {
    level: 3, title: "Strong", range: "55 – 69", ring: "#10b981",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
    color: "text-emerald-500",
    desc: "Real progress. Your posture, mobility, and effort are compounding. Most people never get here.",
  },
  {
    level: 4, title: "Resilient", range: "70 – 84", ring: "#8b5cf6",
    bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40",
    color: "text-violet-500",
    desc: "High performance. Your spine can handle daily demands without breaking down. This is elite territory for most adults.",
  },
  {
    level: 5, title: "Elite", range: "85 – 100", ring: "#f59e0b",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",
    color: "text-amber-500",
    desc: "Top tier. You've built the kind of spine health that most people don't know is achievable. Maintain it.",
  },
];

function LevelsSheet({ open, onClose, currentLevel }) {
  return (
    <InfoSheet open={open} onClose={onClose} title="Spine Levels">
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Your Spine Score determines your level. Every session moves the score up. Here's what each level represents.
      </p>
      <div className="space-y-3">
        {LEVELS_DATA.map((l) => {
          const isCurrent = l.level === currentLevel;
          return (
            <div
              key={l.level}
              className={`rounded-2xl border p-4 ${l.bg} ${isCurrent ? "ring-2" : ""}`}
              style={isCurrent ? { ringColor: l.ring } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${l.color}`}>Level {l.level} · {l.title}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 text-foreground/70">
                      You are here
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{l.range}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{l.desc}</p>
            </div>
          );
        })}
      </div>
    </InfoSheet>
  );
}

// ── Shields content ────────────────────────────────────────────────────────

function ShieldsSheet({ open, onClose, shields, streak }) {
  const nextShieldIn = 7 - (streak % 7);
  const progress     = ((streak % 7) / 7) * 100;

  return (
    <InfoSheet open={open} onClose={onClose} title="Shields">
      <div className="flex items-center gap-4 bg-violet-50 border border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40 rounded-2xl p-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-violet-500" />
        </div>
        <div>
          <p className="text-2xl font-black text-violet-500 leading-none">{shields}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {shields === 1 ? "shield earned" : "shields earned"}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        A shield is earned for every <span className="font-semibold text-foreground">7 consecutive days</span> of completing your routine. They represent your commitment — each one means a full week without missing a day.
      </p>

      {/* Progress to next shield */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Next shield
          </p>
          <p className="text-xs font-semibold text-violet-500">
            {nextShieldIn === 7 ? "Start your streak" : `${nextShieldIn} day${nextShieldIn !== 1 ? "s" : ""} to go`}
          </p>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-[10px] text-muted-foreground">Day {streak % 7} of 7</p>
          <p className="text-[10px] text-muted-foreground">🛡️</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Shield milestones
        </p>
        {[
          { count: 1,  label: "First week",         desc: "You built a habit." },
          { count: 4,  label: "One month",           desc: "Your spine is changing." },
          { count: 13, label: "Quarter year",        desc: "Structural improvement territory." },
          { count: 52, label: "Full year",           desc: "Elite spine health. Few get here." },
        ].map(({ count, label, desc }) => (
          <div key={count} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <Shield className={`w-4 h-4 shrink-0 ${shields >= count ? "text-violet-500" : "text-muted-foreground/30"}`} />
            <div className="flex-1">
              <p className={`text-xs font-semibold ${shields >= count ? "text-foreground" : "text-muted-foreground/50"}`}>
                {count} {count === 1 ? "shield" : "shields"} · {label}
              </p>
              <p className="text-[11px] text-muted-foreground">{desc}</p>
            </div>
            {shields >= count && (
              <span className="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800/40">
                Earned
              </span>
            )}
          </div>
        ))}
      </div>
    </InfoSheet>
  );
}

// ── Mini Sparkline (pure SVG, no deps) ────────────────────────────────────

function MiniSparkline({ scans }) {
  // scans arrives newest-first; chart wants oldest → newest
  const data = scans.slice(0, 10).reverse();
  if (data.length < 2) return null;

  const W = 280, H = 60, P = 6;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const scores = data.map((d) => Number(d.quality_score) || 0);
  const min    = Math.min(...scores);
  const max    = Math.max(...scores);
  const range  = Math.max(max - min, 8);

  const points = scores.map((s, i) => ({
    x: P + (i / (scores.length - 1)) * innerW,
    y: P + innerH - ((s - min) / range) * innerH,
  }));

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = points[i - 1];
    const cpX  = (prev.x + p.x) / 2;
    return `${acc} Q ${cpX.toFixed(1)},${prev.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");

  const areaPath    = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${H - P} L ${points[0].x.toFixed(1)},${H - P} Z`;
  const last        = points[points.length - 1];
  const totalDelta  = scores[scores.length - 1] - scores[0];

  return (
    <div className="rounded-3xl border border-border bg-card p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Posture Trend
        </p>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
          totalDelta > 0
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : totalDelta < 0
            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            : "bg-secondary text-muted-foreground"
        }`}>
          {totalDelta > 0 ? `+${totalDelta}` : totalDelta < 0 ? `${totalDelta}` : "Steady"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dash-chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"    />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dash-chart-grad)" />
        <path
          d={linePath}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="5"   fill="hsl(var(--primary))" opacity="0.18" />
        <circle cx={last.x} cy={last.y} r="3.5" fill="hsl(var(--primary))" />
        <circle cx={last.x} cy={last.y} r="1.5" fill="white" />
      </svg>
      <p className="text-[10px] text-muted-foreground mt-1 text-right">
        {data.length} scan{data.length !== 1 ? "s" : ""} · Latest: {scores[scores.length - 1]}
      </p>
    </div>
  );
}

// ── Score Breakdown ────────────────────────────────────────────────────────

function ScoreBreakdown({ profile, effortScore, effortCaption }) {
  const dims = [
    { key: "posture_score",  label: "Posture",  color: "#7c3aed" },
    { key: "mobility_score", label: "Mobility",  color: "#10b981" },
    { key: "strength_score", label: "Strength",  color: "#f43f5e" },
    { key: "effort_score",   label: "Effort",    color: "#f59e0b", caption: effortCaption },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-3 mb-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
        Score Breakdown
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {dims.map(({ key, label, color, caption }) => {
          const value = key === "effort_score"
            ? effortScore
            : (typeof profile[key] === "number" ? profile[key] : 0);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <p className="text-[11px] font-bold" style={{ color }}>{value}</p>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              {caption && (
                <p className="text-[10px] text-muted-foreground mt-1">{caption}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Focus Insight ──────────────────────────────────────────────────────────

function FocusInsight({ profile, effortScore }) {
  const dims = [
    { key: "posture_score",  label: "Posture",  tip: "Run your AI posture scan to push this higher.",     color: "#7c3aed" },
    { key: "mobility_score", label: "Mobility",  tip: "Your routine's mobility work builds this score.",   color: "#10b981" },
    { key: "strength_score", label: "Strength",  tip: "Stability exercises in your routine build this.",   color: "#f43f5e" },
    { key: "effort_score",   label: "Effort",    tip: "Minutes moved this week build this.",               color: "#f59e0b" },
  ];

  const scored = dims.map((d) => ({
    ...d,
    value: d.key === "effort_score"
      ? effortScore
      : (typeof profile[d.key] === "number" ? profile[d.key] : 0),
  }));

  const lowest = scored.reduce((a, b) => (a.value <= b.value ? a : b));

  return (
    <div className="rounded-3xl border border-border bg-card p-3 mb-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Your focus this week
      </p>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${lowest.color}18` }}
        >
          <Activity className="w-5 h-5" style={{ color: lowest.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: lowest.color }}>{lowest.label}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{lowest.tip}</p>
        </div>
        <p className="text-2xl font-black" style={{ color: lowest.color }}>{lowest.value}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading,      setLoading]      = useState(true);
  const [profile,      setProfile]      = useState(null);
  const [user,         setUser]         = useState(null);
  const [scans,        setScans]        = useState([]);
  const [showLevels,   setShowLevels]   = useState(false);
  const [showShields,  setShowShields]  = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user?.id) { navigate("/", { replace: true }); return; }
        if (mounted) setUser(user);

        const [profileResult, scansResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("posture_scans")
            .select("quality_score, scan_date, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (!mounted) return;

        if (!profileResult.data?.onboarding_complete) { navigate("/onboarding", { replace: true }); return; }

        const activeProfile = profileResult.data;

        setProfile(activeProfile);
        if (!scansResult.error) setScans(scansResult.data || []);
      } catch (err) {
        console.error("[Dashboard] load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { mounted = false; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const safeProfile = profile || {};
  const spineScore  = typeof safeProfile.spine_score    === "number" ? safeProfile.spine_score    : 0;
  const streak      = typeof safeProfile.current_streak === "number" ? safeProfile.current_streak : 0;
  const exercises   = getRoutineForUser(safeProfile.pain_areas || []);

  // Effort = real minutes exercised this week (rolls over to 0 on a new week
  // automatically), shown as a 0-100 bar against a weekly goal.
  const effortMinutesThisWeek = getActiveWeeklyMinutes(safeProfile);
  const effortScore   = Math.round(getEffortPercent(effortMinutesThisWeek));
  const effortCaption = `${effortMinutesThisWeek}/${WEEKLY_EFFORT_GOAL_MINUTES} min this week`;

  // ── Display name: guest / Apple / Google / email ──────────────
  const displayName = (() => {
    if (!user) return "SpineLab";
    if (user.is_anonymous) return "Guest";
    const meta = user.user_metadata || {};
    const firstName = safeProfile.first_name?.trim()
      || (meta.full_name || meta.name || "").split(" ")[0]
      || "";
    if (firstName) return firstName;
    if (user.email) return user.email.split("@")[0];
    return "Guest";
  })();

  // ── Has the user completed at least one workout? ───────────────
  const hasCompletedFirstWorkout =
    (safeProfile.current_streak  || 0) > 0 ||
    (safeProfile.longest_streak  || 0) > 0 ||
    !!safeProfile.last_active_date;

  const spineAge    = calcSpineAge(spineScore, safeProfile.age_range);
  const spineLevel  = getSpineLevel(spineScore);
  const nextThresh  = getNextLevelThreshold(spineScore);
  const shields     = calcShields(streak);

  // ── Time-of-day greeting ──────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  // Has the user completed their routine today?
  const routineDoneToday = (() => {
    const lastActive = safeProfile.last_active_date;
    if (!lastActive) return false;
    const today = new Date();
    const last  = new Date(lastActive);
    return (
      last.getFullYear() === today.getFullYear() &&
      last.getMonth()    === today.getMonth()    &&
      last.getDate()     === today.getDate()
    );
  })();

  const levelBands    = [0, 40, 55, 70, 85, 100];
  const bandLow       = levelBands[spineLevel.level - 1];
  const bandHigh      = levelBands[spineLevel.level];
  const levelProgress = Math.round(((spineScore - bandLow) / (bandHigh - bandLow)) * 100);

  const primaryGoalLabel =
    safeProfile.primary_goal === "pain_relief"    ? "Pain relief"  :
    safeProfile.primary_goal === "better_posture" ? "Better posture" :
    safeProfile.primary_goal === "performance"    ? "Performance"  :
    "Daily health";

  return (
    <div
      className="flex flex-col px-4 pt-2 bg-background"
      style={{
        minHeight: "calc(100dvh - env(safe-area-inset-top) - 14px - env(safe-area-inset-bottom) - 96px)",
      }}
    >
      {/* ── Sheets ── */}
      <LevelsSheet  open={showLevels}  onClose={() => setShowLevels(false)}  currentLevel={spineLevel.level} />
      <ShieldsSheet open={showShields} onClose={() => setShowShields(false)} shields={shields} streak={streak} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col flex-1 max-w-lg mx-auto w-full">

        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            {routineDoneToday ? (
              <p className="text-xs text-emerald-500 font-semibold mt-0.5">
                ✓ Routine done today
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Your routine is waiting
              </p>
            )}
          </div>
          <button
            onClick={() => setShowLevels(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold active:scale-95 transition-transform ${spineLevel.bg} ${spineLevel.color}`}
          >
            <Zap className="w-3 h-3" />
            {spineLevel.title}
            <Info className="w-3 h-3 opacity-40" />
          </button>
        </div>

        {/* ── Hero: Spine Score (centered) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-card border border-border rounded-3xl p-4 mb-3 shadow-sm"
        >
          {/* Centered ring + age subtitle */}
          <div className="flex flex-col items-center text-center mb-3">
            <SpineScoreRing score={spineScore} size={130} strokeWidth={9} />
            <p className="text-xs text-muted-foreground mt-2 mb-0.5">Spine Score</p>
            <p className="text-sm font-semibold text-muted-foreground">
              Spine of a <span className={spineLevel.color}>{spineAge}-year-old</span>
            </p>
          </div>

          {/* Level progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Level {spineLevel.level} · {spineLevel.title}
              </p>
              {nextThresh ? (
                <p className="text-[11px] text-muted-foreground">
                  {nextThresh - spineScore} pts to{" "}
                  <span style={{ color: getSpineLevel(nextThresh).ring }}>
                    {getSpineLevel(nextThresh).title}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-amber-500 font-semibold">Max level reached</p>
              )}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: spineLevel.ring }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Streak + Shields + Goal ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2.5 mb-3"
        >
          <div className="bg-card border border-border rounded-2xl p-3">
            <Flame className="w-4 h-4 mb-1.5 text-primary" />
            <p className="text-xl font-bold leading-none">{streak}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">day streak</p>
          </div>
          <button
            onClick={() => setShowShields(true)}
            className="bg-card border border-border rounded-2xl p-3 text-left active:scale-95 transition-transform w-full"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Shield className={`w-4 h-4 ${shields > 0 ? "text-violet-500" : "text-muted-foreground/40"}`} />
              <Info className="w-3 h-3 text-muted-foreground/40" />
            </div>
            {shields > 0 ? (
              <>
                <p className="text-xl font-bold leading-none">{shields}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{shields === 1 ? "shield" : "shields"}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold leading-none text-muted-foreground/30">—</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">7 days to earn</p>
              </>
            )}
          </button>
          <div className="bg-card border border-border rounded-2xl p-3">
            <Activity className="w-4 h-4 mb-1.5 text-primary" />
            <p className="text-xs font-semibold leading-snug">{primaryGoalLabel}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Your goal</p>
          </div>
        </motion.div>

        {/* ── Score Breakdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          {hasCompletedFirstWorkout ? (
            <ScoreBreakdown profile={safeProfile} effortScore={effortScore} effortCaption={effortCaption} />
          ) : (
            <div className="rounded-3xl border border-border bg-card p-4 mb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Score breakdown locked</p>
                <p className="text-xs text-muted-foreground mt-0.5">Complete your first routine to unlock it</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Spacer — pushes CTAs to bottom ── */}
        <div className="flex-1" />

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
          className="flex flex-col gap-3"
        >
          <Link to="/routine">
            <div className="bg-primary text-primary-foreground rounded-3xl p-4 active:scale-[0.98] transition-transform shadow-sm">
              <p className="text-sm opacity-70 mb-1">Today's plan</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">
                  {exercises?.length ? "See your routine" : "Start your routine"}
                </p>
                <ChevronRight className="w-5 h-5 opacity-70" />
              </div>
            </div>
          </Link>

          <Link to="/scan">
            <div className="bg-card border border-border rounded-3xl p-4 active:scale-[0.98] transition-transform">
              <p className="text-sm text-muted-foreground mb-1">Posture check</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">AI Posture Scan</p>
                <Scan className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}
