import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

/**
 * MultiSelectStep — allows selecting one or more options (checkbox style).
 * Single-select mode (singleSelect=true) renders radio-style UI for tiebreaker questions.
 */
export default function MultiSelectStep({
  step,
  total,
  question,
  subtitle,
  options,
  selected = [],     // array of selected values
  onToggle,          // (value) => void — toggle a value in/out
  onNext,
  onBack,
  singleSelect = false,  // if true, only one selection allowed (radio style)
  minSelect = 1,
}) {
  const canProceed = selected.length >= minSelect;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8">
      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-border"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${singleSelect ? "single" : "multi"}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
            Question {step + 1} of {total}
          </p>
          <h1 className="text-2xl font-bold tracking-tight leading-snug mb-2">{question}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
          {!singleSelect && (
            <p className="text-xs text-muted-foreground mb-6">Select all that apply</p>
          )}

          <div className="space-y-3 mt-2">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <motion.button
                  key={String(opt.value)}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onToggle(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-secondary/60"
                  }`}
                >
                  {singleSelect ? (
                    // Radio style
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  ) : (
                    // Checkbox style
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-14 w-14 rounded-2xl shrink-0"
          size="icon"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 h-14 rounded-2xl text-base font-semibold gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}