import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Scan, Flame } from "lucide-react";
import SpineScoreRing from "@/components/SpineScoreRing";
import { getRoutineForUser } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user?.id) {
          navigate("/", { replace: true });
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!mounted) return;

        if (!profileData?.onboarding_complete) {
          navigate("/onboarding", { replace: true });
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error("[Dashboard] load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const safeProfile = profile || {};
  const spineScore =
    typeof safeProfile.spine_score === "number" ? safeProfile.spine_score : 0;
  const streak =
    typeof safeProfile.current_streak === "number" ? safeProfile.current_streak : 0;

  const displayName =
    safeProfile.first_name?.trim() ||
    "SpineLab";

  const primaryGoalLabel =
    safeProfile.primary_goal === "pain_relief"
      ? "Pain relief"
      : safeProfile.primary_goal === "better_posture"
      ? "Better posture"
      : safeProfile.primary_goal === "performance"
      ? "Performance and strength"
      : "Daily spine health";

  const exercises = getRoutineForUser(safeProfile.pain_areas || []);

  return (
    <div className="px-6 pt-14 pb-8 min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="mb-10">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center mb-6 shadow-sm">
          <SpineScoreRing score={spineScore} />
          <p className="text-sm mt-3 text-muted-foreground">Your Spine Score</p>
          <p className="text-xs text-muted-foreground mt-1">
            Synced from your latest profile data
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <Flame className="w-4 h-4 mb-2 text-primary" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <Activity className="w-4 h-4 mb-2 text-primary" />
            <p className="text-sm font-medium leading-snug">{primaryGoalLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">Current plan focus</p>
          </div>
        </div>

        <Link to="/routine">
          <div className="bg-black text-white rounded-3xl p-6 mb-6">
            <p className="text-sm text-white/70 mb-1">Today’s plan</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">
                {exercises?.length ? "See your routine" : "Start your routine"}
              </p>
              <span className="text-white/80">→</span>
            </div>
          </div>
        </Link>

        <Link to="/scan">
          <div className="border border-border rounded-3xl p-5 flex items-center gap-4 bg-card">
            <Scan className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">AI Posture Scan</p>
              <p className="text-xs text-muted-foreground">
                Update your structural score
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}