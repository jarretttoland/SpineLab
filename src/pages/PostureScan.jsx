// FILE: src/pages/PostureScan.jsx
// Replace your existing file with this entire file.
//
// What's new in this version (on top of the Apple-rejection fixes):
//   - Imports scheduleReScanReminder from the new notifications lib
//   - After every successful scan, pushes the next "re-scan reminder"
//     notification 7 days into the future (does nothing if the user
//     hasn't enabled re-scan notifications in Account)

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import LandmarkGuide from "@/components/posture/LandmarkGuide";
import CaptureScreen from "@/components/posture/CaptureScreen";
import ScanResults from "@/components/posture/ScanResults";
import ScanConsentModal from "@/components/posture/ScanConsentModal";
import { analyzePosture, compareTrend } from "@/lib/postureAnalysis";
import {
  getCurrentUserOrThrow,
  fetchProfile,
  fetchPreviousScans,
  upsertProfile,
  createPostureScan,
} from "@/lib/postureScanSupabase";
import { scheduleReScanReminder } from "@/lib/notifications";
import { getActiveWeeklyMinutes, getEffortPercent, calcSpineAge } from "@/lib/spineScore";
import { writeSpineScore } from "@/lib/healthkit";
import { supabase } from "@/lib/supabase";
import PaywallScreen from "@/components/paywall/PaywallScreen";

// ── Derive the single most important finding for exercise targeting ─────────
const SEVERITY_RANK = { notable: 3, moderate: 2, mild: 1, good: 0, invalid: -1 };
const FINDING_ID_MAP = {
  forward_head:      "forward_head",
  rounded_shoulders: "rounded_shoulders",
  upper_crossed:     "rounded_shoulders",
  pelvic_tilt:       "pelvic_tilt",
  lumbar_lordosis:   "kyphosis",
  kyphosis_lordosis: "kyphosis",
};

function deriveTopFinding(findings = []) {
  const actionable = findings
    .filter((f) => FINDING_ID_MAP[f.id] && f.severity !== "good" && f.severity !== "invalid")
    .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0));
  return actionable[0] ? FINDING_ID_MAP[actionable[0].id] : null;
}
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostureScan() {
  const location = useLocation();
  const navigate = useNavigate();

  const isOnboardingFlow = location.pathname === "/onboarding-scan";

  const [phase, setPhase] = useState("loading");
  const [scanData, setScanData] = useState(null);
  const [detectionFailed, setDetectionFailed] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [user, setUser]                     = useState(null);
  const [profile, setProfile]               = useState(null);
  const [previousScans, setPreviousScans]   = useState([]);
  const [bootError, setBootError]           = useState(null);
  const [scansThisMonth, setScansThisMonth] = useState(0);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentUserOrThrow();
        if (!mountedRef.current) return;
        setUser(currentUser);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [profileData, scans, monthCountResult] = await Promise.all([
          fetchProfile(currentUser.id),
          fetchPreviousScans(currentUser.id, 10),
          supabase
            .from("posture_scans")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .gte("created_at", monthStart.toISOString()),
        ]);

        if (!mountedRef.current) return;

        setProfile(profileData);
        setPreviousScans(scans);
        setScansThisMonth(monthCountResult.count ?? 0);

        // During onboarding, the user just came from the combined
        // pitch + instructions screen (ScanOptionStep), so skip the
        // separate "guide" page and go straight into consent (if
        // required) or the camera.
        const needsConsentNow = profileData && !profileData.ai_consent_at;

        if (isOnboardingFlow) {
          setPhase(needsConsentNow ? "consent" : "capture");
        } else {
          setPhase("guide");
        }
      } catch (err) {
        console.error("[PostureScan] boot error:", err);
        if (!mountedRef.current) return;
        setBootError(err?.message || "Failed to load scan data");
      }
    }

    load();
  }, [isOnboardingFlow]);

  // ───────────────────────────────────────────────────────────
  // AI consent (Apple 5.1.1 / 5.1.2)
  // ───────────────────────────────────────────────────────────

  const needsConsent = profile && !profile.ai_consent_at;

  const handleConsentAccept = async () => {
    if (!user?.id) return;

    try {
      const updated = await upsertProfile({
        id: user.id,
        ai_consent_at: new Date().toISOString(),
      });
      if (!mountedRef.current) return;
      setProfile(updated);
      setPhase("capture");
    } catch (err) {
      console.error("[PostureScan] consent save error:", err);
      if (!mountedRef.current) return;
      // We still proceed to capture — the consent action itself is the legal
      // record. We'll retry persistence opportunistically later.
      setPhase("capture");
    }
  };

  const handleConsentDecline = () => {
    if (isOnboardingFlow) {
      navigate("/onboarding", { replace: true, state: { returnToScanOption: true } });
    } else {
      setPhase("guide");
    }
  };

  const handleImageAccepted = async (imageUrl, keyLandmarks, imagePath = null) => {
    setSaveError(null);

    const detectionEmpty =
      !keyLandmarks ||
      Object.keys(keyLandmarks).length === 0 ||
      Object.values(keyLandmarks).every((v) => v == null);

    if (detectionEmpty) {
      setDetectionFailed(true);
      setScanData({
        imageUrl: imageUrl || "",
        landmarks: [],
        findings: [],
        overallScore: 0,
        summary: "",
        pattern: "",
        trend: null,
        scanDate: format(new Date(), "yyyy-MM-dd"),
        subscores: { headNeck: 0, shoulderThoracic: 0, lumbarPelvis: 0 },
        spineDelta: 0,
        previousSpineScore: profile?.spine_score ?? 50,
        newSpineScore: profile?.spine_score ?? 50,
      });
      setPhase("results");
      return;
    }

    let findings = [];
    let overallScore = 0;
    let summary = "";
    let pattern = "";
    let subscores = { headNeck: 0, shoulderThoracic: 0, lumbarPelvis: 0 };

    try {
      const result = analyzePosture(keyLandmarks, 1, 1.5, true);
      findings = result?.findings || [];
      overallScore = result?.overallScore ?? 0;
      summary = result?.summary || "";   // template fallback
      pattern = result?.pattern || "";
      subscores = result?.subscores || subscores;

      // ── Real AI summary via Supabase Edge Function ──────────────────────
      // Raced against a timeout so a slow AI call can't stall the whole
      // scan — if it doesn't answer quickly we just keep the template
      // summary computed above and move on.
      try {
        const edgeRes = await Promise.race([
          fetch(
            "https://dslaxbxapbamrreopcdm.supabase.co/functions/v1/analyze-posture",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGF4YnhhcGJhbXJyZW9wY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjU5NTMsImV4cCI6MjA5MDY0MTk1M30.TUFikVyCNkRPpu7dF-eLTVNZLGSwQFP37UcIXP2H3-k",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGF4YnhhcGJhbXJyZW9wY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjU5NTMsImV4cCI6MjA5MDY0MTk1M30.TUFikVyCNkRPpu7dF-eLTVNZLGSwQFP37UcIXP2H3-k",
              },
              body: JSON.stringify({
                findings,
                overallScore,
                pattern,
                subscores,
                ageRange: profile?.age_range ?? null,
                scanCount: (previousScans?.length ?? 0) + 1,
              }),
            }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("ai_summary_timeout")), 4000)
          ),
        ]);
        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData?.summary) summary = edgeData.summary;
        }
      } catch (aiErr) {
        // Non-fatal — keep the template summary if AI call fails or times out
        console.warn("[PostureScan] AI summary unavailable, using template:", aiErr);
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (err) {
      console.error("[PostureScan] analyze error:", err);
    }

    let trend = null;
    if (previousScans.length > 0) {
      const normalizedPrev = (previousScans[0]?.issues || []).map((f) => ({
        severity:
          f.severity === "high"
            ? "notable"
            : f.severity === "medium"
            ? "moderate"
            : "mild",
      }));
      trend = compareTrend(findings, normalizedPrev);
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const previousStructural =
      profile?.structural_score ?? profile?.spine_score ?? 50;
    // `consistency_score` stores raw weekly effort minutes, not a 0-100
    // score (see spineScore.js) — convert before blending into spine score.
    const consistencyScore = getEffortPercent(getActiveWeeklyMinutes(profile));
    const mobilityScore    = profile?.mobility_score    ?? 50;
    const strengthScore    = profile?.strength_score    ?? 50;
    const previousSpineScore = profile?.spine_score ?? 50;

    const structuralAdjustment = Math.round((overallScore - 70) / 6);
    const newStructuralScore = Math.max(
      0,
      Math.min(100, previousStructural + structuralAdjustment)
    );
    const newSpineScore = Math.round(
      newStructuralScore * 0.4 +
      consistencyScore   * 0.2 +
      mobilityScore      * 0.2 +
      strengthScore      * 0.2
    );
    const spineDelta = newSpineScore - previousSpineScore;

    // Spine age: shift from the user's actual age midpoint based on spine score
    const spineAge = calcSpineAge(newSpineScore, profile?.age_range);

    const detectedLandmarks = ["ear", "shoulder", "hip"];
    if (keyLandmarks.knee) detectedLandmarks.push("knee");
    if (keyLandmarks.ankle) detectedLandmarks.push("ankle");

    const COLORS = {
      ear: "#3b82f6",
      shoulder: "#8b5cf6",
      hip: "#10b981",
      knee: "#ef4444",
      ankle: "#f59e0b",
    };
    const LABELS = {
      ear: "Ear",
      shoulder: "Shoulder",
      hip: "Hip",
      knee: "Knee",
      ankle: "Ankle",
    };
    const displayLandmarks = detectedLandmarks
      .filter((id) => keyLandmarks[id])
      .map((id) => ({
        id,
        label: LABELS[id],
        color: COLORS[id],
        normX: keyLandmarks[id].x,
        normY: keyLandmarks[id].y,
      }));

    if (user?.id) {
      try {
        const topFinding = deriveTopFinding(findings);

        // These two writes don't depend on each other's result, so run them
        // concurrently instead of one after another — cuts save latency
        // roughly in half.
        const [, updatedProfile] = await Promise.all([
          createPostureScan({
            user_id: user.id,
            image_url: imageUrl,
            image_path: imagePath,
            issues: findings.map((f) => ({
              id: f.id,
              label: f.label,
              detail: f.detail,
              confidence: f.confidence || "medium",
              severity:
                f.severity === "notable"
                  ? "high"
                  : f.severity === "moderate"
                  ? "medium"
                  : f.severity === "invalid"
                  ? "invalid"
                  : "low",
            })),
            landmarks_detected: detectedLandmarks,
            quality_score: overallScore,
            scan_date: today,
            created_at: new Date().toISOString(),
            notes: summary,
            pattern,
            subscores,
          }),
          upsertProfile({
            id: user.id,
            scan_results: findings
              .filter((f) => f.severity !== "good")
              .map((f) => f.id),
            scan_image_url: imageUrl,
            posture_score: overallScore,
            structural_score: newStructuralScore,
            spine_score: newSpineScore,
            ...(topFinding ? { top_finding: topFinding } : {}),
          }),
        ]);

        if (!mountedRef.current) return;
        setProfile(updatedProfile);

        // Write Spine Score to Apple Health (no-ops if HealthKit unavailable)
        writeSpineScore(newSpineScore).catch(() => {});

        // Refresh scan history in the background — it's only used to compute
        // trend on the *next* scan, not to render the results screen the
        // user is about to see, so it shouldn't block navigation.
        fetchPreviousScans(user.id, 10)
          .then((refreshed) => {
            if (mountedRef.current) setPreviousScans(refreshed);
          })
          .catch(() => {});
      } catch (err) {
        console.error("[PostureScan] save error:", err);
        if (!mountedRef.current) return;
        setSaveError(
          "We couldn't save your scan. Your results are shown below but won't sync until you try again."
        );
      }
    }

    if (!mountedRef.current) return;

    setDetectionFailed(false);
    setScanData({
      imageUrl,
      imagePath,
      landmarks: displayLandmarks,
      findings,
      overallScore,
      summary,
      pattern,
      trend,
      scanDate: today,
      subscores,
      spineDelta,
      previousSpineScore,
      newSpineScore,
      spineAge,
    });
    setPhase("results");

    // Push the next re-scan reminder 7 days out. No-ops if the user
    // hasn't enabled re-scan notifications in Account → Notifications.
    scheduleReScanReminder(7);
  };

  const handleNewScan = () => {
    setScanData(null);
    setDetectionFailed(false);
    setSaveError(null);
    setPhase(isOnboardingFlow ? "capture" : "guide");
  };

  const handleRetake = () => {
    setScanData(null);
    setDetectionFailed(false);
    setSaveError(null);
    setPhase("capture");
  };

  const handleSeeTotalSpineScore = () => {
    navigate("/onboarding?fromScan=true", {
      replace: true,
      state: { fromScan: true },
    });
  };

  // Wraps the user's tap on "Start Scan".
  // Free users are gated to 1 scan/month — show paywall if they've used it.
  const handleStartScanFromGuide = () => {
    const isPremium = profile?.subscription_tier === "premium";
    if (!isPremium && scansThisMonth >= 1) {
      setPhase("paywall");
      return;
    }
    if (needsConsent) {
      setPhase("consent");
    } else {
      setPhase("capture");
    }
  };

  if (bootError) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold mb-2">Could not load SpineLab</h1>
          <p className="text-sm text-muted-foreground">{bootError}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-2xl h-12 px-6">
          Go back
        </Button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (phase === "paywall") {
    return (
      <PaywallScreen
        source="scan"
        onClose={() => setPhase("guide")}
        onUpgrade={() => {
          // RevenueCat purchase flow wired here later
          setPhase("guide");
        }}
      />
    );
  }

  if (phase === "guide") {
    return <LandmarkGuide onCamera={handleStartScanFromGuide} />;
  }

  if (phase === "consent") {
    return (
      <ScanConsentModal
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
        privacyPolicyUrl="/privacy-policy"
      />
    );
  }

  if (phase === "capture") {
    return (
      <CaptureScreen
        onAccepted={handleImageAccepted}
        onBack={() => {
          if (isOnboardingFlow) {
            navigate("/onboarding", { replace: true });
          } else {
            setPhase("guide");
          }
        }}
        userId={user?.id}
      />
    );
  }

  if (phase === "results") {
    return (
      <ScanResults
        imageUrl={scanData?.imageUrl || ""}
        landmarks={scanData?.landmarks || []}
        findings={scanData?.findings || []}
        overallScore={scanData?.overallScore ?? 0}
        summary={scanData?.summary || ""}
        pattern={scanData?.pattern || ""}
        trend={scanData?.trend || null}
        scanDate={scanData?.scanDate || ""}
        subscores={
          scanData?.subscores || {
            headNeck: 0,
            shoulderThoracic: 0,
            lumbarPelvis: 0,
          }
        }
        spineDelta={scanData?.spineDelta ?? 0}
        previousSpineScore={scanData?.previousSpineScore ?? 50}
        newSpineScore={scanData?.newSpineScore ?? 50}
        spineAge={scanData?.spineAge ?? null}
        detectionFailed={detectionFailed}
        saveError={saveError}
        onNewScan={handleNewScan}
        onRetake={handleRetake}
        showContinueButton={isOnboardingFlow}
        onContinue={isOnboardingFlow ? handleSeeTotalSpineScore : null}
        continueLabel="See Total Spine Score"
      />
    );
  }

  return null;
}
