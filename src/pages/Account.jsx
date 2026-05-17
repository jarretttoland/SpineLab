// FILE: src/pages/Account.jsx
// Replace your existing file with this entire file.
//
// What's new beyond the Apple-rejection fixes:
//   - "Notifications" section with two controls:
//     * Daily routine reminder (toggle + time picker)
//     * Re-scan reminder (toggle)
//   - First time the user enables either, we request iOS notification permission.
//   - Settings persist in localStorage via src/lib/notifications.js.

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
  BookOpen,
  Cpu,
  Bell,
  Calendar,
} from "lucide-react";
import {
  requestPermission,
  checkPermission,
  scheduleDailyRoutine,
  cancelDailyRoutine,
  enableReScanReminder,
  cancelReScanReminder,
  getPreferences,
  formatTime,
} from "@/lib/notifications";

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
  trailing = null,
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
          <Icon className={`w-5 h-5 ${danger ? "text-red-600" : "text-primary"}`} />
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

      {trailing ?? (
        <ChevronRight
          className={`w-4 h-4 shrink-0 ${
            danger ? "text-red-400" : "text-muted-foreground"
          }`}
        />
      )}
    </button>
  );
}

function StatusChip({ on, busy }) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
        on
          ? "bg-emerald-100 text-emerald-700"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {busy ? "..." : on ? "ON" : "OFF"}
    </span>
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
  const [updatingConsent, setUpdatingConsent] = useState(false);

  // Notification preferences
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [dailyHour, setDailyHour] = useState(8);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [rescanEnabled, setRescanEnabled] = useState(true);
  const [notifBusy, setNotifBusy] = useState({ daily: false, rescan: false });

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

    // Load notification preferences from localStorage
    const prefs = getPreferences();
    setDailyEnabled(prefs.dailyEnabled);
    setDailyHour(prefs.dailyHour);
    setDailyMinute(prefs.dailyMinute);
    setRescanEnabled(prefs.rescanEnabled);

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

  const handlePrivacy = () => navigate("/privacy-policy");
  const handleTerms = () => navigate("/terms-of-service");
  const handleSources = () => navigate("/sources");

  // ── AI consent toggle ──
  const handleToggleAIConsent = async () => {
    if (!user?.id || updatingConsent) return;

    const currentlyConsented = !!profile?.ai_consent_at;
    const confirmMsg = currentlyConsented
      ? "Revoke AI scanning consent? You won't be able to take new posture scans until you re-enable it. Your existing scans will not be deleted."
      : "Re-enable AI posture scanning?";

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      setUpdatingConsent(true);

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ai_consent_at: currentlyConsented ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data || null);
    } catch (err) {
      console.error("[Account] consent toggle error:", err);
      alert(`Could not update AI consent.${err?.message ? ` ${err.message}` : ""}`);
    } finally {
      setUpdatingConsent(false);
    }
  };

  // ── Notification toggles ──

  const ensurePermissionOrAlert = async () => {
    const already = await checkPermission();
    if (already) return true;
    const granted = await requestPermission();
    if (!granted) {
      alert(
        "Notifications are disabled. Enable them in Settings → SpineLab → Notifications, then come back."
      );
      return false;
    }
    return true;
  };

  const handleToggleDaily = async () => {
    if (notifBusy.daily) return;
    setNotifBusy((b) => ({ ...b, daily: true }));
    try {
      if (!dailyEnabled) {
        const ok = await ensurePermissionOrAlert();
        if (!ok) return;
        await scheduleDailyRoutine(dailyHour, dailyMinute);
        setDailyEnabled(true);
      } else {
        await cancelDailyRoutine();
        setDailyEnabled(false);
      }
    } finally {
      setNotifBusy((b) => ({ ...b, daily: false }));
    }
  };

  const handleTimeChange = async (e) => {
    const [h, m] = e.target.value.split(":").map(Number);
    setDailyHour(h);
    setDailyMinute(m);
    if (dailyEnabled) {
      await scheduleDailyRoutine(h, m);
    }
  };

  const handleToggleRescan = async () => {
    if (notifBusy.rescan) return;
    setNotifBusy((b) => ({ ...b, rescan: true }));
    try {
      if (!rescanEnabled) {
        const ok = await ensurePermissionOrAlert();
        if (!ok) return;
        await enableReScanReminder();
        setRescanEnabled(true);
      } else {
        await cancelReScanReminder();
        setRescanEnabled(false);
      }
    } finally {
      setNotifBusy((b) => ({ ...b, rescan: false }));
    }
  };

  // ── Reset / Delete ──

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
        posture_score: 0,
        consistency_score: 0,
        mobility_score: 0,
        strength_score: 0,
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
      alert(`Could not reset progress.${err?.message ? ` ${err.message}` : ""}`);
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
      const { error } = await supabase.functions.invoke("delete-account", {
        body: {},
      });
      if (error) throw error;

      clearLocalProgress();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("[Account] delete account error:", err);
      alert(`Could not delete account.${err?.message ? ` ${err.message}` : ""}`);
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
  const aiConsented = !!profile?.ai_consent_at;

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

          {/* ── NOTIFICATIONS ── */}
          <section>
            <h2 className="text-sm font-bold mb-3">Notifications</h2>
            <div className="space-y-3">
              <AccountRow
                icon={Bell}
                title="Daily routine reminder"
                subtitle={
                  dailyEnabled
                    ? `Every day at ${formatTime(dailyHour, dailyMinute)}`
                    : "Off"
                }
                onClick={handleToggleDaily}
                disabled={notifBusy.daily}
                trailing={<StatusChip on={dailyEnabled} busy={notifBusy.daily} />}
              />

              {dailyEnabled && (
                <div className="ml-2 pl-4 border-l-2 border-border pt-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Reminder time
                  </label>
                  <input
                    type="time"
                    value={`${String(dailyHour).padStart(2, "0")}:${String(
                      dailyMinute
                    ).padStart(2, "0")}`}
                    onChange={handleTimeChange}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
                  />
                </div>
              )}

              <AccountRow
                icon={Calendar}
                title="Re-scan reminder"
                subtitle="Nudges you to scan again after 7 days"
                onClick={handleToggleRescan}
                disabled={notifBusy.rescan}
                trailing={<StatusChip on={rescanEnabled} busy={notifBusy.rescan} />}
              />
            </div>
          </section>

          {/* ── PRIVACY CONTROLS ── */}
          <section>
            <h2 className="text-sm font-bold mb-3">Privacy Controls</h2>
            <AccountRow
              icon={Cpu}
              title="AI Posture Scanning"
              subtitle={
                aiConsented
                  ? "Enabled · tap to revoke consent"
                  : "Disabled · tap to enable"
              }
              onClick={handleToggleAIConsent}
              disabled={updatingConsent}
              trailing={<StatusChip on={aiConsented} busy={updatingConsent} />}
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
              <AccountRow
                icon={BookOpen}
                title="Methodology & Sources"
                subtitle="Research behind SpineLab"
                onClick={handleSources}
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
