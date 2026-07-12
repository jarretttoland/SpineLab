import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Camera, Sparkles, TrendingUp, CalendarDays, Lock, Zap } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import SpineScoreRing from "@/components/SpineScoreRing";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import PaywallScreen from "@/components/paywall/PaywallScreen";
import { calcSpineAge } from "@/lib/spineScore";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getLevel(score) {
  if (score >= 85) return { title: "Elite",       color: "text-amber-600",   ring: "#f59e0b", bg: "bg-amber-50 border-amber-200",   bandLow: 85, bandHigh: 100 };
  if (score >= 70) return { title: "Resilient",   color: "text-violet-600",  ring: "#8b5cf6", bg: "bg-violet-50 border-violet-200", bandLow: 70, bandHigh: 85  };
  if (score >= 55) return { title: "Strong",      color: "text-emerald-600", ring: "#10b981", bg: "bg-emerald-50 border-emerald-200", bandLow: 55, bandHigh: 70 };
  if (score >= 40) return { title: "Stabilizing", color: "text-sky-600",     ring: "#0ea5e9", bg: "bg-sky-50 border-sky-200",       bandLow: 40, bandHigh: 55  };
  return               { title: "Rebuilding",  color: "text-rose-600",    ring: "#f43f5e", bg: "bg-rose-50 border-rose-200",     bandLow: 0,  bandHigh: 40  };
}

function getNextLevel(score) {
  if (score >= 85) return null;
  if (score >= 70) return { title: "Elite",       ring: "#f59e0b" };
  if (score >= 55) return { title: "Resilient",   ring: "#8b5cf6" };
  if (score >= 40) return { title: "Strong",      ring: "#10b981" };
  return               { title: "Stabilizing", ring: "#0ea5e9" };
}

// ─────────────────────────────────────────────────────────────
// Sparkline chart
// ─────────────────────────────────────────────────────────────

function LockedChart({ onUpgrade }) {
  // Fake sparkline to hint at what's behind the lock
  const fakePath = "M 14,80 Q 60,70 106,55 Q 152,40 198,50 Q 244,60 266,35 Q 278,25 306,22";
  const fakeArea = `${fakePath} L 306,106 L 14,106 Z`;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 relative overflow-hidden">
      {/* Blurred hint of a chart */}
      <svg viewBox="0 0 320 120" className="w-full h-auto block mb-3 opacity-30 blur-[3px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="locked-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fakeArea} fill="url(#locked-grad)" />
        <path d={fakePath} stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="306" cy="22" r="5" fill="hsl(var(--primary))" />
      </svg>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-bold mb-1">Score trend is a Premium feature</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px] mb-3">
          Track how your posture score changes over time with unlimited scans.
        </p>
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
        >
          <Zap className="w-3 h-3" />
          Upgrade to unlock
        </button>
      </div>
    </div>
  );
}

function ScoreChart({ scans }) {
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

  const W = 320, H = 120, P = 14;
  const innerW = W - P * 2;
  const innerH = H - P * 2;
  const scores = data.map((d) => Number(d.quality_score) || 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = Math.max(max - min, 10);

  const points = scores.map((s, i) => ({
    x: P + (i / (scores.length - 1)) * innerW,
    y: P + innerH - ((s - min) / range) * innerH,
    score: s,
  }));

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} Q ${cpX.toFixed(2)},${prev.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)},${H - P} L ${points[0].x.toFixed(2)},${H - P} Z`;
  const last = points[points.length - 1];
  const totalDelta = scores[scores.length - 1] - scores[0];
  const firstDate = data[0]?.scan_date ? format(new Date(data[0].scan_date + "T12:00:00"), "MMM d") : "";

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
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          totalDelta > 0 ? "bg-emerald-100 text-emerald-700"
          : totalDelta < 0 ? "bg-rose-100 text-rose-700"
          : "bg-secondary text-muted-foreground"
        }`}>
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
        <path d={linePath} stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

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
    ? formatDistanceToNow(new Date(scan.scan_date + "T12:00:00"), { addSuffix: true })
    : "Recently";
  const exactDate = scan.scan_date
    ? format(new Date(scan.scan_date + "T12:00:00"), "EEE, MMM d")
    : "";

  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
      {scan.image_url ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
          <img src={scan.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate capitalize">{dateLabel}</p>
        <p className="text-xs text-muted-foreground truncate">
          {exactDate}{scan.pattern ? ` · ${scan.pattern}` : ""}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[10px] text-muted-foreground mb-0.5">Posture Score</p>
        <p className="text-lg font-bold leading-none">{score}</p>
        {delta != null && delta !== 0 && (
          <p className={`text-[10px] font-bold mt-1 ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyScansCard({ onScan }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Camera className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-bold mb-1.5">Take your first scan</p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto mb-5">
        Your posture score and progress over time will appear here.
      </p>
      <Button onClick={onScan} className="rounded-2xl h-11 px-6 text-sm font-semibold gap-2">
        <Camera className="w-4 h-4" />
        Take a Scan
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function Progress() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState(null);
  const [scans, setScans]           = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadProgress() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user?.id) { if (mounted) setLoading(false); return; }

        const [
          { data: profileData, error: profileError },
          { data: scansData,   error: scansError   },
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("posture_scans")
            .select("*")
            .eq("user_id", user.id)
            .order("scan_date",   { ascending: false })
            .order("created_at",  { ascending: false })
            .limit(20),
        ]);

        if (profileError) throw profileError;
        if (scansError)   throw scansError;
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
    return () => { mounted = false; };
  }, []);

  const completedScans = useMemo(
    () => scans.filter((s) => Number.isFinite(Number(s?.quality_score))),
    [scans]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100dvh - 96px)" }}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const spineScore     = Number(profile?.spine_score    ?? 0);
  const currentStreak  = Number(profile?.current_streak ?? 0);
  const longestStreak  = Number(profile?.longest_streak ?? 0);
  const isPremium      = profile?.subscription_tier === "premium";

  const level     = getLevel(spineScore);
  const nextLevel = getNextLevel(spineScore);
  const spineAge  = calcSpineAge(spineScore, profile?.age_range);

  // Progress within current level band (not spineScore/100)
  const bandProgress = Math.round(
    ((spineScore - level.bandLow) / (level.bandHigh - level.bandLow)) * 100
  );

  // Contextual subtitle
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

  const container = { animate: { transition: { staggerChildren: 0.06 } } };
  const item = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (showPaywall) {
    return (
      <PaywallScreen
        source="progress_trend"
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
      />
    );
  }

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="px-5 pt-4 pb-10 space-y-5 max-w-lg mx-auto"
    >
      {/* ── Header ── */}
      <motion.div variants={item}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
          Progress
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">Your journey</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </motion.div>

      {/* ── Hero: Spine Score + Spine Age ── */}
      <motion.div variants={item} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <SpineScoreRing score={spineScore} size={130} strokeWidth={10} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Spine Age
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-5xl font-black leading-none ${level.color}`}>{spineAge}</p>
              <p className="text-xs text-muted-foreground">years</p>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${level.bg} ${level.color}`}>
              <Sparkles className="w-3 h-3" />
              {level.title}
            </div>
          </div>
        </div>

        {/* Level band progress bar */}
        <div className="mt-5 pt-5 border-t border-border/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Progress to {nextLevel ? nextLevel.title : "Max Level"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {nextLevel
                ? `${level.bandHigh - spineScore} pts to go`
                : "SpineLab 100 reached"}
            </p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: level.ring }}
              initial={{ width: 0 }}
              animate={{ width: `${bandProgress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          {nextLevel && (
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">{level.title}</span>
              <span className="text-[10px] font-semibold" style={{ color: nextLevel.ring }}>
                {nextLevel.title}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Trend chart ── */}
      <motion.div variants={item}>
        {isPremium
          ? <ScoreChart scans={completedScans} />
          : <LockedChart onUpgrade={() => setShowPaywall(true)} />
        }
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <StatTile icon={Flame}        value={currentStreak}         label="Day streak"    />
        <StatTile icon={Trophy}       value={longestStreak}         label="Longest streak" />
        <StatTile icon={Camera}       value={completedScans.length} label="Total scans"   />
      </motion.div>

      {/* ── Recent scans ── */}
      <motion.div variants={item}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold">Recent scans</h2>
          {completedScans.length > 0 && (
            <span className="text-xs text-muted-foreground">{completedScans.length} total</span>
          )}
        </div>

        {completedScans.length === 0 ? (
          <EmptyScansCard onScan={() => navigate("/scan")} />
        ) : (
          <div className="space-y-2">
            {completedScans.slice(0, 7).map((scan, i) => {
              const score = Number(scan.quality_score ?? 0);
              const prev  = completedScans[i + 1];
              const delta = prev ? score - Number(prev.quality_score ?? 0) : null;
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
