// FILE: src/components/posture/ScanConsentModal.jsx
// NEW FILE. Save to: src/components/posture/ScanConsentModal.jsx
//
// This is the consent screen Apple's 5.1.1/5.1.2 rejection requires.
// It must be shown BEFORE the first posture scan, explicitly telling
// the user what data is collected, who it's shared with, and asking
// for permission.
//
// Wire it up in PostureScan.jsx (see the updated PostureScan.jsx file)
// so it shows when profile.ai_consent_at is null.

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
    <div className="min-h-screen px-6 pt-10 pb-8 flex flex-col bg-background">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="mb-7">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
              Before you scan
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
              How posture scanning works
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We want you to know exactly what happens with your photo before
              you take it.
            </p>
          </div>

          {/* What we do */}
          <div className="rounded-3xl border border-border bg-card p-5 mb-4">
            <p className="text-sm font-semibold mb-4">What happens</p>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    AI runs on your device
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    We use Google's MediaPipe model to detect body landmarks.
                    The model runs on your phone. Your photo is not sent to
                    Google or any other third party for AI processing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Your photo is stored in your account
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    We save your scan to our secure backend (Supabase) so you
                    can review it in your scan history. Only you can access it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What we don't do */}
          <div className="rounded-3xl border border-border bg-secondary/40 p-5 mb-4">
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
                <div key={line} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5 text-rose-600" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-foreground/80">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your control */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 mb-8 flex items-start gap-3">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
            <p className="text-xs text-foreground/80 leading-relaxed">
              You can delete any scan, revoke AI consent, or delete your whole
              account anytime from{" "}
              <span className="font-semibold">Account → Privacy</span>.
            </p>
          </div>
        </motion.div>

        {/* CTAs */}
        <div className="space-y-3">
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
            Not now
          </Button>
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm text-muted-foreground py-2"
          >
            Read the full Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
