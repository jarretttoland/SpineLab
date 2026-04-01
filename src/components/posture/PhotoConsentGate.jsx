import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Eye, ShieldCheck, Info } from "lucide-react";
import { Link } from "react-router-dom";

const PRIVACY_POINTS = [
  {
    icon: ShieldCheck,
    title: "Wellness use only",
    body: "Your photo is analyzed for posture insights — not medical diagnosis or treatment.",
  },
  {
    icon: Lock,
    title: "Stored securely",
    body: "Images are encrypted at rest and never sold or shared with third parties.",
  },
  {
    icon: Eye,
    title: "You stay in control",
    body: "You can delete your data at any time from Account settings.",
  },
];

export default function PhotoConsentGate({ onConsentGiven }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">AI Posture Scan</p>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Before we scan</h1>
        <p className="text-sm text-muted-foreground mb-7">
          SpineLab takes your privacy seriously. Here's exactly how your photo is used.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex-1 flex flex-col gap-4"
      >
        {/* Privacy points */}
        <div className="space-y-3">
          {PRIVACY_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4 bg-secondary/60 border border-border/50 rounded-2xl px-4 py-3.5">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Medical notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            This tool provides <strong>general posture insights</strong> and is not a substitute for professional medical evaluation. If you have pain or an injury, consult a healthcare provider first.
          </p>
        </div>

        {/* Agreement checkbox */}
        <button
          onClick={() => setChecked((v) => !v)}
          className={`flex items-start gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all ${
            checked ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
            checked ? "border-primary bg-primary" : "border-muted-foreground/40"
          }`}>
            {checked && (
              <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-foreground/90 leading-relaxed">
            I understand that this scan is for wellness purposes only and agree to the{" "}
            <Link to="/privacy" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 font-medium">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 font-medium">
              Terms of Service
            </Link>.
          </span>
        </button>

        {/* Actions */}
        <div className="mt-auto pt-2">
          <Button
            onClick={() => onConsentGiven()}
            disabled={!checked}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}