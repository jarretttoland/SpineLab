import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Activity, Scan, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpineScoreRing from "@/components/SpineScoreRing";
import { getRoutineForUser } from "@/lib/exercises";
import { format } from "date-fns";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user, isLoading: loadingUser } = useCurrentUser();

  const { data: profiles, isLoading: loadingProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: checkIns } = useQuery({
    queryKey: ["checkIns", user?.email],
    queryFn: () => base44.entities.DailyCheckIn.filter({ created_by: user.email }, "-created_date", 30),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const didToday = checkIns.some((c) => c.date === todayStr && c.completed);

  const isLoading = loadingUser || loadingProfile;

  useEffect(() => {
    if (!isLoading && (!profile || !profile.onboarding_complete)) {
      navigate("/onboarding");
    }
  }, [isLoading, profile, navigate]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exercises = getRoutineForUser(profile.pain_areas);

  return (
    <div className="px-6 pt-14 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.first_name ? `Hi, ${profile.first_name} 👋` : "SpineLab"}
          </h1>
        </div>

      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center mb-6"
      >
        <SpineScoreRing score={profile.spine_score || 0} />
        <p className="text-sm text-muted-foreground mt-3 font-medium">Your Spine Score</p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-3xl font-bold">{profile.current_streak || 0}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</span>
          </div>
          <p className="text-3xl font-bold">{didToday ? "✓" : "—"}</p>
          <p className="text-xs text-muted-foreground">{didToday ? "Completed" : "Not yet"}</p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link to="/routine">
          <div className="bg-foreground text-background rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Fix your posture</p>
              <p className="text-sm opacity-70">5 min daily routine →</p>
            </div>
            <div className="bg-primary rounded-2xl p-3">
              <ArrowRight className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Quick Routine Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Today's Routine</h2>
          <Link to="/routine" className="text-primary text-sm font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {exercises.slice(0, 3).map((ex, i) => (
            <div
              key={ex.id}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="bg-secondary rounded-xl w-10 h-10 flex items-center justify-center text-sm font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{ex.name}</p>
                <p className="text-xs text-muted-foreground">{ex.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scan CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <Link to="/scan">
          <div className="border border-border rounded-3xl p-5 flex items-center gap-4 bg-card">
            <div className="bg-primary/10 rounded-2xl p-3">
              <Scan className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">AI Posture Scan</p>
              <p className="text-xs text-muted-foreground">Upload a photo to check your posture</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}