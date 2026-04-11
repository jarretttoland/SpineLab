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

function ScoreBar({ label, value = 0, estimated = false }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const color =
    safeValue >= 70 ? "bg-primary" : safeValue >= 45 ? "bg-amber-400" : "bg-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {estimated && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              estimated
            </span>
          )}
          <span className="text-sm font-bold">{safeValue}</span>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, safeValue))}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export default function SpineScoreResults({
  score = 0,
  breakdown = {},
  archetypeKey = "deconditioned",
  planFocus = [],
  postureFindings = [],
  onBuildPlan,
}) {
  const safeBreakdown = {
    mobility: Number.isFinite(breakdown?.mobility) ? breakdown.mobility : 0,
    strength: Number.isFinite(breakdown?.strength) ? breakdown.strength : 0,
    posture: Number.isFinite(breakdown?.posture) ? breakdown.posture : 0,
  };

  const safePlanFocus = Array.isArray(planFocus) ? planFocus : [];
  const safePostureFindings = Array.isArray(postureFindings) ? postureFindings : [];
  const archetype = ARCHETYPES?.[archetypeKey] || ARCHETYPES?.deconditioned || {
    label: "Balanced Starter",
    description: "Your plan will focus on mobility, stability, and posture support.",
  };

  const hasPhoto = safePostureFindings.length > 0;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          Your Results
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-6">Your Spine Score</h1>

        <div className="flex justify-center">
          <SpineScoreRing score={score || 0} size={160} strokeWidth={11} />
        </div>

        <p className="text-sm text-muted-foreground mt-3">
          {score >= 75
            ? "Strong baseline. Targeted work will optimize your performance."
            : score >= 55
            ? "Moderate — your body needs consistent, focused attention."
            : "Your spine needs support. Your plan will address the main weak points."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-3xl p-5 mb-5"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Score Breakdown
        </h2>

        <div className="space-y-5">
          <ScoreBar label="Mobility" value={safeBreakdown.mobility} />
          <ScoreBar label="Strength & Stability" value={safeBreakdown.strength} />

          <div className="space-y-1">
            <ScoreBar
              label="Posture"
              value={safeBreakdown.posture}
              estimated={!hasPhoto}
            />
            {!hasPhoto && (
              <p className="text-[11px] text-muted-foreground">
                Estimated. A posture scan will provide your actual posture score.
              </p>
            )}
          </div>
        </div>

        {hasPhoto && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Photo Findings
            </p>
            <div className="flex flex-wrap gap-2">
              {safePostureFindings.map((f, i) => (
                <span
                  key={`${f}-${i}`}
                  className="text-xs bg-destructive/10 text-destructive rounded-full px-3 py-1 font-medium"
                >
                  {FINDING_LABELS[f] || f}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-3xl p-5 mb-5"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Your Spine Profile
        </h2>

        <div className="inline-block bg-primary/10 rounded-xl px-3 py-1.5 mb-3">
          <span className="text-sm font-semibold text-primary">{archetype.label}</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {archetype.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-3xl p-5 mb-8"
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
          What your plan will focus on
        </h2>

        {safePlanFocus.length > 0 ? (
          <div className="space-y-2.5">
            {safePlanFocus.map((item, i) => (
              <motion.div
                key={`${item}-${i}`}
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Your plan will focus on posture, mobility, and spine stability.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <Button
          onClick={onBuildPlan}
          disabled={!onBuildPlan}
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