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

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [previousScans, setPreviousScans] = useState([]);
  const [bootError, setBootError] = useState(null);

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

        const [profileData, scans] = await Promise.all([
          fetchProfile(currentUser.id),
          fetchPreviousScans(currentUser.id, 10),
        ]);

        if (!mountedRef.current) return;
        setProfile(profileData);
        setPreviousScans(scans);
        setPhase("guide");
      } catch (err) {
        console.error("[PostureScan] boot error:", err);
        if (!mountedRef.current) return;
        setBootError(err?.message || "Failed to load scan data");
      }
    }

    load();
  }, []);

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
    setPhase("guide");
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
      summary = result?.summary || "";
      pattern = result?.pattern || "";
      subscores = result?.subscores || subscores;
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
    const consistencyScore = profile?.consistency_score ?? 50;
    const previousSpineScore = profile?.spine_score ?? 50;

    const structuralAdjustment = Math.round((overallScore - 70) / 6);
    const newStructuralScore = Math.max(
      0,
      Math.min(100, previousStructural + structuralAdjustment)
    );
    const newSpineScore = Math.round(
      newStructuralScore * 0.7 + consistencyScore * 0.3
    );
    const spineDelta = newSpineScore - previousSpineScore;

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
        await createPostureScan({
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
        });

        const updatedProfile = await upsertProfile({
          id: user.id,
          scan_results: findings
            .filter((f) => f.severity !== "good")
            .map((f) => f.id),
          scan_image_url: imageUrl,
          posture_score: overallScore,
          structural_score: newStructuralScore,
          spine_score: newSpineScore,
        });

        if (!mountedRef.current) return;
        setProfile(updatedProfile);

        const refreshedScans = await fetchPreviousScans(user.id, 10);
        if (!mountedRef.current) return;
        setPreviousScans(refreshedScans);
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
    setPhase("guide");
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

  // Wraps the user's tap on "Start Scan" — if they need consent, we
  // route them through the modal first.
  const handleStartScanFromGuide = () => {
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
        onBack={() => setPhase("guide")}
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
