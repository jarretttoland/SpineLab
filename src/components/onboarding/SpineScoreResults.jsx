import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw } from "lucide-react";
import SpineScoreRing from "@/components/SpineScoreRing";
import { ARCHETYPES } from "@/lib/spineScore";

const FINDING_LABELS = {
  forward_head: "Forward head posture",
  rounded_shoulders: "Rounded shoulders",
  anterior_pelvic_tilt: "Anterior pelvic tilt",
};

function ScoreBar({ label, value, estimated = false }) {
  const color = value >= 70 ? "bg-primary" : value >= 45 ? "bg-amber-400" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {estimated && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">estimated</span>
          )}
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export default function SpineScoreResults({ score, breakdown, archetypeKey, planFocus, postureFindings = [], onBuildPlan }) {
  const archetype = ARCHETYPES[archetypeKey] || ARCHETYPES.deconditioned;
  const hasPhoto = postureFindings.length > 0;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10">
      {/* Section 1 — Score */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">Your Results</p>
        <h1 className="text-2xl font-bold tracking-tight mb-6">Your Spine Score</h1>
        <div className="flex justify-center">
          <SpineScoreRing score={score} size={160} strokeWidth={11} />
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {score >= 75
            ? "Strong baseline. Targeted work will optimize your performance."
            : score >= 55
            ? "Moderate — your body needs consistent, focused attention."
            : "Your spine needs support. Your plan will address the root causes."}
        </p>
      </motion.div>

      {/* Section 2 — Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-3xl p-5 mb-5"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Score Breakdown</h2>
        <div className="space-y-5">
          <ScoreBar label="Mobility" value={breakdown.mobility} />
          <ScoreBar label="Strength & Stability" value={breakdown.strength} />
          <ScoreBar label="Posture" value={breakdown.posture} estimated={!hasPhoto} />
        </div>
        {!hasPhoto && (
          <p className="text-[11px] text-muted-foreground mt-4">
            * Posture score is estimated. Upload a photo to get a precise reading.
          </p>
        )}
        {hasPhoto && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Photo Findings</p>
            <div className="flex flex-wrap gap-2">
              {postureFindings.map((f) => (
                <span key={f} className="text-xs bg-destructive/10 text-destructive rounded-full px-3 py-1 font-medium">
                  {FINDING_LABELS[f] || f}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 3 — Spine Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-3xl p-5 mb-5"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Your Spine Profile</h2>
        <div className="inline-block bg-primary/10 rounded-xl px-3 py-1.5 mb-3">
          <span className="text-sm font-semibold text-primary">{archetype.label}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{archetype.description}</p>
      </motion.div>

      {/* Section 4 — Plan Focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-3xl p-5 mb-8"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">What your plan will focus on</h2>
        <div className="space-y-2.5">
          {planFocus.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-sm text-foreground">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <Button
          onClick={onBuildPlan}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
        >
          Build My Plan
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <RefreshCw className="inline w-3 h-3 mr-1 opacity-60" />
          Re-scan your posture in 14 days to track your progress.
        </p>
      </motion.div>
    </div>
  );
}