// FILE: src/components/posture/ScanResults.jsx
// Premium redesign:
//   - Animated SVG score ring (fills on mount, number counts up)
//   - Spine score impact: before → after with animated delta
//   - Sub-score grid removed
//   - AI summary types out after the ring animation settles
//   - Findings cards with severity color bars (no confidence label)
//   - Full dark-overlay photo section with landmark toggle

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Dumbbell,
  Share2,
} from "lucide-react";
import { shareSpineScore } from "@/lib/shareCard";
import { hapticSuccess } from "@/lib/haptics";

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────────────────────────────────────────

const RING_SIZE   = 210;
const STROKE_W    = 14;
const RADIUS      = (RING_SIZE / 2) - STROKE_W / 2 - 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(s) {
  if (s >= 88) return "#10b981"; // emerald
  if (s >= 74) return "#3b82f6"; // blue
  if (s >= 58) return "#f59e0b"; // amber
  return "#ef4444";              // rose
}

function scoreGrade(s) {
  if (s >= 88) return "Excellent";
  if (s >= 74) return "Good";
  if (s >= 58) return "Fair";
  return "Needs Work";
}

function ScoreRing({ score, animate: shouldAnimate = true }) {
  const [displayed, setDisplayed] = useState(shouldAnimate ? 0 : score);
  const [offset, setOffset]       = useState(shouldAnimate ? CIRCUMFERENCE : CIRCUMFERENCE * (1 - score / 100));
  const rafRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate) return;
    const delay = setTimeout(() => {
      // Kick off stroke animation
      setOffset(CIRCUMFERENCE * (1 - score / 100));

      // Count-up number
      const duration = 1300;
      const start    = performance.now();
      const step = (now) => {
        const t        = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - t, 3); // cubic ease-out
        setDisplayed(Math.round(eased * score));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, 380);

    return () => {
      clearTimeout(delay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, shouldAnimate]);

  const color = scoreColor(score);
  const grade = scoreGrade(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-secondary"
            strokeWidth={STROKE_W}
          />
          {/* Fill arc */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: `drop-shadow(0 0 8px ${color}88)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="relative flex flex-col items-center">
          <span
            className="font-black leading-none"
            style={{ fontSize: 58, color, letterSpacing: "-0.03em" }}
          >
            {displayed}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mt-1">
            Posture Score
          </span>
        </div>
      </div>

      {/* Grade pill */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {grade}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINE SCORE IMPACT
// ─────────────────────────────────────────────────────────────────────────────

function SpineImpact({ previous, next, delta }) {
  const improved = delta > 0;
  const same     = delta === 0;
  const deltaAbs = Math.abs(delta);

  const color = improved ? "#10b981" : same ? "#94a3b8" : "#ef4444";
  const Icon  = improved ? TrendingUp : same ? Minus : TrendingDown;
  const sign  = delta > 0 ? "+" : delta < 0 ? "−" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.5 }}
      className="rounded-3xl overflow-hidden border border-border bg-card"
    >
      <div className="px-5 pt-4 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Total Spine Score Impact
        </p>
      </div>

      <div className="flex items-center justify-between px-5 pb-5 pt-3">
        {/* Before */}
        <div className="text-center">
          <p className="text-4xl font-black text-foreground/40 leading-none">{previous}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Before</p>
        </div>

        {/* Arrow + delta */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-black"
            style={{ backgroundColor: `${color}18`, color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {sign}{deltaAbs}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
        </div>

        {/* After */}
        <div className="text-center">
          <p
            className="text-4xl font-black leading-none"
            style={{ color }}
          >
            {next}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">After</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPED SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function TypedSummary({ text, startDelay = 2200 }) {
  const [shown, setShown] = useState("");
  const [done, setDone]   = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!text) return;
    setShown("");
    setDone(false);

    const timeout = setTimeout(() => {
      let i = 0;
      intervalRef.current = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(intervalRef.current);
          setDone(true);
        }
      }, 16);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [text, startDelay]);

  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: (startDelay - 200) / 1000, duration: 0.4 }}
      className="bg-secondary/60 border border-border rounded-2xl px-4 py-4"
    >
      <p className="text-sm text-foreground/85 leading-relaxed">
        {shown}
        {!done && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle bg-primary rounded-full"
            style={{ animation: "pulse 0.9s ease-in-out infinite" }}
          />
        )}
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINDING CARD
// ─────────────────────────────────────────────────────────────────────────────

// Maps finding IDs → human-readable focus area for the routine callout
const FINDING_FOCUS_LABELS = {
  forward_head:      "forward head posture",
  rounded_shoulders: "rounded shoulders",
  upper_crossed:     "rounded shoulders",
  pelvic_tilt:       "pelvic alignment",
  lumbar_lordosis:   "thoracic mobility",
  kyphosis_lordosis: "thoracic mobility",
};

const SEVERITY_RANK = { notable: 3, moderate: 2, mild: 1, good: 0, invalid: -1 };

function getTopFindingLabel(findings = []) {
  const top = findings
    .filter((f) => FINDING_FOCUS_LABELS[f.id] && f.severity !== "good" && f.severity !== "invalid")
    .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0))[0];
  return top ? FINDING_FOCUS_LABELS[top.id] : null;
}

const SEV_CONFIG = {
  notable:  { label: "High",     color: "#ef4444", bg: "#fef2f2" },
  moderate: { label: "Moderate", color: "#f59e0b", bg: "#fffbeb" },
  mild:     { label: "Mild",     color: "#3b82f6", bg: "#eff6ff" },
  good:     { label: "Good",     color: "#10b981", bg: "#f0fdf4" },
};

function FindingCard({ finding, index }) {
  const [open, setOpen] = useState(false);
  const sev = SEV_CONFIG[finding.severity] ?? SEV_CONFIG.mild;

  if (finding.severity === "good" || finding.severity === "invalid") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.35 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
      onClick={() => setOpen((v) => !v)}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Severity dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: sev.color, boxShadow: `0 0 6px ${sev.color}88` }}
        />

        <p className="flex-1 text-sm font-semibold text-foreground leading-snug">
          {finding.label}
        </p>

        {/* Severity pill */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: sev.color, backgroundColor: sev.bg }}
        >
          {sev.label}
        </span>

        <ChevronRight
          className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && finding.detail && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border"
              style={{ borderColor: `${sev.color}22` }}
            >
              <div className="pt-3">{finding.detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDMARK OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

function LandmarkOverlay({ landmarks }) {
  if (!landmarks || landmarks.length === 0) return null;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {landmarks.map((d) => (
        <g key={d.id}>
          <circle cx={d.normX} cy={d.normY} r="0.022" fill={d.color} opacity="0.2" />
          <circle cx={d.normX} cy={d.normY} r="0.011" fill={d.color} opacity="0.95" />
          <circle cx={d.normX} cy={d.normY} r="0.005" fill="white" />
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function FailureScreen({ onRetakeCamera, onRetakeLibrary, onNewScan, showContinueButton, onContinue, continueLabel }) {
  return (
    <div className="px-6 pt-12 pb-8 max-w-lg mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">Scan Result</p>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Scan couldn't be read</h1>
      <p className="text-sm text-muted-foreground mb-8">
        We couldn't get a reliable posture reading. Try again with your full side profile visible.
      </p>

      <div className="bg-secondary rounded-3xl p-6 text-center mb-8">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="font-bold text-base mb-2">Unclear posture reading</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Landmark detection was inconclusive. Make sure your full body is sideways, well-lit, and against a plain background.
        </p>
      </div>

      <div className="space-y-3">
        {showContinueButton && onContinue ? (
          <Button onClick={onContinue} className="w-full h-14 rounded-2xl text-base font-semibold">
            {continueLabel || "See Total Spine Score"}
          </Button>
        ) : null}
        <Button onClick={onRetakeCamera} className="w-full h-14 rounded-2xl text-base font-semibold">
          Retake with Camera
        </Button>
        <Button variant="outline" onClick={onRetakeLibrary} className="w-full h-12 rounded-2xl">
          Choose Different Photo
        </Button>
        <Button variant="ghost" onClick={onNewScan} className="w-full text-muted-foreground text-sm">
          Back to start
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScanResults({
  imageUrl        = "",
  landmarks       = [],
  findings        = [],
  overallScore    = 0,
  summary         = "",
  pattern         = "",
  trend           = null,
  scanDate        = "",
  subscores       = { headNeck: 0, shoulderThoracic: 0, lumbarPelvis: 0 },
  spineDelta      = 0,
  previousSpineScore = 50,
  newSpineScore   = 50,
  spineAge        = null,
  onNewScan,
  onRetakeCamera,
  onRetakeLibrary,
  detectionFailed = false,
  saveError       = null,
  showContinueButton = false,
  onContinue      = null,
  continueLabel   = "See Total Spine Score",
}) {
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    hapticSuccess();
    await shareSpineScore({ score: overallScore, spineAge, totalSpineScore: newSpineScore, scanDate });
    setSharing(false);
  };

  if (detectionFailed) {
    return (
      <FailureScreen
        onRetakeCamera={onRetakeCamera}
        onRetakeLibrary={onRetakeLibrary}
        onNewScan={onNewScan}
        showContinueButton={showContinueButton}
        onContinue={onContinue}
        continueLabel={continueLabel}
      />
    );
  }

  const activeFindings = findings.filter(
    (f) => f.severity !== "good" && f.severity !== "invalid"
  );

  // Format date nicely
  let displayDate = scanDate;
  try {
    if (scanDate && /^\d{4}-\d{2}-\d{2}$/.test(scanDate)) {
      displayDate = new Date(scanDate + "T12:00:00").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
    }
  } catch (_) {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="h-[100dvh] bg-background flex flex-col"
    >
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1.5">
            Analysis Complete
          </p>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Scan Results</h1>
            <p className="text-xs text-muted-foreground">{displayDate}</p>
          </div>
        </div>

        {/* ── Score Ring — hero ────────────────────────────────── */}
        <div className="flex justify-center mb-7">
          <ScoreRing score={overallScore} animate />
        </div>

        {/* ── Pattern badge ────────────────────────────────────── */}
        {pattern && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.4 }}
            className="flex justify-center mb-6"
          >
            <span className="text-xs font-semibold bg-secondary text-foreground/65 px-3 py-1.5 rounded-xl border border-border">
              {pattern}
            </span>
          </motion.div>
        )}

        {/* ── Spine score impact ───────────────────────────────── */}
        <div className="mb-6">
          <SpineImpact
            previous={previousSpineScore}
            next={newSpineScore}
            delta={spineDelta}
          />
        </div>

        {/* ── AI Summary (typed out) ───────────────────────────── */}
        {summary ? (
          <div className="mb-6">
            <TypedSummary text={summary} startDelay={2200} />
          </div>
        ) : null}

        {/* ── Scan photo ───────────────────────────────────────── */}
        {imageUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div
              className="relative rounded-3xl overflow-hidden bg-secondary"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={imageUrl}
                alt="Posture scan"
                className="w-full h-full object-cover"
              />
              {showLandmarks && <LandmarkOverlay landmarks={landmarks} />}

              {/* Landmark toggle — subtle overlay pill */}
              <button
                onClick={() => setShowLandmarks((v) => !v)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full"
              >
                {showLandmarks ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showLandmarks ? "Hide" : "Show"} landmarks
              </button>
            </div>
          </motion.div>
        ) : null}

        {/* ── Findings ─────────────────────────────────────────── */}
        {activeFindings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">
              Posture Patterns
            </p>
            <div className="space-y-2">
              {activeFindings.map((f, i) => (
                <FindingCard key={f.id || `${f.label}-${i}`} finding={f} index={i} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
              Tap any finding to expand details
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">No significant postural tendencies detected.</p>
          </motion.div>
        )}

        {/* ── Routine update callout ────────────────────────────── */}
        {(() => {
          const focusLabel = getTopFindingLabel(findings);
          if (!focusLabel) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3.5 mb-6"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Routine updated</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Your next workout now includes exercises targeting your{" "}
                  <span className="font-semibold text-foreground/80">{focusLabel}</span>.
                </p>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Save error ───────────────────────────────────────── */}
        {saveError && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 mb-5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 leading-snug">{saveError}</p>
          </div>
        )}

      </div>
      </div>

      {/* ── Bottom CTA — flex child, always at bottom ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="shrink-0 px-5 bg-background/90 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)", paddingTop: "14px" }}
      >
        <div className="max-w-lg mx-auto space-y-2.5">
          {showContinueButton && onContinue ? (
            <Button
              onClick={onContinue}
              className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
            >
              {continueLabel || "See Total Spine Score"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : null}

          {/* Share + New Scan row */}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 h-12 rounded-2xl gap-2 font-semibold"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? "Generating…" : "Share"}
            </Button>
            <Button
              variant="ghost"
              onClick={onNewScan}
              className="flex-1 h-12 rounded-2xl text-muted-foreground gap-2 text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Scan
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
