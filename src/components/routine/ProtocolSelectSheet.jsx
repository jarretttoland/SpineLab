import { motion } from "framer-motion";
import { X, Check, Lock, ChevronRight, Zap } from "lucide-react";

export const PROTOCOLS = [
  {
    id:          "balanced",
    name:        "Balanced",
    tagline:     "General spine health",
    description: "A rotating mix of mobility, stability, and posture work covering the whole spine.",
    duration:    null,
    premium:     false,
    phases:      null,
  },
  {
    id:          "neck",
    name:        "Neck Focus",
    tagline:     "Neck & upper back",
    description: "Targets forward head posture, neck stiffness, and upper back tension.",
    duration:    null,
    premium:     false,
    phases:      null,
  },
  {
    id:          "mid_back",
    name:        "Mid Back",
    tagline:     "Thoracic & shoulders",
    description: "Opens the thoracic spine and addresses rounded shoulder patterns.",
    duration:    null,
    premium:     false,
    phases:      null,
  },
  {
    id:          "low_back",
    name:        "Low Back",
    tagline:     "Core & pelvic support",
    description: "Builds the core stability and hip mobility needed to support the lumbar spine.",
    duration:    null,
    premium:     false,
    phases:      null,
  },
  {
    id:          "desk_worker",
    name:        "Desk Worker Protocol",
    tagline:     "6-week program + ongoing maintenance",
    description: "Built for people who sit all day. Targets forward head posture, rounded shoulders, and tight hip flexors through three progressive phases — then keeps you there.",
    duration:    "6 weeks+",
    premium:     true,
    phases:      ["Foundation", "Activation", "Reinforcement", "Maintenance"],
  },
  {
    id:          "low_back_pain",
    name:        "Low Back Pain Protocol",
    tagline:     "6-week program + ongoing maintenance",
    description: "A progressive program for lower back pain. Starts gentle, builds core stability, advances to strength — then ongoing maintenance to protect your progress.",
    duration:    "6 weeks+",
    premium:     true,
    phases:      ["Gentle Activation", "Stability", "Strength", "Maintenance"],
  },
];

export default function ProtocolSelectSheet({
  open,
  onClose,
  currentPlanType,
  isPremium,
  currentPhase = 1,
  onSelect,
  onUpgrade,
}) {
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
        className="relative z-10 bg-background rounded-t-[2rem] max-h-[88vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Choose Protocol</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPremium
                  ? "All protocols unlocked"
                  : "Upgrade to access 6-week structured programs"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* List */}
        <div
          className="overflow-y-auto px-5 py-4 space-y-3"
          style={{ paddingBottom: "max(20px, calc(env(safe-area-inset-bottom) + 20px))" }}
        >
          {PROTOCOLS.map((p) => {
            const isLocked   = p.premium && !isPremium;
            const isSelected = p.id === currentPlanType;
            const showPhase  = isSelected && p.phases && currentPhase;

            return (
              <button
                key={p.id}
                onClick={() => {
                  if (isLocked) { onUpgrade?.(); return; }
                  onSelect(p.id);
                }}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isLocked
                    ? "border-border bg-secondary/30"
                    : "border-border bg-card active:scale-[0.98]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">

                    {/* Name + badges */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`text-sm font-bold ${isLocked ? "text-muted-foreground" : ""}`}>
                        {p.name}
                      </p>
                      {p.duration && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {p.duration}
                        </span>
                      )}
                      {p.premium && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          Premium
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className={`text-xs leading-relaxed ${isLocked ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                      {p.description}
                    </p>

                    {/* Phase breadcrumb */}
                    {p.phases && !isLocked && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {p.phases.map((phase, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-semibold ${
                              showPhase && currentPhase === i + 1
                                ? "text-primary"
                                : "text-muted-foreground/50"
                            }`}
                          >
                            {phase}{i < p.phases.length - 1 ? " →" : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Upgrade nudge for locked */}
                    {isLocked && (
                      <div className="flex items-center gap-1 mt-2">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          Upgrade to unlock
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right icon */}
                  <div className="shrink-0 mt-0.5">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-muted-foreground/40" />
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
