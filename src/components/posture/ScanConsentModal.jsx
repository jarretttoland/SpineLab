import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Check, X, Cpu, Cloud } from "lucide-react";

export default function ScanConsentModal({
  onAccept,
  onDecline,
  privacyPolicyUrl = "/privacy-policy",
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-background overflow-hidden"
      style={{ paddingTop: "max(24px, calc(env(safe-area-inset-top) + 24px))" }}
    >
      {/* ── Scrollable info ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto w-full"
        >
          {/* Header */}
          <div className="mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              Before you scan
            </p>
            <h1 className="text-2xl font-bold tracking-tight leading-tight mb-2">
              How posture scanning works
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We want you to know exactly what happens with your photo before you take it.
            </p>
          </div>

          {/* What we do */}
          <div className="rounded-3xl border border-border bg-card p-4 mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
              What happens
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI runs on your device</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    We use Google's MediaPipe model to detect body landmarks. The model runs
                    on your phone — your photo is never sent to Google or any third party.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your photo is stored in your account</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    We save your scan to our secure backend so you can review it in your
                    history. Only you can access it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What we never do */}
          <div className="rounded-3xl border border-border bg-secondary/40 p-4 mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
              What we never do
            </p>
            <div className="space-y-2.5">
              {[
                "Sell your photos or data",
                "Share with advertisers",
                "Use your photos to train AI",
                "Keep your data after you delete your account",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <X className="w-2.5 h-2.5 text-rose-600" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-foreground/80">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your control */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
            <p className="text-xs text-foreground/80 leading-relaxed">
              You can delete any scan, revoke AI consent, or delete your account anytime
              from <span className="font-semibold">Account → Privacy Controls</span>.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Pinned CTAs — always visible ── */}
      <div
        className="px-6 pt-3 shrink-0 border-t border-border/40 bg-background space-y-2.5"
        style={{ paddingBottom: "max(24px, calc(env(safe-area-inset-bottom) + 24px))" }}
      >
        <Button
          onClick={onAccept}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          I agree — continue to scan
        </Button>
        <Button
          variant="outline"
          onClick={onDecline}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Back
        </Button>
        <a
          href={privacyPolicyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm text-muted-foreground py-1"
        >
          Read the full Privacy Policy
        </a>
      </div>
    </div>
  );
}
