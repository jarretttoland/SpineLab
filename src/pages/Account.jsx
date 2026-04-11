import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  FileText,
  LogOut,
  Shield,
  SlidersHorizontal,
  Trash2,
  User,
  RefreshCw,
} from "lucide-react";

const STORAGE_KEYS = {
  rewardPoints: "spinelab_reward_points",
  routineDayKey: "spinelab_routine_day_key",
  lockedDayIndex: "spinelab_locked_day_index",
  completedDayKey: "spinelab_completed_day_key",
};

function AccountRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
        danger
          ? "border-red-200 bg-red-50/60 hover:bg-red-50"
          : "border-border bg-card hover:bg-accent/40"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            danger ? "bg-red-100" : "bg-primary/10"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${danger ? "text-red-600" : "text-primary"}`}
          />
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${
              danger ? "text-red-700" : "text-foreground"
            }`}
          >
            {title}
          </p>
          {subtitle ? (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <ChevronRight
        className={`w-4 h-4 shrink-0 ${
          danger ? "text-red-400" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}

function clearLocalProgress() {
  try {
    localStorage.removeItem(STORAGE_KEYS.rewardPoints);
    localStorage.removeItem(STORAGE_KEYS.routineDayKey);
    localStorage.removeItem(STORAGE_KEYS.lockedDayIndex);
    localStorage.removeItem(STORAGE_KEYS.completedDayKey);
    localStorage.removeItem("guest");
  } catch {
    // ignore
  }
}

export default function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!currentUser) {
          navigate("/", { replace: true });
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        setUser(currentUser);
        setProfile(data || null);
      } catch (err) {
        console.error("[Account] error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      clearLocalProgress();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("[Account] logout error:", err);
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  const handleUpdatePlan = () => {
    navigate("/onboarding", {
      state: { isEditMode: true, fromAccount: true },
    });
  };

  const handlePrivacy = () => {
    navigate("/privacy-policy");
  };

  const handleTerms = () => {
    navigate("/terms-of-service");
  };

  const handleResetProgress = async () => {
    if (!user?.id || resetting) return;

    const confirmed = window.confirm(
      "Reset your progress? This will clear scans, streaks, scores, and onboarding answers."
    );

    if (!confirmed) return;

    try {
      setResetting(true);

      const { error: scansError } = await supabase
        .from("posture_scans")
        .delete()
        .eq("user_id", user.id);

      if (scansError) throw scansError;

      const resetPayload = {
        onboarding_complete: false,
        spine_score: 0,
        consistency_score: 0,
        current_streak: 0,
        longest_streak: 0,
        plan_type: null,
        routine_level: "moderate",
        updated_at: new Date().toISOString(),
      };

      const { data, error: profileError } = await supabase
        .from("profiles")
        .update(resetPayload)
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      clearLocalProgress();
      setProfile(data || null);

      window.location.href = "/onboarding";
    } catch (err) {
      console.error("[Account] reset progress error:", err);
      alert(
        `Could not reset progress.${err?.message ? ` ${err.message}` : ""}`
      );
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleting) return;

    const confirmed = window.confirm(
      "Delete your account? This permanently removes all SpineLab data."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const { error: scansError } = await supabase
        .from("posture_scans")
        .delete()
        .eq("user_id", user.id);

      if (scansError) throw scansError;

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      clearLocalProgress();
      await supabase.auth.signOut();

      window.location.href = "/";
    } catch (err) {
      console.error("[Account] delete account error:", err);
      alert(
        `Could not delete account.${err?.message ? ` ${err.message}` : ""}`
      );
    } finally {
      setDeleting(false);
    }
  };

  const displayName =
    profile?.first_name?.trim() ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Account";

  const spineScore =
    typeof profile?.spine_score === "number" ? profile.spine_score : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-14 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            Current Spine Score
          </p>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold tracking-tight">{spineScore}</p>
              <p className="text-sm text-muted-foreground mt-1">out of 100</p>
            </div>

            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                SpineLab
              </p>
              <p className="text-sm text-foreground/80 mt-1">
                Track your score and update your plan anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-bold mb-3">Your Plan</h2>
            <AccountRow
              icon={SlidersHorizontal}
              title="Update My Plan"
              subtitle="Retake onboarding"
              onClick={handleUpdatePlan}
            />
          </section>

          <section>
            <h2 className="text-sm font-bold mb-3">Privacy & Legal</h2>
            <div className="space-y-3">
              <AccountRow
                icon={Shield}
                title="Privacy Policy"
                onClick={handlePrivacy}
              />
              <AccountRow
                icon={FileText}
                title="Terms of Service"
                onClick={handleTerms}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-3">Data & Progress</h2>
            <div className="space-y-3">
              <AccountRow
                icon={RefreshCw}
                title={resetting ? "Resetting Progress..." : "Reset Progress"}
                subtitle="Start over but keep login"
                onClick={handleResetProgress}
                disabled={resetting || deleting}
              />

              <AccountRow
                icon={Trash2}
                title={deleting ? "Deleting Account..." : "Delete Account"}
                subtitle="Delete everything"
                onClick={handleDeleteAccount}
                danger
                disabled={resetting || deleting}
              />
            </div>
          </section>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleLogout}
            disabled={loggingOut || resetting || deleting}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loggingOut ? "Logging Out..." : "Log Out"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}