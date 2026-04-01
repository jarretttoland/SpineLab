import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Simulated posture analysis
const POSTURE_POOL = [
  "forward_head",
  "rounded_shoulders",
  "anterior_pelvic_tilt",
];

function analyzePosture(imageUrl) {
  // Simulate AI — pick 1-2 findings
  const count = Math.random() < 0.4 ? 1 : 2;
  const shuffled = [...POSTURE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const FINDING_LABELS = {
  forward_head: "Forward head posture detected",
  rounded_shoulders: "Rounded shoulders detected",
  anterior_pelvic_tilt: "Anterior pelvic tilt detected",
};

// ── Instructions sub-screen ──────────────────────────────────────────────────
function Instructions({ onContinue, onSkip }) {
  const tips = [
    "Stand naturally from the side",
    "Show full head, shoulders, hips, and upper legs",
    "Wear fitted clothing if possible",
    "Keep camera level, a few feet away",
    "Use good lighting",
    "Prop your phone or have someone take the photo",
  ];

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">Posture Analysis</p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">How to take your posture photo</h1>
        <p className="text-sm text-muted-foreground mb-8">Follow these tips for the most accurate results.</p>

        <div className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 bg-secondary rounded-2xl px-4 py-3.5"
            >
              <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <span className="text-sm text-foreground">{tip}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3 mt-8">
        <Button onClick={onContinue} className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
          Continue to Camera
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button onClick={onSkip} variant="ghost" className="w-full h-12 rounded-2xl text-sm text-muted-foreground">
          Skip for Now
        </Button>
      </div>
    </div>
  );
}

// ── Upload / Camera sub-screen ───────────────────────────────────────────────
function UploadScreen({ onPhotoAnalyzed, onSkip }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [findings, setFindings] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const detected = analyzePosture(file_url);
    setFindings(detected);
    setUploading(false);

    // Short delay so user sees the preview before auto-advancing
    setTimeout(() => onPhotoAnalyzed(file_url, detected), 1800);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10 items-center justify-center">
      {!preview ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Camera className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Upload your posture photo</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
            Side-view photo works best. We'll analyse it and include findings in your Spine Score.
          </p>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-5 h-5" />
              Take or Upload Photo
            </span>
          </label>
          <button
            onClick={onSkip}
            className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
          >
            Skip this step
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center">
          <div className="relative w-full max-w-xs mx-auto rounded-3xl overflow-hidden mb-6 aspect-[3/4]">
            <img src={preview} alt="Your posture" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Analysing posture…</p>
              </div>
            )}
            {findings && !uploading && (
              <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-3 p-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <p className="text-sm font-semibold text-center">Analysis complete</p>
                {findings.map((f) => (
                  <span key={f} className="text-xs bg-destructive/10 text-destructive rounded-full px-3 py-1">
                    {FINDING_LABELS[f]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Outer component ──────────────────────────────────────────────────────────
export default function PosturePhotoStep({ onComplete, onSkip }) {
  const [subPhase, setSubPhase] = useState("prompt"); // prompt | instructions | upload

  if (subPhase === "prompt") {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-14 pb-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">Final Step</p>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Analyse your posture</h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-10">
            Take a quick side-view photo to identify posture imbalances and unlock a more accurate Spine Score.
          </p>

          <div className="bg-secondary rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">What we check</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Forward head posture</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Rounded shoulders</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Pelvic alignment</li>
            </ul>
          </div>
        </motion.div>

        <div className="space-y-3">
          <Button
            onClick={() => setSubPhase("instructions")}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  if (subPhase === "instructions") {
    return (
      <Instructions
        onContinue={() => setSubPhase("upload")}
        onSkip={onSkip}
      />
    );
  }

  return <UploadScreen onPhotoAnalyzed={onComplete} onSkip={onSkip} />;
}