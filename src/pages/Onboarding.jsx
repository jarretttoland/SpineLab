import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { calculateSpineScore, calculateBreakdown, classifyArchetype, generatePlanFocus } from "@/lib/spineScore";

import IntroScreen from "@/components/onboarding/IntroScreen";
import MultiSelectStep from "@/components/onboarding/MultiSelectStep";
import QuestionStep from "@/components/onboarding/QuestionStep";
import PosturePhotoStep from "@/components/onboarding/PosturePhotoStep";
import SpineScoreResults from "@/components/onboarding/SpineScoreResults";

// ── Option definitions ────────────────────────────────────────────────────────
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
      { value: "stiff_then_better", label: "I feel stiff at first, then better after moving" },
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

/**
 * Flow phases:
 *  intro
 *  → pain_multi       (multi-select pain areas)
 *  → pain_tiebreak    (only if >1 area selected — pick primary)
 *  → goal_multi       (multi-select goals)
 *  → goal_tiebreak    (only if >1 goal selected — pick primary)
 *  → follow_up_0..3   (4 single-select questions)
 *  → posture
 *  → results
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const { data: profiles, isLoading: loadingProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  useEffect(() => {
    if (!loadingProfile && profiles.length > 0 && profiles[0].onboarding_complete) {
      navigate("/", { replace: true });
    }
  }, [loadingProfile, profiles, navigate]);

  const [phase, setPhase] = useState("intro");
  const [followUpIndex, setFollowUpIndex] = useState(0);

  // Multi-select answers
  const [painAreas, setPainAreas] = useState([]);       // all selected pain areas
  const [primaryPain, setPrimaryPain] = useState(null); // tiebreaker result
  const [goals, setGoals] = useState([]);               // all selected goals
  const [primaryGoal, setPrimaryGoal] = useState(null); // tiebreaker result

  // Single-select follow-up answers
  const [followUpAnswers, setFollowUpAnswers] = useState({
    movementResponse: null,
    sittingHours: null,
    activityLevel: null,
    ageRange: null,
  });

  const [postureFindings, setPostureFindings] = useState([]);
  const [postureImageUrl, setPostureImageUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loadingProfile || (!loadingProfile && profiles.length > 0 && profiles[0].onboarding_complete)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Total step count for progress bar ──────────────────────────────────────
  // pain_multi(1) + optional tiebreak(1) + goal_multi(1) + optional tiebreak(1) + 4 follow-ups = 6 or 8 steps
  const hasPainTiebreak = painAreas.length > 1;
  const hasGoalTiebreak = goals.length > 1;
  const TOTAL_STEPS = 2 + (hasPainTiebreak ? 1 : 0) + (hasGoalTiebreak ? 1 : 0) + FOLLOW_UP_QUESTIONS.length;

  // Compute current step index for progress bar
  const getStepIndex = () => {
    if (phase === "pain_multi") return 0;
    if (phase === "pain_tiebreak") return 1;
    if (phase === "goal_multi") return hasPainTiebreak ? 2 : 1;
    if (phase === "goal_tiebreak") return hasPainTiebreak ? 3 : 2;
    if (phase.startsWith("follow_up")) {
      const base = (hasPainTiebreak ? 3 : 2) + (hasGoalTiebreak ? 1 : 0);
      return base + followUpIndex;
    }
    return 0;
  };
  const stepIndex = getStepIndex();

  // ── Pain area handlers ──────────────────────────────────────────────────────
  const togglePainArea = (value) => {
    setPainAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handlePainMultiNext = () => {
    if (painAreas.length > 1) {
      setPhase("pain_tiebreak");
    } else {
      setPrimaryPain(painAreas[0]);
      setPhase("goal_multi");
    }
  };

  const handlePainTiebreakToggle = (value) => setPrimaryPain(value);

  const handlePainTiebreakNext = () => {
    setPhase("goal_multi");
  };

  // ── Goal handlers ───────────────────────────────────────────────────────────
  const toggleGoal = (value) => {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleGoalMultiNext = () => {
    if (goals.length > 1) {
      setPhase("goal_tiebreak");
    } else {
      setPrimaryGoal(goals[0]);
      setPhase("follow_up");
      setFollowUpIndex(0);
    }
  };

  const handleGoalTiebreakToggle = (value) => setPrimaryGoal(value);

  const handleGoalTiebreakNext = () => {
    setPhase("follow_up");
    setFollowUpIndex(0);
  };

  // ── Follow-up handlers ──────────────────────────────────────────────────────
  const currentFollowUp = FOLLOW_UP_QUESTIONS[followUpIndex];

  const handleFollowUpSelect = (value) => {
    setFollowUpAnswers((prev) => ({ ...prev, [currentFollowUp.key]: value }));
  };

  const handleFollowUpNext = () => {
    if (followUpIndex < FOLLOW_UP_QUESTIONS.length - 1) {
      setFollowUpIndex(followUpIndex + 1);
    } else {
      setPhase("posture");
    }
  };

  const handleFollowUpBack = () => {
    if (followUpIndex === 0) {
      if (hasGoalTiebreak) setPhase("goal_tiebreak");
      else setPhase("goal_multi");
    } else {
      setFollowUpIndex(followUpIndex - 1);
    }
  };

  // ── Results generation ──────────────────────────────────────────────────────
  const buildAnswers = () => ({
    primaryPain: primaryPain || painAreas[0],
    secondaryPain: painAreas.filter((a) => a !== (primaryPain || painAreas[0])),
    primaryGoal: primaryGoal || goals[0],
    secondaryGoals: goals.filter((g) => g !== (primaryGoal || goals[0])),
    // legacy field aliases for score engine
    problemArea: primaryPain || painAreas[0],
    goal: primaryGoal || goals[0],
    ...followUpAnswers,
  });

  const generateResults = (findings = []) => {
    const answers = buildAnswers();
    const score = calculateSpineScore(answers, findings);
    const breakdown = calculateBreakdown(answers, findings);
    const archetypeKey = classifyArchetype(answers);
    const planFocus = generatePlanFocus(archetypeKey, answers, findings);
    return { score, breakdown, archetypeKey, planFocus };
  };

  const handlePostureComplete = (imageUrl, findings) => {
    setPostureImageUrl(imageUrl);
    setPostureFindings(findings);
    setResults(generateResults(findings));
    setPhase("results");
  };

  const handlePostureSkip = () => {
    setResults(generateResults([]));
    setPhase("results");
  };

  const handleBuildPlan = async () => {
    setSaving(true);
    const answers = buildAnswers();
    const profile = profiles[0];

    const data = {
      pain_areas: painAreas,
      sitting_hours: followUpAnswers.sittingHours === "6plus" ? 8 : followUpAnswers.sittingHours === "3to6" ? 5 : 2,
      works_out: followUpAnswers.activityLevel === "very_active",
      spine_score: results.score,
      onboarding_complete: true,
      current_streak: 0,
      longest_streak: 0,
      scan_results: postureFindings,
      scan_image_url: postureImageUrl || "",
      movement_response: followUpAnswers.movementResponse,
      activity_level: followUpAnswers.activityLevel,
      age_range: followUpAnswers.ageRange,
      goal: answers.primaryGoal,
      archetype: results.archetypeKey,
      // Extended multi-select fields
      primary_pain: answers.primaryPain,
      secondary_pain: answers.secondaryPain,
      primary_goal: answers.primaryGoal,
      secondary_goals: answers.secondaryGoals,
    };

    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
    } else {
      await base44.entities.UserProfile.create(data);
    }

    setSaving(false);
    navigate("/");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return <IntroScreen onStart={() => setPhase("pain_multi")} />;
  }

  if (phase === "pain_multi") {
    return (
      <MultiSelectStep
        step={0}
        total={TOTAL_STEPS}
        question="Where do you experience pain or discomfort?"
        selected={painAreas}
        onToggle={togglePainArea}
        onNext={handlePainMultiNext}
        onBack={() => setPhase("intro")}
        options={PAIN_AREA_OPTIONS}
      />
    );
  }

  if (phase === "pain_tiebreak") {
    return (
      <MultiSelectStep
        step={1}
        total={TOTAL_STEPS}
        question="Which area bothers you the most?"
        subtitle="Select the one that's your biggest concern right now."
        selected={primaryPain ? [primaryPain] : []}
        onToggle={handlePainTiebreakToggle}
        onNext={handlePainTiebreakNext}
        onBack={() => setPhase("pain_multi")}
        options={PAIN_AREA_OPTIONS.filter((o) => painAreas.includes(o.value))}
        singleSelect
      />
    );
  }

  if (phase === "goal_multi") {
    const stepIdx = hasPainTiebreak ? 2 : 1;
    return (
      <MultiSelectStep
        step={stepIdx}
        total={TOTAL_STEPS}
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
    const stepIdx = hasPainTiebreak ? 3 : 2;
    return (
      <MultiSelectStep
        step={stepIdx}
        total={TOTAL_STEPS}
        question="What is your top priority right now?"
        subtitle="This drives the main focus of your plan."
        selected={primaryGoal ? [primaryGoal] : []}
        onToggle={handleGoalTiebreakToggle}
        onNext={handleGoalTiebreakNext}
        onBack={() => setPhase("goal_multi")}
        options={GOAL_OPTIONS.filter((o) => goals.includes(o.value))}
        singleSelect
      />
    );
  }

  if (phase === "follow_up") {
    return (
      <QuestionStep
        step={stepIndex}
        total={TOTAL_STEPS}
        question={currentFollowUp.question}
        options={currentFollowUp.options}
        selected={followUpAnswers[currentFollowUp.key]}
        onSelect={handleFollowUpSelect}
        onNext={handleFollowUpNext}
        onBack={handleFollowUpBack}
      />
    );
  }

  if (phase === "posture") {
    return (
      <PosturePhotoStep
        onComplete={handlePostureComplete}
        onSkip={handlePostureSkip}
      />
    );
  }

  if (phase === "results" && results) {
    return (
      <SpineScoreResults
        score={results.score}
        breakdown={results.breakdown}
        archetypeKey={results.archetypeKey}
        planFocus={results.planFocus}
        postureFindings={postureFindings}
        onBuildPlan={saving ? undefined : handleBuildPlan}
      />
    );
  }

  return null;
}