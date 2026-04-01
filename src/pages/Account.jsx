import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { calculateSpineScore, classifyArchetype, ARCHETYPES } from "@/lib/spineScore";
import { Button } from "@/components/ui/button";
import { Crown, ChevronRight, LogOut, Trash2, RefreshCw, User, Target, Activity, Clock, Calendar, Check, FileText, Shield } from "lucide-react";
import MedicalDisclaimer from "@/components/legal/MedicalDisclaimer";

// ── Inline question data (mirrors onboarding) ────────────────────────────────
const PAIN_OPTIONS = [
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

const FIELD_OPTIONS = {
  activityLevel: [
    { value: "sedentary", label: "Mostly sedentary" },
    { value: "moderate", label: "Moderately active" },
    { value: "very_active", label: "Very active" },
  ],
  sittingHours: [
    { value: "under3", label: "Less than 3 hours" },
    { value: "3to6", label: "3–6 hours" },
    { value: "6plus", label: "6+ hours" },
  ],
  ageRange: [
    { value: "under25", label: "Under 25" },
    { value: "25to40", label: "25–40" },
    { value: "40to55", label: "40–55" },
    { value: "55plus", label: "55+" },
  ],
};

function getLabelForValue(fieldKey, value) {
  const allOpts = { ...FIELD_OPTIONS, painArea: PAIN_OPTIONS, goal: GOAL_OPTIONS };
  const opt = allOpts[fieldKey]?.find((o) => o.value === value);
  return opt?.label || value || "—";
}

// Multi-select group component
function MultiGroup({ label, options, selected, onToggle, singleSelect = false }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = singleSelect ? selected === opt.value : (selected || []).includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left text-sm font-medium transition-all ${
                isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`w-4 h-4 flex items-center justify-center shrink-0 transition-colors ${
                singleSelect ? "rounded-full border-2" : "rounded-md border-2"
              } ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                {isSelected && (singleSelect
                  ? <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  : <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
              </div>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Inline edit modal ────────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const existingSittingHours = profile?.sitting_hours >= 6 ? "6plus" : profile?.sitting_hours >= 3 ? "3to6" : profile?.sitting_hours ? "under3" : null;

  const [painAreas, setPainAreas] = useState(profile?.pain_areas || []);
  const [primaryPain, setPrimaryPain] = useState(profile?.primary_pain || profile?.pain_areas?.[0] || null);
  const [goals, setGoals] = useState(
    [profile?.primary_goal, ...(profile?.secondary_goals || [])].filter(Boolean).length > 0
      ? [profile?.primary_goal, ...(profile?.secondary_goals || [])].filter(Boolean)
      : [profile?.goal].filter(Boolean)
  );
  const [primaryGoal, setPrimaryGoal] = useState(profile?.primary_goal || profile?.goal || null);
  const [activityLevel, setActivityLevel] = useState(profile?.activity_level || null);
  const [sittingHours, setSittingHours] = useState(existingSittingHours);
  const [ageRange, setAgeRange] = useState(profile?.age_range || null);

  const togglePain = (v) => setPainAreas((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const toggleGoal = (v) => setGoals((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const showPainTiebreak = painAreas.length > 1;
  const showGoalTiebreak = goals.length > 1;
  const canSave = painAreas.length > 0 && goals.length > 0 && activityLevel && sittingHours && ageRange
    && (!showPainTiebreak || primaryPain) && (!showGoalTiebreak || primaryGoal);

  const handleSave = () => {
    const resolvedPrimary = painAreas.length === 1 ? painAreas[0] : primaryPain;
    const resolvedPrimaryGoal = goals.length === 1 ? goals[0] : primaryGoal;
    onSave({
      painAreas,
      primaryPain: resolvedPrimary,
      secondaryPain: painAreas.filter((a) => a !== resolvedPrimary),
      goals,
      primaryGoal: resolvedPrimaryGoal,
      secondaryGoals: goals.filter((g) => g !== resolvedPrimaryGoal),
      activityLevel,
      sittingHours,
      ageRange,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-10 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Update Profile</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground underline underline-offset-4">Cancel</button>
        </div>

        <div className="space-y-7 flex-1">
          <MultiGroup label="Pain location (select all that apply)" options={PAIN_OPTIONS} selected={painAreas} onToggle={togglePain} />
          {showPainTiebreak && (
            <MultiGroup label="Which area bothers you the most?" options={PAIN_OPTIONS.filter((o) => painAreas.includes(o.value))} selected={primaryPain} onToggle={setPrimaryPain} singleSelect />
          )}
          <MultiGroup label="Your goals (select all that apply)" options={GOAL_OPTIONS} selected={goals} onToggle={toggleGoal} />
          {showGoalTiebreak && (
            <MultiGroup label="Top priority right now?" options={GOAL_OPTIONS.filter((o) => goals.includes(o.value))} selected={primaryGoal} onToggle={setPrimaryGoal} singleSelect />
          )}

          {[
            { label: "Activity level", key: "activityLevel", opts: FIELD_OPTIONS.activityLevel, val: activityLevel, set: setActivityLevel },
            { label: "Daily sitting time", key: "sittingHours", opts: FIELD_OPTIONS.sittingHours, val: sittingHours, set: setSittingHours },
            { label: "Age range", key: "ageRange", opts: FIELD_OPTIONS.ageRange, val: ageRange, set: setAgeRange },
          ].map(({ label, opts, val, set }) => (
            <MultiGroup key={label} label={label} options={opts} selected={val} onToggle={set} singleSelect />
          ))}
        </div>

        <div className="pt-8">
          <Button onClick={handleSave} disabled={!canSave} className="w-full h-14 rounded-2xl text-base font-semibold">
            Save & Recalculate Score
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">{title}</p>
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

function Row({ icon: Icon, label, value, onPress, danger = false }) {
  return (
    <button
      onClick={onPress}
      className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/60 transition-colors border-b border-border/50 last:border-0 ${danger ? "text-destructive" : ""}`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-destructive/10" : "bg-secondary"}`}>
          <Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
      )}
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
        {value && <p className="text-xs text-muted-foreground mt-0.5">{value}</p>}
      </div>
      <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? "text-destructive/50" : "text-muted-foreground/50"}`} />
    </button>
  );
}

// ── Delete confirmation ──────────────────────────────────────────────────────
function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-3xl p-7 w-full max-w-sm text-center"
      >
        <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-destructive" />
        </div>
        <h3 className="text-lg font-bold mb-2">Delete Account?</h3>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
          This will permanently remove your profile, Spine Score, and all progress. This cannot be undone.
        </p>
        <div className="space-y-3">
          <Button variant="destructive" onClick={onConfirm} className="w-full h-12 rounded-2xl font-semibold">
            Yes, Delete My Account
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full h-12 rounded-2xl text-muted-foreground">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Account Page ────────────────────────────────────────────────────────
export default function Account() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];

  const handleSaveProfile = async (form) => {
    const answers = {
      primaryPain: form.primaryPain,
      secondaryPain: form.secondaryPain,
      problemArea: form.primaryPain,
      movementResponse: profile?.movement_response || "stiff_then_better",
      sittingHours: form.sittingHours,
      activityLevel: form.activityLevel,
      ageRange: form.ageRange,
      primaryGoal: form.primaryGoal,
      secondaryGoals: form.secondaryGoals,
      goal: form.primaryGoal,
    };

    const postureFindings = profile?.scan_results || [];
    const newScore = calculateSpineScore(answers, postureFindings);
    const archetypeKey = classifyArchetype(answers);

    const data = {
      pain_areas: form.painAreas,
      primary_pain: form.primaryPain,
      secondary_pain: form.secondaryPain,
      primary_goal: form.primaryGoal,
      secondary_goals: form.secondaryGoals,
      sitting_hours: form.sittingHours === "6plus" ? 8 : form.sittingHours === "3to6" ? 5 : 2,
      works_out: form.activityLevel === "very_active",
      spine_score: newScore,
      goal: form.primaryGoal,
      activity_level: form.activityLevel,
      age_range: form.ageRange,
      archetype: archetypeKey,
    };

    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
    }

    queryClient.invalidateQueries({ queryKey: ["userProfile", user?.email] });
    setShowEditProfile(false);
  };

  const handleRecalculate = async () => {
    if (!profile) return;
    setRecalculating(true);

    const answers = {
      primaryPain: profile.primary_pain || profile.pain_areas?.[0] || "low_back",
      secondaryPain: profile.secondary_pain || [],
      problemArea: profile.primary_pain || profile.pain_areas?.[0] || "low_back",
      movementResponse: profile.movement_response || "stiff_then_better",
      sittingHours: profile.sitting_hours >= 6 ? "6plus" : profile.sitting_hours >= 3 ? "3to6" : "under3",
      activityLevel: profile.activity_level || "moderate",
      ageRange: profile.age_range || "25to40",
      primaryGoal: profile.primary_goal || profile.goal || "pain_relief",
      secondaryGoals: profile.secondary_goals || [],
      goal: profile.primary_goal || profile.goal || "pain_relief",
    };

    const postureFindings = profile.scan_results || [];
    const newScore = calculateSpineScore(answers, postureFindings);
    const archetypeKey = classifyArchetype(answers);

    await base44.entities.UserProfile.update(profile.id, {
      spine_score: newScore,
      archetype: archetypeKey,
    });

    queryClient.invalidateQueries({ queryKey: ["userProfile", user?.email] });
    setRecalculating(false);
  };

  const handleDeleteAccount = async () => {
    if (profile) {
      await base44.entities.UserProfile.delete(profile.id);
    }
    base44.auth.logout();
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : user?.full_name || "Your Account";

  const archetype = profile?.archetype ? ARCHETYPES[profile.archetype] : null;

  return (
    <div className="px-6 pt-14 pb-8">
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            profile={profile}
            onSave={handleSaveProfile}
            onClose={() => setShowEditProfile(false)}
          />
        )}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Crown className="w-3 h-3" />
              Beta Access
            </div>
          </div>
        </div>
      </motion.div>

      {/* Your Profile */}
      <Section title="Your Profile">
        {[
          {
            icon: Target,
            label: "Pain location",
            value: profile?.pain_areas?.length > 0
              ? profile.pain_areas.map((a) => getLabelForValue("painArea", a)).join(", ")
              : "—",
          },
          {
            icon: Activity,
            label: "Primary goal",
            value: getLabelForValue("goal", profile?.primary_goal || profile?.goal),
          },
          {
            icon: Activity,
            label: "Activity level",
            value: getLabelForValue("activityLevel", profile?.activity_level),
          },
          {
            icon: Clock,
            label: "Daily sitting time",
            value: profile?.sitting_hours >= 6 ? "6+ hours" : profile?.sitting_hours >= 3 ? "3–6 hours" : profile?.sitting_hours ? "Less than 3 hours" : "—",
          },
          {
            icon: Calendar,
            label: "Age range",
            value: getLabelForValue("ageRange", profile?.age_range),
          },
        ].map(({ icon: RowIcon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4 border-b border-border/50 last:border-0">
            <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <RowIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
        <div className="px-5 py-4">
          <Button
            onClick={() => setShowEditProfile(true)}
            variant="outline"
            className="w-full h-11 rounded-2xl text-sm font-semibold"
          >
            Update Profile
          </Button>
        </div>
      </Section>

      {/* Spine Score */}
      <Section title="Your Spine">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold">{profile?.spine_score ?? "—"}<span className="text-base font-normal text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Spine Score</p>
            </div>
            {archetype && (
              <div className="bg-primary/10 rounded-2xl px-3 py-1.5">
                <p className="text-xs font-semibold text-primary">{archetype.label}</p>
              </div>
            )}
          </div>
          {profile?.updated_date && (
            <p className="text-xs text-muted-foreground mb-4">
              Last updated {new Date(profile.updated_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
          <Button
            onClick={handleRecalculate}
            disabled={recalculating || !profile}
            variant="outline"
            className="w-full h-11 rounded-2xl text-sm font-semibold gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Recalculating…" : "Recalculate Score"}
          </Button>
          <div className="mt-3">
            <Link to="/scan">
              <Button variant="ghost" className="w-full h-10 rounded-2xl text-sm text-muted-foreground gap-2">
                Re-scan Posture
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">Beta Access</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full access is currently unlocked during testing
              </p>
            </div>
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <Link to="/pricing">
            <Button variant="outline" className="w-full h-11 rounded-2xl text-sm font-semibold gap-2">
              <Crown className="w-4 h-4" />
              Pro — Coming Soon
            </Button>
          </Link>
        </div>
      </Section>

      {/* Future placeholders */}
      <Section title="Coming Soon">
        <div className="px-5 py-4 opacity-50 border-b border-border/50">
          <p className="text-sm font-medium text-foreground">Progress Tracking</p>
          <p className="text-xs text-muted-foreground mt-0.5">Score history and trend graphs</p>
        </div>
        <div className="px-5 py-4 opacity-50">
          <p className="text-sm font-medium text-foreground">Posture History</p>
          <p className="text-xs text-muted-foreground mt-0.5">Before & after posture comparisons</p>
        </div>
      </Section>

      <MedicalDisclaimer className="mb-6" />

      {/* Legal */}
      <Section title="Legal">
        <Row
          icon={FileText}
          label="Terms of Service"
          onPress={() => navigate("/terms")}
        />
        <Row
          icon={Shield}
          label="Privacy Policy"
          onPress={() => navigate("/privacy")}
        />
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <Row
          icon={LogOut}
          label="Log Out"
          onPress={handleLogout}
        />
        <Row
          icon={Trash2}
          label="Delete Account"
          onPress={() => setShowDeleteConfirm(true)}
          danger
        />
      </Section>
    </div>
  );
}