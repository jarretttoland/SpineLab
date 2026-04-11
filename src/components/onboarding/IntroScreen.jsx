import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Scan, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HIGHLIGHTS = [
  { icon: Activity, text: "Personalized exercise plan" },
  { icon: Scan, text: "AI posture analysis" },
  { icon: TrendingUp, text: "Spine Score tracking" },
];

export default function IntroScreen({ onStart }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          SpineLab Assessment
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-4">
          Let's build your spine profile
        </h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed mb-10">
          Answer a few quick questions so we can personalize your plan.
        </p>

        <div className="space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 bg-secondary rounded-2xl px-4 py-3.5"
            >
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-10"
      >
        {/* Medical disclaimer */}
        <div className="flex items-start gap-2 bg-secondary/60 border border-border/60 rounded-2xl px-4 py-3 mb-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            SpineLab provides general posture insights and wellness guidance. It is not a medical diagnosis or treatment. Always consult a qualified healthcare professional for medical concerns.
          </p>
        </div>

        {/* Terms acceptance checkbox */}
        <button
          onClick={() => setAgreed((v) => !v)}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 text-left w-full mb-5 transition-all ${
            agreed ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            agreed ? "border-primary bg-primary" : "border-muted-foreground/40"
          }`}>
            {agreed && (
              <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-foreground/85 leading-relaxed">
            I agree to the{" "}
            <Link to="/terms" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 font-medium">
              Privacy Policy
            </Link>
          </span>
        </button>

        <Button
          onClick={onStart}
          disabled={!agreed}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
        >
          Begin Assessment
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Takes about 2 minutes · Your data is private
        </p>
      </motion.div>
    </div>
  );
}