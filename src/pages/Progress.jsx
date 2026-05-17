// FILE: src/pages/Progress.jsx
// Replace your existing file with this entire file.
//
// What's different (and why each thing matters):
//   1. Real hero card — Spine Score ring + Spine Age + level chip side by side
//      (matches the onboarding results screen for visual continuity)
//   2. Trend chart — smooth SVG sparkline of your posture score over time.
//      Premium fitness apps live and die by this single visualization
//   3. Bigger, more readable stats — text-2xl numbers, real icons
//   4. Dropped fake mobility/strength bars (those columns aren't actually
//      written by your code so they always show 0/50 — showing fake data
//      undermines trust)
//   5. Rich scan rows — show the scan image thumbnail, "X days ago" instead
//      of bare dates, big score with delta chip
//   6. Contextual subtitle — page greeting changes based on streak/state
//   7. Beautiful empty state for first-time users
//
// No new dependencies. SVG chart is inline.

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Camera,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import SpineScoreRing from "@/components/SpineScoreRing";
import { supabase } from "@/lib/supabase";

// ────────────────────────────────────────────────────────────
// Helpers (mirror the onboarding results logic for consistency)
// ────────────────────────────────────────────────────────────

function getLevel(score) {
  if (score >= 85)
    return {
      title: "Elite",
      color: "text-amber-600",
      ring: "#f59e0b",
      bg: "bg-amber-50 border-amber-200",
    };
  if (score >= 70)
    return {
      title: "Resilient",
      color: "text-violet-600",
      ring: "#8b5cf6",
      bg: "bg-violet-50 border-violet-200",
    };
  if (score >= 55)
    return {
      title: "Strong",
      color: "text-emerald-600",
      ring: "#10b981",
      bg: "bg-emerald-50 border-emerald-200",
    };
  if (score >= 40)
    return {
      title: "Stabilizing",
      color: "text-sky-600",
      ring: "#0ea5e9",
      bg: "bg-sky-50 border-sky-200",
    };
  return {
    title: "Rebuilding",
    color: "text-rose-600",
    ring: "#f43f5e",
    bg: "bg-rose-50 border-rose-200",
  };
}

function getAgeRangeMidpoint(ageRange) {
  if (!ageRange) return 35;
  const key = ageRange.toLowerCase().replace(/\s+/g, "").trim();
  const matchTo = key.match(/(\d+)to(\d+)/);
  if (matchTo) return Math.round((parseInt(matchTo[1]) + parseInt(matchTo[2])) / 2);
  const matchDash = key.match(/(\d+)-(\d+)/);
  if (matchDash) return Math.round((parseInt(matchDash[1]) + parseInt(matchDash[2])) / 2);
  const matchPlus = key.match(/(\d+)(?:plus|\+)/);
  if (matchPlus) return parseInt(matchPlus[1]) + 7;
  const matchUnder = key.match(/under(\d+)/);
  if (matchUnder) return parseInt(matchUnder[1]) - 5;
  return 35;
}

function calcSpineAge(spineScore, ageRange) {
  const midAge = getAgeRangeMidpoint(ageRange);
  const raw = midAge - Math.floor((spineScore - 50) / 5);
  return Math.max(18, Math.min(midAge + 10, raw));
}

// ────────────────────────────────────────────────────────────
// Sparkline chart (pure SVG, no dependencies)
// ────────────────────────────────────────────────────────────

function ScoreChart({ scans }) {
  // scans arrive newest-first; chart wants oldest → newest
  const data = scans.slice(0, 12).reverse();

  if (data.length < 2) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold mb-1">Your trend is coming</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
          Take a second scan to start tracking your posture over time.
        </p>
      </div>
    );
  }

  const W = 320;
  const H = 120;
  const P = 14;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const scores = data.map((d) => Number(d.quality_score) || 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = Math.max(max - min, 10);

  const points = scores.map((s, i) => {
    const x = P + (i / (scores.length - 1)) * innerW;
    const y = P + innerH - ((s - min) / range) * innerH;
    return { x, y, score: s };
  });

  // Smooth quadratic curve
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} Q ${cpX.toFixed(2)},${prev.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)},${H - P} L ${points[0].x.toFixed(2)},${H - P} Z`;
  const last = points[points.length - 1];

  const totalDelta = scores[scores.length - 1] - scores[0];
  const firstDate = data[0]?.scan_date ? format(new Date(data[0].scan_date), "MMM d") : "";

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Posture Trend
          </p>
          <p className="text-sm font-bold mt-0.5">
            {data.length} {data.length === 1 ? "scan" : "scans"} tracked
          </p>
        </div>
        <div
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            totalDelta > 0
              ? "bg-emerald-100 text-emerald-700"
              : totalDelta < 0
              ? "bg-rose-100 text-rose-700"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {totalDelta > 0 ? `+${totalDelta}` : totalDelta < 0 ? `${totalDelta}` : "Steady"}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spinelab-chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spinelab-chart-grad)" />
        <path
          d={linePath}
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Latest data point — bigger, with white ring */}
        <circle cx={last.x} cy={last.y} r="7" fill="hsl(var(--primary))" opacity="0.2" />
        <circle cx={last.x} cy={last.y} r="5" fill="hsl(var(--primary))" />
        <circle cx={last.x} cy={last.y} r="2.5" fill="white" />
      </svg>

      <div className="flex justify-between mt-3 text-[10px] font-medium text-muted-foreground">
        <span>{firstDate}</span>
        <span>Latest: {scores[scores.length - 1]}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color = "bg-primary", delta = null }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground/90">{label}</span>
          {delta != null && delta !== 0 && (
            <span
              className={`text-[10px] font-bold ${
                delta > 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-foreground">{safe}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}

function ScanRow({ scan, delta }) {
  const score = Number(scan.quality_score ?? 0);
  const dateLabel = scan.scan_date
    ? formatDistanceToNow(new Date(scan.scan_date), { addSuffix: true })
    : "Recently";
  const exactDate = scan.scan_date
    ? format(new Date(scan.scan_date), "EEE, MMM d")
    : "";

  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
      {scan.image_url ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
          <img
            src={scan.image_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize">{dateLabel}</p>
        <p className="text-xs text-muted-foreground truncate">
          {exactDate}
          {scan.pattern ? ` · ${scan.pattern}` : ""}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-lg font-bold leading-none">{score}</p>
        {delta != null && delta !== 0 && (
          <p
            className={`text-[10px] font-bold mt-1 ${
              delta > 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyScansCard() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Camera className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-bold mb-1.5">Take your first scan</p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
        Your posture score and progress over time will appear here after
        your first scan from the Scan tab.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function Progress() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user?.id) {
          if (mounted) setLoading(false);
          return;
        }

        const [
          { data: profileData, error: profileError },
          { data: scansData, error: scansError },
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("posture_scans")
            .select("*")
            .eq("user_id", user.id)
            .order("scan_date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (profileError) throw profileError;
        if (scansError) throw scansError;
        if (!mounted) return;

        setProfile(profileData || null);
        setScans(Array.isArray(scansData) ? scansData : []);
      } catch (err) {
        console.error("[Progress] load error:", err);
        if (!mounted) return;
        setProfile(null);
        setScans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProgress();
    return () => {
      mounted = false;
    };
  }, []);

  const completedScans = useMemo(
    () => scans.filter((s) => Number.isFinite(Number(s?.quality_score))),
    [scans]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const spineScore = Number(profile?.spine_score ?? 0);
  const postureScore = Number(
    profile?.posture_score ?? completedScans[0]?.quality_score ?? 0
  );
  const consistencyScore = Number(profile?.consistency_score ?? 0);
  const currentStreak = Number(profile?.current_streak ?? 0);
  const longestStreak = Number(profile?.longest_streak ?? 0);

  const level = getLevel(spineScore);
  const spineAge = calcSpineAge(spineScore, profile?.age_range);

  // Contextual subtitle based on momentum
  let subtitle = "Building your foundation, one day at a time.";
  if (completedScans.length === 0 && !profile?.spine_score) {
    subtitle = "Take your first scan to begin your journey.";
  } else if (currentStreak >= 7) {
    subtitle = `${currentStreak} days strong — keep showing up.`;
  } else if (currentStreak >= 3) {
    subtitle = `${currentStreak}-day streak. Momentum is building.`;
  } else if (currentStreak >= 1) {
    subtitle = "You're building momentum.";
  }

  // Stagger entry animation
  const container = { animate: { transition: { staggerChildren: 0.06 } } };
  const item = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="px-5 pt-12 pb-10 space-y-5 max-w-lg mx-auto"
    >
      {/* ── Header ── */}
      <motion.div variants={item}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
          Progress
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          Your journey
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </motion.div>

      {/* ── Hero: Spine Score + Spine Age ── */}
      <motion.div
        variants={item}
        className="bg-card border border-border rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <SpineScoreRing score={spineScore} size={130} strokeWidth={10} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Spine Age
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-5xl font-black leading-none ${level.color}`}
              >
                {spineAge}
              </p>
              <p className="text-xs text-muted-foreground">years</p>
            </div>
            <div
              className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${level.bg} ${level.color}`}
            >
              <Sparkles className="w-3 h-3" />
              {level.title}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Progress to next level
            </p>
            <p className="text-[11px] text-muted-foreground">
              {spineScore} / 100
            </p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: level.ring }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, spineScore))}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Trend chart ── */}
      <motion.div variants={item}>
        <ScoreChart scans={completedScans} />
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <StatTile icon={Flame} value={currentStreak} label="Day streak" />
        <StatTile icon={Trophy} value={longestStreak} label="Best streak" />
        <StatTile icon={Camera} value={completedScans.length} label="Total scans" />
      </motion.div>

      {/* ── Score breakdown (real metrics only) ── */}
      <motion.div
        variants={item}
        className="bg-card border border-border rounded-3xl p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
          Score Breakdown
        </p>
        <div className="space-y-4">
          <ScoreBar
            label="Posture"
            value={postureScore}
            color="bg-violet-500"
          />
          <ScoreBar
            label="Consistency"
            value={consistencyScore}
            color="bg-primary"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
          Posture comes from your most recent scan. Consistency grows as you
          complete daily routines.
        </p>
      </motion.div>

      {/* ── Recent scans ── */}
      <motion.div variants={item}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold">Recent scans</h2>
          {completedScans.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedScans.length} total
            </span>
          )}
        </div>

        {completedScans.length === 0 ? (
          <EmptyScansCard />
        ) : (
          <div className="space-y-2">
            {completedScans.slice(0, 7).map((scan, i) => {
              const score = Number(scan.quality_score ?? 0);
              const prev = completedScans[i + 1];
              const delta = prev
                ? score - Number(prev.quality_score ?? 0)
                : null;
              return (
                <ScanRow
                  key={scan.id || `${scan.scan_date}-${i}`}
                  scan={scan}
                  delta={delta}
                />
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
