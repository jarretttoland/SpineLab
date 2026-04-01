import React from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "Full exercise library — all movements unlocked",
  "AI Posture Scan with landmark detection",
  "Personalized daily routines",
  "Spine Score tracking & history",
  "Smart plan adjustment",
  "Priority support",
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="px-6 pt-14 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="bg-primary/10 rounded-2xl p-3 w-fit mx-auto mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">SpineLab Pro</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Pro subscriptions are coming soon. For now, you have full access to everything — no limits.
        </p>
      </motion.div>

      {/* Beta access banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary/5 border border-primary/20 rounded-3xl p-5 mb-6 flex items-start gap-3"
      >
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-0.5">Full access currently unlocked</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You're in the SpineLab beta. Every feature is available to you right now, free of charge. Pro subscriptions will launch soon.
          </p>
        </div>
      </motion.div>

      {/* Feature list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-3xl p-6 mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What's included</p>
        <div className="space-y-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={() => navigate("/")}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Back to Dashboard
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Pricing details will be announced when Pro launches.
        </p>
      </motion.div>
    </div>
  );
}