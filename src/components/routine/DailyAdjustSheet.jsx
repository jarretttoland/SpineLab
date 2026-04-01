import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const RESTRICTION_OPTIONS = [
  { id: "back_surgery", label: "Back surgery", icon: "🩺" },
  { id: "pain_flare", label: "Pain flare today", icon: "⚡" },
  { id: "no_floor", label: "Can't be on floor", icon: "🚫" },
  { id: "seated_only", label: "Seated only", icon: "🪑" },
  { id: "shoulder_pain", label: "Shoulder pain", icon: "💪" },
];

export default function DailyAdjustSheet({ open, onClose, onLowerIntensity, onMakeHarder, onRestriction, activeRestrictions = [] }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-xl max-w-lg mx-auto flex flex-col"
            style={{ height: "88vh", maxHeight: "88vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header — fixed */}
            <div className="px-5 pt-3 pb-3 flex items-center justify-between flex-shrink-0 border-b border-border/50">
              <h2 className="text-lg font-bold">Adjust Today's Workout</h2>
              <button onClick={onClose} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 pt-4 pb-16" style={{ WebkitOverflowScrolling: "touch" }}>
              {/* Intensity controls */}
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Intensity</p>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <button
                  onClick={() => { onLowerIntensity(); onClose(); }}
                  className="flex flex-col items-start gap-1.5 bg-secondary hover:bg-secondary/70 rounded-2xl p-4 transition-colors"
                >
                  <TrendingDown className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-semibold">Lower Intensity</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">Today only — returns to your level tomorrow</span>
                </button>
                <button
                  onClick={() => { onMakeHarder(); onClose(); }}
                  className="flex flex-col items-start gap-1.5 bg-secondary hover:bg-secondary/70 rounded-2xl p-4 transition-colors"
                >
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-semibold">Make it Harder</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">Step up to next level permanently</span>
                </button>
              </div>

              {/* Restrictions → seated mode */}
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Restrictions</p>
              <p className="text-xs text-muted-foreground mb-3">Any of these switches to a safe Seated Mode workout.</p>
              <div className="space-y-2">
                {RESTRICTION_OPTIONS.map((opt) => {
                  const active = activeRestrictions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { onRestriction(opt.id); onClose(); }}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors ${
                        active
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary hover:bg-secondary/70"
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className={`text-sm font-medium ${active ? "text-primary" : ""}`}>{opt.label}</span>
                      {active && <span className="ml-auto text-xs font-semibold text-primary">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}