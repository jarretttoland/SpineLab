import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  calculateStructuralBaseline,
  calculateBreakdown,
  classifyArchetype,
  generatePlanFocus,
  calculateFinalSpineScore,
  getInitialConsistencyScore,
} from "@/lib/spineScore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, FileText, Camera } from "lucide-react";

const PAIN_AREA_OPTIONS = [
  { value: "neck", label: "Neck" },
  { value: "mid_back", label: "Mid back" },
  { value: "low_back", label: "Low back" },
  { value: "radiating", label: "Pain radiating into arm or leg" },
];

const GOAL_OPTIONS = [
  { value: "pain_relief", label: "Pain relief" },
  { value: "better_posture", label: "Better posture" },
  { value: "performance", label: "Better performance and strength" },
];

const FOLLOW_UP_QUESTIONS = [
  {
    key: "movementResponse",
    question: "How does your pain usually respond to movement?",
    options: [
      { value: "worse", label: "It gets worse when I move" },
      { value: "better", label: "It gets better when I move" },
      {
        value: "stiff_then_better",
        label: "I feel stiff at first, then better after moving",
      },
    ],
  },
  {
    key: "sittingHours",
    question: "How many hours a day do you usually sit?",
    options: [
      { value: "under3", label: "Less than 3 hours" },
      { value: "3to6", label: "3–6 hours" },
      { value: "6plus", label: "6+ hours" },
    ],
  },
  {
    key: "activityLevel",
    question: "How active are you right now?",
    options: [
      { value: "sedentary", label: "Mostly sedentary" },
      { value: "moderate", label: "Moderately active" },
      { value: "very_active", label: "Very active" },
    ],
  },
  {
    key: "spineSurgery",
    question: "Have you ever had spine surgery?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "ageRange",
    question: "What is your age range?",
    options: [
      { value: "under25", label: "Under 25" },
      { value: "25to40", label: "25–40" },
      { value: "40to55", label: "40–55" },
      { value: "55plus", label: "55+" },
    ],
  },
];

function determinePlanType(primaryPain, painAreas = []) {
  if (!primaryPain && painAreas?.length > 1) return "balanced";
  if (painAreas?.length > 1) return "balanced";
  if (primaryPain === "neck") return "neck";
  if (primaryPain === "mid_back") return "mid_back";
  if (primaryPain === "low_back") return "low_back";
  return "balanced";
}

function determineRoutineLevel({
  movementResponse,
  activityLevel,
  spineSurgery,
  ageRange,
  primaryGoal,
}) {
  const hadSurgery = spineSurgery === "yes";
  const painWorse = movementResponse === "worse";
  const sedentary = activityLevel === "sedentary";
  const older = ageRange === "55plus";

  const performanceMode =
    activityLevel === "very_active" &&
    primaryGoal === "performance" &&
    !hadSurgery &&
    movementResponse !== "worse";

  if (hadSurgery || painWorse || sedentary || older) return "easy";
  if (performanceMode) return "hard";
  return "moderate";
}

function ProgressBar({ step, total }) {
  return (
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
  );
}

function SingleQuestionStep({
  step,
  total,
  question,
  subtitle,
  options,
  selected,
  onSelect,
  onNext,
  onBack,
}) {
  const canProceed = selected !== null && selected !== undefined;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8">
      <ProgressBar step={step} total={total} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${question}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
            Question {step + 1} of {total}
          </p>

          <h1 className="text-2xl font-bold tracking-tight leading-snug mb-2">
            {question}
          </h1>

          {subtitle ? (
            <p className="text-sm text-muted-foreground mb-7">{subtitle}</p>
          ) : null}

          <div className="space-y-3 mt-6">
            {options.map((opt) => {
              const isSelected = selected === opt.value;

              return (
                <motion.button
                  key={String(opt.value)}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-secondary/60"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <span className="text-sm font-medium text-foreground/80">
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

function MultiSelectStep({
  step,
  total,
  question,
  subtitle,
  options,
  selected,
  onToggle,
  onNext,
  onBack,
  singleSelect = false,
}) {
  const canProceed = singleSelect ? selected.length === 1 : selected.length > 0;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8">
      <ProgressBar step={step} total={total} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${question}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
            Question {step + 1} of {total}
          </p>

          <h1 className="text-2xl font-bold tracking-tight leading-snug mb-2">
            {question}
          </h1>

          {subtitle ? (
            <p className="text-sm text-muted-foreground mb-7">{subtitle}</p>
          ) : null}

          <div className="space-y-3 mt-6">
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
                  <div
                    className={`w-5 h-5 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-sm bg-white" />}
                  </div>

                  <span className="text-sm font-medium text-foreground/80">
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

function IntroStep({ onStart, onPrivacy, onTerms }) {
  return (
    <div className="min-h-screen px-6 pt-14 pb-10 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1 flex flex-col"
      >
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <span className="text-primary font-bold text-xl">S</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
            Build your SpineLab plan
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Answer a few quick questions so SpineLab can create a starting score
            and personalize your plan.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 mb-6">
          <p className="text-sm font-semibold mb-3">What this helps us do</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Personalize your starting plan</p>
            <p>• Estimate your structural baseline</p>
            <p>• Match you to the right plan focus</p>
            <p>• Keep your score and progress synced</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/40 p-5 mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-primary font-semibold mb-3">
            Privacy & legal
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onPrivacy}
              className="w-full flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Privacy Policy</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={onTerms}
              className="w-full flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Terms of Service</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <Button onClick={onStart} className="h-14 rounded-2xl text-base font-semibold">
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}

function ScanOptionStep({ saving, onScanNow, onSkip, onBack }) {
  return (
    <div className="min-h-screen px-6 pt-12 pb-10 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Camera className="w-6 h-6 text-primary" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          Optional posture scan
        </p>

        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
          Want your real posture score?
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Your answers are enough to build your plan, but a quick posture scan gives
          SpineLab a real posture score before showing your final Spine Score.
        </p>

        <div className="rounded-3xl border border-border bg-card p-5 mb-8">
          <p className="text-sm font-semibold mb-3">Recommended</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Takes less than a minute</p>
            <p>• Gives you an actual posture score</p>
            <p>• Makes your starting Spine Score more accurate</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onScanNow}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {saving ? "Saving..." : "Start posture scan"}
          </Button>

          <Button
            variant="outline"
            onClick={onSkip}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            Skip for now
          </Button>

          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="w-full text-sm text-muted-foreground mt-2"
          >
            Back to questions
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getAgeRangeMidpoint(ageRange) {
  if (!ageRange) return 35;
  const key = ageRange.toLowerCase().replace(/\s+/g, "").trim();
  const matchTo   = key.match(/(\d+)to(\d+)/);
  if (matchTo)   return Math.round((parseInt(matchTo[1])   + parseInt(matchTo[2]))   / 2);
  const matchDash = key.match(/(\d+)-(\d+)/);
  if (matchDash) return Math.round((parseInt(matchDash[1]) + parseInt(matchDash[2])) / 2);
  const matchPlus  = key.match(/(\d+)(?:plus|\+)/);
  if (matchPlus)  return parseInt(matchPlus[1]) + 7;
  const matchUnder = key.match(/under(\d+)/);
  if (matchUnder) return parseInt(matchUnder[1]) - 5;
  return 35;
}

function calcSpineAge(spineScore, ageRange) {
  const midAge = getAgeRangeMidpoint(ageRange);
  const raw    = midAge - Math.floor((spineScore - 50) / 5);
  return Math.max(18, Math.min(midAge + 10, raw));
}

function getResultsLevel(score) {
  if (score >= 85) return { title: "Elite",       color: "text-amber-500",   ring: "#f59e0b", bg: "bg-amber-50 border-amber-200"   };
  if (score >= 70) return { title: "Resilient",   color: "text-violet-500",  ring: "#8b5cf6", bg: "bg-violet-50 border-violet-200" };
  if (score >= 55) return { title: "Strong",      color: "text-emerald-500", ring: "#10b981", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 40) return { title: "Stabilizing", color: "text-sky-500",     ring: "#0ea5e9", bg: "bg-sky-50 border-sky-200"       };
  return                   { title: "Rebuilding",  color: "text-rose-500",    ring: "#f43f5e", bg: "bg-rose-50 border-rose-200"     };
}

function ResultsStep({ results, saving, onBack, onConfirm, isEditMode, usedScan, ageRange }) {
  const level    = getResultsLevel(results.score);
  const spineAge = calcSpineAge(results.score, ageRange);

  const planFocusIcons = ["🧘", "💪", "🔄", "🎯", "⚡"];

  return (
    <div className="min-h-screen px-5 pt-10 pb-10 flex flex-col bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1 flex flex-col"
      >
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4"
          >
            ✦ {isEditMode ? "Updated results" : "Your personalized plan is ready"}
          </motion.div>

          <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">
            {isEditMode ? "Plan updated" : "Welcome to SpineLab"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Based on your answers, here's where you're starting.
          </p>
        </div>

        {/* ── Score + Spine Age hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-3xl p-6 mb-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            {/* Spine Score circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${level.ring}18`, border: `3px solid ${level.ring}` }}
              >
                <span className="text-2xl font-black" style={{ color: level.ring }}>
                  {results.score}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Spine Score</p>
              <div className={`mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${level.bg} ${level.color}`}>
                {level.title}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-border" />

            {/* Spine Age */}
            <div className="flex flex-col items-center flex-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Spine Age
              </p>
              <p className={`text-5xl font-black leading-none ${level.color}`}>{spineAge}</p>
              <p className="text-[11px] text-muted-foreground mt-2 leading-snug max-w-[110px]">
                {spineAge <= 30 ? "Excellent spine health." : spineAge <= 40 ? "Solid foundation to build on." : "Your plan will help lower this."}
              </p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Starting level
              </p>
              <p className="text-[11px] text-muted-foreground">
                {results.score} / 100
              </p>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: level.ring }}
                initial={{ width: 0 }}
                animate={{ width: `${results.score}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Posture scan nudge (only if skipped) ── */}
        {!usedScan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 mb-4 flex items-start gap-3"
          >
            <span className="text-lg leading-none mt-0.5">📷</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Get a more accurate score
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Take a posture scan from the Scan tab to unlock your real structural score and sharpen your Spine Age.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Plan focus ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-card border border-border rounded-3xl p-5 mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Your plan focus
          </p>
          <p className="text-sm font-bold mb-4">
            {results.archetypeLabel}
          </p>
          <div className="space-y-2.5">
            {(results.planFocus || []).map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 + i * 0.06 }}
                className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3"
              >
                <span className="text-base leading-none">{planFocusIcons[i] || "•"}</span>
                <span className="text-sm font-medium text-foreground/85">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── What's next teaser ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 mb-8"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What's waiting for you
          </p>
          <div className="space-y-2">
            {[
              "Daily 5-exercise routines tailored to your plan",
              "Spine Score that grows every session",
              "Streak tracking and level progression",
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-sm text-foreground/75">{line}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── CTA ── */}
      <div className="max-w-lg mx-auto w-full flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={saving}
          className="h-14 w-14 rounded-2xl shrink-0"
          size="icon"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 h-14 rounded-2xl text-base font-bold"
        >
          {saving ? "Saving..." : isEditMode ? "Save Updated Plan" : "Start my plan →"}
        </Button>
      </div>
    </div>
  );
}
  const breakdownItems = [
    { label: "Mobility", value: results.breakdown.mobility },
    { label: "Strength", value: results.breakdown.strength },
    { label: "Posture", value: results.breakdown.posture, estimated: !usedScan },
  ];

  return (
    <div className="min-h-screen px-6 pt-12 pb-10 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          {isEditMode ? "Your updated results" : "Your starting results"}
        </p>

        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
          Your Spine Score is {results.score}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {usedScan
            ? "This score uses your answers plus your posture scan."
            : "This score is based on your answers. You can scan your posture later from the Scan tab."}
        </p>

        <div className="rounded-3xl border border-border bg-card p-6 mb-5">
          <p className="text-sm font-semibold mb-2">Score</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight">{results.score}</span>
            <span className="text-muted-foreground mb-1">/100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Structural baseline: {results.structuralScore} · Consistency start:{" "}
            {results.consistencyScore}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 mb-5">
          <p className="text-sm font-semibold mb-4">Score breakdown</p>
          <div className="space-y-4">
            {breakdownItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/80">{item.label}</span>
                    {item.estimated && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        estimated
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>

                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>

                {item.label === "Posture" && item.estimated && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Estimated. A posture scan will provide your actual posture score.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 mb-8">
          <p className="text-sm font-semibold mb-2">Plan focus</p>
          <p className="text-sm text-muted-foreground mb-4">
            {results.archetypeLabel}
          </p>
          <div className="space-y-2">
            {results.planFocus.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-foreground/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto w-full flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={saving}
          className="h-14 w-14 rounded-2xl shrink-0"
          size="icon"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Button
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 h-14 rounded-2xl text-base font-semibold"
        >
          {saving ? "Saving..." : isEditMode ? "Save Updated Plan" : "See My Plan"}
        </Button>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const isEditMode =
    location.state?.isEditMode === true || params.get("edit") === "true";

  const fromScan =
    params.get("fromScan") === "true" ||
    location.state?.fromScan === true;

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [phase, setPhase] = useState(isEditMode ? "pain_multi" : "intro");
  const [followUpIndex, setFollowUpIndex] = useState(0);

  const [painAreas, setPainAreas] = useState([]);
  const [primaryPain, setPrimaryPain] = useState(null);
  const [goals, setGoals] = useState([]);
  const [primaryGoal, setPrimaryGoal] = useState(null);

  const [followUpAnswers, setFollowUpAnswers] = useState({
    movementResponse: null,
    sittingHours: null,
    activityLevel: null,
    spineSurgery: null,
    ageRange: null,
  });

  const [results, setResults] = useState(null);
  const [usedScan, setUsedScan] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildAnswersFromProfile = (profileData) => {
    const resolvedPainAreas = Array.isArray(profileData?.pain_areas)
      ? profileData.pain_areas
      : [];

    const resolvedPrimaryPain =
      profileData?.primary_pain || resolvedPainAreas[0] || null;

    const resolvedPrimaryGoal =
      profileData?.primary_goal || profileData?.goal || null;

    return {
      primaryPain: resolvedPrimaryPain,
      secondaryPain: Array.isArray(profileData?.secondary_pain)
        ? profileData.secondary_pain
        : resolvedPainAreas.filter((a) => a !== resolvedPrimaryPain),
      painAreas: resolvedPainAreas,
      primaryGoal: resolvedPrimaryGoal,
      secondaryGoals: Array.isArray(profileData?.secondary_goals)
        ? profileData.secondary_goals
        : [],
      problemArea: resolvedPrimaryPain,
      goal: resolvedPrimaryGoal,
      movementResponse: profileData?.movement_response || null,
      sittingHours:
        profileData?.sitting_hours >= 6
          ? "6plus"
          : profileData?.sitting_hours >= 3
          ? "3to6"
          : "under3",
      activityLevel: profileData?.activity_level || null,
      spineSurgery: profileData?.spine_surgery ? "yes" : "no",
      ageRange: profileData?.age_range || null,
    };
  };

  const generateResultsFromProfile = (profileData) => {
    const answers = buildAnswersFromProfile(profileData);
    const postureFindings = [];
    const fallbackBreakdown = calculateBreakdown(answers, postureFindings);

    const structuralScore =
      typeof profileData?.structural_score === "number"
        ? profileData.structural_score
        : calculateStructuralBaseline(answers, postureFindings);

    const consistencyScore =
      typeof profileData?.consistency_score === "number"
        ? profileData.consistency_score
        : getInitialConsistencyScore();

    const score =
      typeof profileData?.spine_score === "number"
        ? profileData.spine_score
        : calculateFinalSpineScore(structuralScore, consistencyScore);

    const postureScore =
      typeof profileData?.posture_score === "number"
        ? profileData.posture_score
        : fallbackBreakdown.posture;

    const archetypeKey = profileData?.archetype || classifyArchetype(answers);
    const planFocus = generatePlanFocus(archetypeKey, answers, postureFindings);

    return {
      structuralScore,
      consistencyScore,
      score,
      breakdown: {
        ...fallbackBreakdown,
        posture: postureScore,
      },
      archetypeKey,
      archetypeLabel: archetypeKey
        ? archetypeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Your plan",
      planFocus,
    };
  };

  useEffect(() => {
    let mounted = true;

    async function loadUserAndProfile() {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!mounted) return;

        setUser(currentUser ?? null);

        if (!currentUser?.id) {
          navigate("/", { replace: true });
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!mounted) return;

        setProfile(profileData ?? null);

        if (fromScan && profileData) {
          const generatedResults = generateResultsFromProfile(profileData);

          setResults(generatedResults);
          setUsedScan(true);
          setPhase("results");
          setLoadingProfile(false);
          return;
        }

        if (isEditMode && profileData) {
          const existingPainAreas = Array.isArray(profileData.pain_areas)
            ? profileData.pain_areas
            : [];

          const existingPrimaryPain =
            profileData.primary_pain || existingPainAreas[0] || null;

          const existingPrimaryGoal =
            profileData.primary_goal || profileData.goal || null;

          const existingSecondaryGoals = Array.isArray(profileData.secondary_goals)
            ? profileData.secondary_goals
            : [];

          const mergedGoals = existingPrimaryGoal
            ? Array.from(new Set([existingPrimaryGoal, ...existingSecondaryGoals]))
            : existingSecondaryGoals;

          setPainAreas(existingPainAreas);
          setPrimaryPain(existingPrimaryPain);
          setGoals(mergedGoals);
          setPrimaryGoal(existingPrimaryGoal);
          setFollowUpAnswers({
            movementResponse: profileData.movement_response || null,
            sittingHours:
              profileData.sitting_hours >= 6
                ? "6plus"
                : profileData.sitting_hours >= 3
                ? "3to6"
                : profileData.sitting_hours != null
                ? "under3"
                : null,
            activityLevel: profileData.activity_level || null,
            spineSurgery:
              typeof profileData.spine_surgery === "boolean"
                ? profileData.spine_surgery
                  ? "yes"
                  : "no"
                : null,
            ageRange: profileData.age_range || null,
          });

          setPhase("pain_multi");
          setLoadingProfile(false);
          return;
        }

        setLoadingProfile(false);
      } catch (err) {
        console.error("[Onboarding] load error:", err);
        if (!mounted) return;
        setLoadingProfile(false);
      }
    }

    loadUserAndProfile();

    return () => {
      mounted = false;
    };
  }, [navigate, isEditMode, fromScan]);

  const hasPainTiebreak = painAreas.length > 1;
  const hasGoalTiebreak = goals.length > 1;

  const totalSteps = useMemo(() => {
    return (
      2 +
      (hasPainTiebreak ? 1 : 0) +
      (hasGoalTiebreak ? 1 : 0) +
      FOLLOW_UP_QUESTIONS.length
    );
  }, [hasPainTiebreak, hasGoalTiebreak]);

  const getStepIndex = () => {
    if (phase === "pain_multi") return 0;
    if (phase === "pain_tiebreak") return 1;
    if (phase === "goal_multi") return hasPainTiebreak ? 2 : 1;
    if (phase === "goal_tiebreak") return hasPainTiebreak ? 3 : 2;

    if (phase === "follow_up") {
      const base = (hasPainTiebreak ? 3 : 2) + (hasGoalTiebreak ? 1 : 0);
      return base + followUpIndex;
    }

    return 0;
  };

  const stepIndex = getStepIndex();
  const currentFollowUp = FOLLOW_UP_QUESTIONS[followUpIndex];

  const togglePainArea = (value) => {
    setPainAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleGoal = (value) => {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handlePainMultiNext = () => {
    if (!painAreas.length) return;

    if (painAreas.length > 1) {
      if (!primaryPain || !painAreas.includes(primaryPain)) {
        setPrimaryPain(null);
      }
      setPhase("pain_tiebreak");
      return;
    }

    setPrimaryPain(painAreas[0]);
    setPhase("goal_multi");
  };

  const handlePainTiebreakNext = () => {
    if (!primaryPain) return;
    setPhase("goal_multi");
  };

  const handleGoalMultiNext = () => {
    if (!goals.length) return;

    if (goals.length > 1) {
      if (!primaryGoal || !goals.includes(primaryGoal)) {
        setPrimaryGoal(null);
      }
      setPhase("goal_tiebreak");
      return;
    }

    setPrimaryGoal(goals[0]);
    setPhase("follow_up");
    setFollowUpIndex(0);
  };

  const handleGoalTiebreakNext = () => {
    if (!primaryGoal) return;
    setPhase("follow_up");
    setFollowUpIndex(0);
  };

  const handleFollowUpSelect = (value) => {
    setFollowUpAnswers((prev) => ({
      ...prev,
      [currentFollowUp.key]: value,
    }));
  };

  const buildAnswers = () => {
    const resolvedPrimaryPain = primaryPain || painAreas[0] || null;
    const resolvedPrimaryGoal = primaryGoal || goals[0] || null;

    return {
      primaryPain: resolvedPrimaryPain,
      secondaryPain: painAreas.filter((a) => a !== resolvedPrimaryPain),
      painAreas,
      primaryGoal: resolvedPrimaryGoal,
      secondaryGoals: goals.filter((g) => g !== resolvedPrimaryGoal),
      problemArea: resolvedPrimaryPain,
      goal: resolvedPrimaryGoal,
      ...followUpAnswers,
    };
  };

  const generateResults = () => {
    const answers = buildAnswers();
    const postureFindings = [];

    const structuralScore = calculateStructuralBaseline(answers, postureFindings);
    const consistencyScore = getInitialConsistencyScore();
    const finalScore = calculateFinalSpineScore(structuralScore, consistencyScore);
    const breakdown = calculateBreakdown(answers, postureFindings);
    const archetypeKey = classifyArchetype(answers);
    const planFocus = generatePlanFocus(archetypeKey, answers, postureFindings);

    return {
      structuralScore,
      consistencyScore,
      score: finalScore,
      breakdown,
      archetypeKey,
      archetypeLabel: archetypeKey
        ? archetypeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Your plan",
      planFocus,
    };
  };

  const buildProfilePayload = ({ complete = false, resultOverride = null } = {}) => {
    const answers = buildAnswers();
    const currentResults = resultOverride || results || generateResults();

    const planType = determinePlanType(answers.primaryPain, painAreas);

    const routineLevel = determineRoutineLevel({
      movementResponse: followUpAnswers.movementResponse,
      activityLevel: followUpAnswers.activityLevel,
      spineSurgery: followUpAnswers.spineSurgery,
      ageRange: followUpAnswers.ageRange,
      primaryGoal: answers.primaryGoal,
    });

    return {
      id: user.id,
      pain_areas: painAreas,
      plan_type: planType,
      routine_level: routineLevel,

      sitting_hours:
        followUpAnswers.sittingHours === "6plus"
          ? 8
          : followUpAnswers.sittingHours === "3to6"
          ? 5
          : 2,

      works_out: followUpAnswers.activityLevel === "very_active",

      structural_score: currentResults.structuralScore,
      consistency_score: currentResults.consistencyScore,
      spine_score: currentResults.score,

      onboarding_complete: complete,

      current_streak: isEditMode ? (profile?.current_streak ?? 0) : 0,
      longest_streak: isEditMode ? (profile?.longest_streak ?? 0) : 0,

      scan_results: profile?.scan_results ?? [],
      scan_image_url: profile?.scan_image_url ?? "",

      movement_response: followUpAnswers.movementResponse,
      activity_level: followUpAnswers.activityLevel,
      age_range: followUpAnswers.ageRange,
      spine_surgery: followUpAnswers.spineSurgery === "yes",

      goal: answers.primaryGoal,
      archetype: currentResults.archetypeKey,

      primary_pain: answers.primaryPain,
      secondary_pain: answers.secondaryPain,
      primary_goal: answers.primaryGoal,
      secondary_goals: answers.secondaryGoals,

      updated_at: new Date().toISOString(),
    };
  };

  const saveProfile = async ({ complete = false, resultOverride = null } = {}) => {
    if (!user?.id) return null;

    const payload = buildProfilePayload({ complete, resultOverride });

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    setProfile(data);
    return data;
  };

  const handleFollowUpNext = () => {
    const currentAnswer = followUpAnswers[currentFollowUp.key];
    if (!currentAnswer) return;

    if (followUpIndex < FOLLOW_UP_QUESTIONS.length - 1) {
      setFollowUpIndex((i) => i + 1);
      return;
    }

    setPhase("scan_option");
  };

  const handleFollowUpBack = () => {
    if (followUpIndex === 0) {
      if (hasGoalTiebreak) setPhase("goal_tiebreak");
      else setPhase("goal_multi");
      return;
    }

    setFollowUpIndex((i) => i - 1);
  };

  const handleStartScan = async () => {
    if (!user?.id || saving) return;

    setSaving(true);

    try {
      const estimatedResults = generateResults();
      setResults(estimatedResults);
      await saveProfile({ complete: false, resultOverride: estimatedResults });

      navigate("/onboarding-scan?from=onboarding", {
        replace: true,
        state: { fromOnboarding: true },
      });
    } catch (err) {
      console.error("[Onboarding] save before scan error:", err);
      alert("We couldn't save your plan before the scan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipScan = async () => {
    if (!user?.id || saving) return;

    setSaving(true);

    try {
      const estimatedResults = generateResults();
      setResults(estimatedResults);
      setUsedScan(false);
      await saveProfile({ complete: false, resultOverride: estimatedResults });
      setPhase("results");
    } catch (err) {
      console.error("[Onboarding] skip scan save error:", err);
      alert("We couldn't save your plan yet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndGoHome = async () => {
  if (!user?.id || !results || saving) return;

  setSaving(true);

  try {
    const answers = buildAnswers();

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_complete: true,
        age_range:           followUpAnswers.ageRange,
        movement_response:   followUpAnswers.movementResponse,
        activity_level:      followUpAnswers.activityLevel,
        spine_surgery:       followUpAnswers.spineSurgery === "yes",
        primary_pain:        answers.primaryPain,
        primary_goal:        answers.primaryGoal,
        pain_areas:          painAreas,
        updated_at:          new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    navigate("/dashboard", { replace: true });
  } catch (err) {
    console.error("[Onboarding] final save error:", err);
    alert("We couldn't save your plan yet. Please try again.");
  } finally {
    setSaving(false);
  }
};

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <IntroStep
        onStart={() => setPhase("pain_multi")}
        onPrivacy={() => navigate("/privacy-policy")}
        onTerms={() => navigate("/terms-of-service")}
      />
    );
  }

  if (phase === "pain_multi") {
    return (
      <MultiSelectStep
        step={0}
        total={totalSteps}
        question="Where do you experience pain or discomfort?"
        selected={painAreas}
        onToggle={togglePainArea}
        onNext={handlePainMultiNext}
        onBack={() => {
          if (isEditMode) navigate("/account", { replace: true });
          else setPhase("intro");
        }}
        options={PAIN_AREA_OPTIONS}
      />
    );
  }

  if (phase === "pain_tiebreak") {
    return (
      <MultiSelectStep
        step={1}
        total={totalSteps}
        question="Which area bothers you the most?"
        subtitle="Select the one that's your biggest concern right now."
        selected={primaryPain ? [primaryPain] : []}
        onToggle={setPrimaryPain}
        onNext={handlePainTiebreakNext}
        onBack={() => setPhase("pain_multi")}
        options={PAIN_AREA_OPTIONS.filter((o) => painAreas.includes(o.value))}
        singleSelect
      />
    );
  }

  if (phase === "goal_multi") {
    const step = hasPainTiebreak ? 2 : 1;

    return (
      <MultiSelectStep
        step={step}
        total={totalSteps}
        question="What are your goals with SpineLab?"
        selected={goals}
        onToggle={toggleGoal}
        onNext={handleGoalMultiNext}
        onBack={() => {
          if (hasPainTiebreak) setPhase("pain_tiebreak");
          else setPhase("pain_multi");
        }}
        options={GOAL_OPTIONS}
      />
    );
  }

  if (phase === "goal_tiebreak") {
    const step = hasPainTiebreak ? 3 : 2;

    return (
      <MultiSelectStep
        step={step}
        total={totalSteps}
        question="What is your top priority right now?"
        subtitle="This drives the main focus of your plan."
        selected={primaryGoal ? [primaryGoal] : []}
        onToggle={setPrimaryGoal}
        onNext={handleGoalTiebreakNext}
        onBack={() => setPhase("goal_multi")}
        options={GOAL_OPTIONS.filter((o) => goals.includes(o.value))}
        singleSelect
      />
    );
  }

  if (phase === "follow_up") {
    return (
      <SingleQuestionStep
        step={stepIndex}
        total={totalSteps}
        question={currentFollowUp.question}
        options={currentFollowUp.options}
        selected={followUpAnswers[currentFollowUp.key]}
        onSelect={handleFollowUpSelect}
        onNext={handleFollowUpNext}
        onBack={handleFollowUpBack}
      />
    );
  }

  if (phase === "scan_option") {
    return (
      <ScanOptionStep
        saving={saving}
        onScanNow={handleStartScan}
        onSkip={handleSkipScan}
        onBack={() => {
          setPhase("follow_up");
          setFollowUpIndex(FOLLOW_UP_QUESTIONS.length - 1);
        }}
      />
    );
  }

  if (phase === "results" && results) {
  return (
    <ResultsStep
      results={results}
      saving={saving}
      usedScan={usedScan}
      ageRange={followUpAnswers.ageRange}
      onBack={() => {
        if (fromScan) {
          navigate("/onboarding-scan?from=onboarding", {
            replace: true,
            state: { fromOnboarding: true },
          });
        } else {
          setPhase("scan_option");
        }
      }}
      onConfirm={handleSaveAndGoHome}
      isEditMode={isEditMode}
    />
  );
}

  return null;
}