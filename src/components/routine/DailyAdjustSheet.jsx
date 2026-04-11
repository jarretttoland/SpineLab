import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingDown, Zap, Armchair } from "lucide-react";

export default function DailyAdjustSheet({
  open,
  onClose,
  onTooEasy,
  onTooHard,
  onChairOnly,
  currentLevel = "moderate",
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex w-full max-w-lg flex-col rounded-t-3xl border border-border bg-background shadow-xl"
            style={{
              maxHeight: "calc(100dvh - 12px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 pb-3">
              <div>
                <h2 className="text-lg font-bold">Adjust Workout</h2>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  Current level: {currentLevel}
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className="overflow-y-auto px-5 py-4"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 132px)",
              }}
            >
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onTooEasy();
                    onClose();
                  }}
                  className="w-full rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-secondary/70"
                >
                  <div className="flex flex-col items-start gap-1.5">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-semibold">Too Easy</span>
                    <span className="text-xs text-muted-foreground">
                      Increase difficulty going forward
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onTooHard();
                    onClose();
                  }}
                  className="w-full rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-secondary/70"
                >
                  <div className="flex flex-col items-start gap-1.5">
                    <TrendingDown className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-semibold">Too Hard</span>
                    <span className="text-xs text-muted-foreground">
                      Reduce difficulty going forward
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onChairOnly();
                    onClose();
                  }}
                  className="w-full rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-secondary/70"
                >
                  <div className="flex flex-col items-start gap-1.5">
                    <Armchair className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Chair Only</span>
                    <span className="text-xs text-muted-foreground">
                      Use the seated recovery workout for today only
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}