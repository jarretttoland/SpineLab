import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { CATEGORIES } from "@/lib/exerciseLibrary";
import { EXERCISE_FEEDBACK } from "@/lib/planAdaptor";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Moderate", hard: "Advanced" };
const DIFFICULTY_COLOR = {
  easy:   "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  hard:   "text-rose-600 bg-rose-50",
};

export default function ExerciseCard({ exercise, index, locked, completed, onComplete, onFeedback, feedbackApplied }) {
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORIES[exercise.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`border rounded-2xl overflow-hidden bg-card transition-shadow hover:shadow-md ${
        locked ? "opacity-55" : ""
      } ${completed ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}
    >
      {/* Header */}
      <button
        onClick={() => !locked && setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 text-left"
        disabled={locked}
      >
        {/* Completion toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!locked && onComplete) onComplete(); }}
          className="shrink-0"
          disabled={locked}
        >
          {completed
            ? <CheckCircle2 className="w-6 h-6 text-primary" />
            : <Circle className="w-6 h-6 text-muted-foreground/40" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`font-semibold text-sm leading-tight ${completed ? "line-through text-muted-foreground" : ""}`}>
              {exercise.name}
            </p>
            {locked && (
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full uppercase tracking-wide">
                Pro
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${category.color}`}>
                {category.label}
              </span>
            )}
            {exercise.difficulty && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[exercise.difficulty]}`}>
                {DIFFICULTY_LABEL[exercise.difficulty]}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{exercise.duration}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">{exercise.benefit}</p>
        </div>

        {!locked && (
          expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && !locked && (
          <motion.div
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-4">
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-secondary">
                <img
                  src={exercise.mediaUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Target areas */}
              {exercise.targetAreas && (
                <div className="flex flex-wrap gap-1.5">
                  {exercise.targetAreas.map((area) => (
                    <span key={area} className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                      {area.replace("_", " ")}
                    </span>
                  ))}
                </div>
              )}

              {/* Dosage */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {exercise.dosage}
                </p>
                <p className="text-xs text-muted-foreground">{exercise.duration}</p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {exercise.description}
              </p>

              {/* Quick feedback buttons */}
              {onFeedback && !feedbackApplied && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">How does this feel?</p>
                  <div className="flex flex-wrap gap-2">
                    {EXERCISE_FEEDBACK.map((fb) => (
                      <button
                        key={fb.id}
                        onClick={() => onFeedback(exercise.id, fb.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <span>{fb.emoji}</span>
                        {fb.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {feedbackApplied && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-xs text-primary font-medium">Exercise adjusted for you.</p>
                </div>
              )}

              {onComplete && (
                <button
                  onClick={onComplete}
                  className={`w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    completed
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completed ? "Completed!" : "Mark as Done"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}