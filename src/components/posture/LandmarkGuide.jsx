import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Ruler, RotateCcw, User, HardHat, Timer, ShieldCheck } from "lucide-react";

function SideSilhouette() {
  return (
    <svg viewBox="0 0 160 340" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="86" cy="30" rx="18" ry="21" fill="currentColor" opacity="0.18" />
      <path d="M82 50 Q80 62 79 70" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.18" />
      <path d="M72 70 Q65 110 67 148 Q69 172 80 184"
        stroke="currentColor" strokeWidth="24" strokeLinecap="round" fill="none" opacity="0.15" />
      <path d="M69 82 Q62 118 63 148"
        stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.12" />
      <ellipse cx="78" cy="186" rx="16" ry="11" fill="currentColor" opacity="0.15" />
      <path d="M78 196 Q78 230 79 262"
        stroke="currentColor" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.15" />
      <path d="M79 262 Q80 292 81 318"
        stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none" opacity="0.14" />
      <path d="M76 318 Q81 328 100 326 Q106 325 106 322 Q92 320 81 318"
        fill="currentColor" opacity="0.15" />
      <line x1="80" y1="10" x2="80" y2="330"
        stroke="currentColor" strokeWidth="1" strokeDasharray="5,4" opacity="0.18" />
    </svg>
  );
}

const STEPS = [
  {
    icon: RotateCcw,
    text: "Stand sideways to the camera (left OR right)",
  },
  {
    icon: Ruler,
    text: "Upper body scan: stand about 5–6 feet away",
  },
  {
    icon: User,
    text: "Full body scan: stand 8–12 feet away",
  },
  {
    icon: HardHat,
    text: "Make sure ear, shoulder, and hip are visible",
  },
];

export default function LandmarkGuide({ onCamera }) {
  return (
    <div className="flex flex-col min-h-screen bg-background px-5 pt-10 pb-8 max-w-md mx-auto">

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">
          AI Posture Scan
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Posture Scan
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Takes about 5 seconds
        </p>
      </motion.div>

      {/* lightweight reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 flex items-start gap-3 bg-secondary border border-border rounded-2xl px-4 py-3"
      >
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your photo is used only for posture analysis. This is not medical advice.
          You can delete scans anytime from your account.
        </p>
      </motion.div>

      {/* Silhouette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.07 }}
        className="flex items-center justify-center flex-1 min-h-0 py-4"
      >
        <div
          className="text-foreground"
          style={{ height: "min(42vh, 300px)", maxWidth: 140 }}
        >
          <SideSilhouette />
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="mb-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          How it works
        </p>

        <div className="space-y-2.5">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex items-center gap-3 bg-secondary/70 rounded-2xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground/85 font-medium leading-snug">
                {text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Auto-timer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          className="flex items-start gap-3 mt-3 bg-primary/8 border border-primary/15 rounded-2xl px-4 py-3"
        >
          <Timer className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-foreground/90 leading-snug">
            Once you're in position, a 5-second timer will start automatically
          </p>
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
      >
        <Button
          onClick={onCamera}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Start Scan
        </Button>
      </motion.div>

    </div>
  );
}