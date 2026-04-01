import { motion, AnimatePresence } from "framer-motion";
import { PLAN_ADJUSTMENTS } from "@/lib/planAdaptor";
import { ChevronRight } from "lucide-react";

export default function PlanAdjusterSheet({ open, onClose, onApply }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl max-w-lg mx-auto"
            style={{ maxHeight: "60vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-0">
              <div className="w-9 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Adjust Workout</p>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto px-2 pb-6" style={{ maxHeight: "calc(60vh - 72px)" }}>
              {PLAN_ADJUSTMENTS.map((adj, i) => (
                <button
                  key={adj.id}
                  onClick={() => { onApply(adj.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-secondary transition-colors ${
                    i < PLAN_ADJUSTMENTS.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <span className="text-base w-6 text-center shrink-0">{adj.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{adj.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{adj.description}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}