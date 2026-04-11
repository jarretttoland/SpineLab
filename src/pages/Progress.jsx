import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import SpineScoreRing from "@/components/SpineScoreRing";
import { supabase } from "@/lib/supabase";

function ScoreBar({ label, value = 0 }) {
  const safe = Number.isFinite(value) ? value : 0;

  const color =
    safe >= 70
      ? "bg-primary"
      : safe >= 45
      ? "bg-amber-400"
      : "bg-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{safe}</span>
      </div>

      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, safe))}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

export default function Progress() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user?.id) {
          if (mounted) setLoading(false);
          return;
        }

        const [
          { data: profileData, error: profileError },
          { data: scansData, error: scansError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("posture_scans")
            .select("*")
            .eq("user_id", user.id)
            .order("scan_date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (profileError) throw profileError;
        if (scansError) throw scansError;
        if (!mounted) return;

        setProfile(profileData || null);
        setScans(Array.isArray(scansData) ? scansData : []);
      } catch (err) {
        console.error("[Progress] load error:", err);
        if (!mounted) return;
        setProfile(null);
        setScans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, []);

  const completedScans = useMemo(() => {
    return scans.filter((s) => Number.isFinite(Number(s?.quality_score)));
  }, [scans]);

  const latestScan = completedScans[0] || null;
  const previousScan = completedScans[1] || null;

  const trendLabel = useMemo(() => {
    if (!latestScan || !previousScan) {
      return "Scan anytime. Re-scan every 2 weeks to compare progress.";
    }

    const latest = Number(latestScan?.quality_score || 0);
    const previous = Number(previousScan?.quality_score || 0);
    const delta = latest - previous;

    if (delta >= 3) return `Up ${delta} from last scan`;
    if (delta <= -3) return `Down ${Math.abs(delta)} from last scan`;
    return "No major change from last scan";
  }, [latestScan, previousScan]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const spineScore = Number(profile?.spine_score ?? 0);
  const postureScore = Number(profile?.posture_score ?? latestScan?.quality_score ?? spineScore);
  const consistencyScore = Number(profile?.consistency_score ?? 0);
  const mobilityScore = Number(profile?.mobility_score ?? 50);
  const strengthScore = Number(profile?.strength_score ?? 50);

  return (
    <div className="px-5 pt-12 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Progress
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Your Journey
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 bg-secondary border border-border"
      >
        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Posture scan trend</p>
          <p className="text-xs text-muted-foreground">{trendLabel}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center mb-6"
      >
        <SpineScoreRing score={spineScore} size={130} strokeWidth={9} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-4 mb-6 space-y-4"
      >
        <ScoreBar label="Posture" value={postureScore} />
        <ScoreBar label="Consistency" value={consistencyScore} />
        <ScoreBar label="Mobility" value={mobilityScore} />
        <ScoreBar label="Strength & Stability" value={strengthScore} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{profile?.current_streak || 0}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{profile?.longest_streak || 0}</p>
          <p className="text-[10px] text-muted-foreground">Best</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{completedScans.length}</p>
          <p className="text-[10px] text-muted-foreground">Scans</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-semibold text-sm mb-3">Recent Posture Scans</h2>

        <div className="space-y-2">
          {completedScans.length === 0 ? (
            <div className="bg-card border border-border rounded-xl px-4 py-4 text-sm text-muted-foreground">
              No posture scans yet. Your first scan will appear here.
            </div>
          ) : (
            completedScans.slice(0, 7).map((scan, i) => {
              const score = Number(scan?.quality_score ?? 0);
              const prev = completedScans[i + 1];
              const delta = prev
                ? score - Number(prev?.quality_score ?? 0)
                : null;

              return (
                <div
                  key={scan.id || `${scan.scan_date}-${i}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      score >= 75 ? "bg-primary/10" : "bg-secondary"
                    }`}
                  >
                    {score >= 75 ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/60" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {scan.scan_date
                        ? format(new Date(scan.scan_date), "EEEE, MMM d")
                        : "Scan"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Score {score}
                      {scan.pattern ? ` • ${scan.pattern}` : ""}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      delta == null
                        ? "text-muted-foreground"
                        : delta > 0
                        ? "text-emerald-600"
                        : delta < 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {delta == null ? "Latest" : delta > 0 ? `+${delta}` : `${delta}`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}