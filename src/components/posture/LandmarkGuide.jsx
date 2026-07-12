import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Check, ShieldCheck } from "lucide-react";

function MiniSilhouette() {
  return (
    <svg
      viewBox="0 0 160 280"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="86" cy="28" rx="16" ry="19" fill="currentColor" opacity="0.16" />
      <path d="M82 46 Q80 56 79 64" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.16" />
      <path d="M72 64 Q65 100 67 135 Q69 156 80 168"
        stroke="currentColor" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.14" />
      <path d="M69 76 Q62 108 63 135"
        stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.11" />
      <ellipse cx="78" cy="170" rx="14" ry="10" fill="currentColor" opacity="0.14" />
      <path d="M78 178 Q78 208 79 234"
        stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.14" />
      <path d="M79 234 Q80 256 81 262"
        stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.13" />
      <line x1="80" y1="10" x2="80" y2="270"
        stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.22" />
      <circle cx="86" cy="46" r="5" fill="#3b82f6" />
      <circle cx="86" cy="46" r="9" fill="#3b82f6" opacity="0.18" />
      <circle cx="80" cy="90" r="5" fill="#8b5cf6" />
      <circle cx="80" cy="90" r="9" fill="#8b5cf6" opacity="0.18" />
      <circle cx="78" cy="172" r="5" fill="#10b981" />
      <circle cx="78" cy="172" r="9" fill="#10b981" opacity="0.18" />
    </svg>
  );
}

const LANDMARKS = [
  { color: "#3b82f6", label: "Ear", detail: "Head position and forward head posture" },
  { color: "#8b5cf6", label: "Shoulder", detail: "Upper spine and thoracic alignment" },
  { color: "#10b981", label: "Hip",      detail: "Pelvic tilt and lumbar curve" },
];

export default function LandmarkGuide({ onCamera }) {
  return (
    <div
      className="flex flex-col px-6 pt-4 bg-background"
      style={{
        height: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 96px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="mb-5 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">
            AI Posture Scan
          </p>
          <h1 className="text-[28px] font-bold tracking-tight leading-tight mb-2">
            Position yourself
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A quick scan measures your real alignment and gives you a Spine
            Score you can track over time.
          </p>
        </div>

        {/* Hero card */}
        <div className="rounded-3xl border border-border bg-gradient-to-b from-primary/[0.04] to-card p-5 mb-4 shrink-0">
          {/* Silhouette + prep bullets */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="text-foreground shrink-0"
              style={{ height: 160, width: 82 }}
              aria-hidden="true"
            >
              <MiniSilhouette />
            </div>

            <div className="flex-1 space-y-2.5">
              {[
                "Stand sideways, full body visible",
                "5–6 ft from camera, plain background",
                "Camera counts down 5 seconds before photo",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3.5} />
                  </div>
                  <p className="text-[13px] font-medium text-foreground/85 leading-snug">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What we measure */}
          <div className="pt-4 border-t border-border/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
              What we measure
            </p>
            <div className="space-y-2.5">
              {LANDMARKS.map(({ color, label, detail }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18`, border: `2px solid ${color}` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-foreground">{label}</span>
                    <span className="text-[12px] text-muted-foreground"> — {detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-secondary/50 shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your photo is used only for posture analysis and is never shared. Delete anytime from your account.
          </p>
        </div>
      </motion.div>

      {/* CTA pinned above tab bar */}
      <div className="max-w-lg mx-auto w-full pt-4 pb-2 shrink-0">
        <Button
          onClick={onCamera}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
        >
          <Camera className="w-4 h-4" />
          Start Scan
        </Button>
      </div>
    </div>
  );
}
