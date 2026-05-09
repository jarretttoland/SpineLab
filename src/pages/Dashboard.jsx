import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Scan, Flame, Shield, ChevronRight, Zap } from "lucide-react";
import SpineScoreRing from "@/components/SpineScoreRing";
import { getRoutineForUser } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";

// ── Spine Age ──────────────────────────────────────────────────────────────
const AGE_RANGE_MIDPOINTS = {
  "25 and younger": 20,
  "25andyounger":   20,
  "25_and_younger": 20,
  "under25":        20,
  "under_25":       20,
  "25-40":          32,
  "25_40":          32,
  "40-55":          47,
  "40_55":          47,
  "55+":            62,
  "55plus":         62,
  "55_plus":        62,
};

function getAgeRangeMidpoint(ageRange) {
  if (!ageRange) return 35;
  const key = ageRange.toLowerCase().replace(/\s+/g, " ").trim();
  const keyNoSpace = key.replace(/\s/g, "");
  if (AGE_RANGE_MIDPOINTS[key])        return AGE_RANGE_MIDPOINTS[key];
  if (AGE_RANGE_MIDPOINTS[keyNoSpace]) return AGE_RANGE_MIDPOINTS[keyNoSpace];
  const match = keyNoSpace.match(/(\d+)-(\d+)/);
  if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
  return 35;
}

function calcSpineAge(spineScore, ageRange) {
  const midAge = getAgeRangeMidpoint(ageRange);
  const raw = midAge - Math.floor((spineScore - 50) / 5);
  return Math.max(18, Math.min(midAge + 10, raw));
}

// ── Spine Level ────────────────────────────────────────────────────────────
function getSpineLevel(spineScore) {
  if (spineScore >= 85) return { level: 5, title: "Elite",       color: "text-amber-500",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",   ring: "#f59e0b" };
  if (spineScore >= 70) return { level: 4, title: "Resilient",   color: "text-violet-500",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40", ring: "#8b5cf6" };
  if (spineScore >= 55) return { level: 3, title: "Strong",      color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", ring: "#10b981" };
  if (spineScore >= 40) return { level: 2, title: "Stabilizing", color: "text-sky-500",     bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40",     ring: "#0ea5e9" };
  return                       { level: 1, title: "Rebuilding",  color: "text-rose-500",    bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40",   ring: "#f43f5e" };
}

function getNextLevelThreshold(spineScore) {
  if (spineScore >= 85) return null;
  if (spineScore >= 70) return 85;
  if (spineScore >= 55) return 70;
  if (spineScore >= 40) return 55;
  return 40;
}

// ── Streak shields ─────────────────────────────────────────────────────────
function calcShields(streak) {
  return Math.floor((streak || 0) / 7);
}

// ── Spine Age copy ─────────────────────────────────────────────────────────
function getSpineAgeCopy(spineAge, realAge) {
  const diff = realAge - spineAge;
  if (diff >= 10) return "Your spine is performing exceptionally well.";
  if (diff >= 5)  return "You're well ahead of your age. Keep it up.";
  if (diff >= 1)  return "You're trending younger. Stay consistent.";
  if (diff === 0) return "Your spine matches your age. Room to improve.";
  return "Your spine needs attention. Daily work will turn this around.";
}

// ──────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user?.id) {
          navigate("/", { replace: true });
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!mounted) return;

        if (!profileData?.onboarding_complete) {
          navigate("/onboarding", { replace: true });
          return;
        }

        setProfile(profileData);
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

  const safeProfile  = profile || {};
  const spineScore   = typeof safeProfile.spine_score === "number" ? safeProfile.spine_score : 0;
  const streak       = typeof safeProfile.current_streak === "number" ? safeProfile.current_streak : 0;
  const displayName  = safeProfile.first_name?.trim() || "SpineLab";
  const exercises    = getRoutineForUser(safeProfile.pain_areas || []);

  // Derived values — all calculated from existing DB fields, nothing written
  const spineAge    = calcSpineAge(spineScore, safeProfile.age_range);
  const realAge     = getAgeRangeMidpoint(safeProfile.age_range);
  const ageDiff     = realAge - spineAge;
  const spineLevel  = getSpineLevel(spineScore);
  const nextThresh  = getNextLevelThreshold(spineScore);
  const shields     = calcShields(streak);
  const ageCopy     = getSpineAgeCopy(spineAge, realAge);

  const primaryGoalLabel =
    safeProfile.primary_goal === "pain_relief"    ? "Pain relief"              :
    safeProfile.primary_goal === "better_posture" ? "Better posture"           :
    safeProfile.primary_goal === "performance"    ? "Performance and strength" :
    "Daily spine health";

  // Progress within current level band (0–100)
  const levelBands   = [0, 40, 55, 70, 85, 100];
  const bandLow      = levelBands[spineLevel.level - 1];
  const bandHigh     = levelBands[spineLevel.level];
  const levelProgress = Math.round(((spineScore - bandLow) / (bandHigh - bandLow)) * 100);

  return (
    <div className="px-4 pt-12 pb-28 min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold ${spineLevel.bg} ${spineLevel.color}`}>
            <Zap className="w-3 h-3" />
            {spineLevel.title}
          </div>
        </div>

        {/* ── Spine Score + Spine Age card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-card border border-border rounded-3xl p-6 mb-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Existing score ring — untouched */}
            <div className="flex flex-col items-center">
              <SpineScoreRing score={spineScore} />
              <p className="text-xs text-muted-foreground mt-2">Spine Score</p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-border" />

            {/* Spine Age */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Spine Age
              </p>
              <p className={`text-5xl font-black leading-none ${spineLevel.color}`}>
                {spineAge}
              </p>
              {ageDiff !== 0 && (
                <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  ageDiff > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                }`}>
                  {ageDiff > 0 ? `${ageDiff} yrs younger` : `${Math.abs(ageDiff)} yrs older`}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2 leading-snug max-w-[140px]">
                {ageCopy}
              </p>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Level {spineLevel.level} · {spineLevel.title}
              </p>
              {nextThresh ? (
                <p className="text-[11px] text-muted-foreground">
                  {nextThresh - spineScore} pts to next level
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          <div className="bg-card border border-border rounded-2xl p-4">
            <Flame className="w-4 h-4 mb-2 text-primary" />
            <p className="text-2xl font-bold leading-none">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">day streak</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <Shield className={`w-4 h-4 mb-2 ${shields > 0 ? "text-violet-500" : "text-muted-foreground"}`} />
            <p className="text-2xl font-bold leading-none">{shields}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {shields === 1 ? "shield" : "shields"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <Activity className="w-4 h-4 mb-2 text-primary" />
            <p className="text-xs font-semibold leading-snug">{primaryGoalLabel}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Focus</p>
          </div>
        </motion.div>

        {/* ── Score breakdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-card border border-border rounded-3xl p-5 mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Score Breakdown
          </p>
          <div className="space-y-3">
            {[
              { label: "Posture",     value: safeProfile.posture_score,     color: "#7c3aed" },
              { label: "Mobility",    value: safeProfile.mobility_score,    color: "#10b981" },
              { label: "Strength",    value: safeProfile.strength_score,    color: "#f43f5e" },
              { label: "Consistency", value: safeProfile.consistency_score, color: "#0ea5e9" },
            ].map(({ label, value, color }) => {
              const pct = typeof value === "number" ? Math.min(100, Math.max(0, value)) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground/80">{label}</p>
                    <p className="text-xs font-bold" style={{ color }}>{pct}</p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Today's routine CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Link to="/routine">
            <div className="bg-foreground text-background rounded-3xl p-6 mb-4 active:scale-[0.98] transition-transform">
              <p className="text-sm opacity-60 mb-1">Today's plan</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">
                  {exercises?.length ? "See your routine" : "Start your routine"}
                </p>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Posture scan CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/scan">
            <div className="border border-border rounded-3xl p-5 flex items-center gap-4 bg-card active:scale-[0.98] transition-transform">
              <Scan className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">AI Posture Scan</p>
                <p className="text-xs text-muted-foreground">
                  Update your structural score
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}