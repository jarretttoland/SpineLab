import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import LandmarkGuide from "@/components/posture/LandmarkGuide";
import CaptureScreen from "@/components/posture/CaptureScreen";
import ScanResults from "@/components/posture/ScanResults";
import { analyzePosture, compareTrend } from "@/lib/postureAnalysis";
import {
  getCurrentUserOrThrow,
  fetchProfile,
  fetchPreviousScans,
  upsertProfile,
  createPostureScan,
} from "@/lib/postureScanSupabase";

export default function PostureScan() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);

  const fromOnboarding =
    params.get("from") === "onboarding" ||
    location.pathname === "/onboarding-scan";

  const [phase, setPhase] = useState("guide");
  const [scanData, setScanData] = useState(null);
  const [detectionFailed, setDetectionFailed] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [previousScans, setPreviousScans] = useState([]);
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const currentUser = await getCurrentUserOrThrow();
        if (!isMounted) return;

        setUser(currentUser);

        const [profileData, scans] = await Promise.all([
          fetchProfile(currentUser.id),
          fetchPreviousScans(currentUser.id, 10),
        ]);

        if (!isMounted) return;

        setProfile(profileData);
        setPreviousScans(scans);
      } catch (err) {
        console.error("[PostureScan] boot error:", err);
        if (!isMounted) return;
        setBootError(err?.message || "Failed to load scan data");
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleImageAccepted = async (imageUrl, keyLandmarks, imagePath = null) => {
    if (!keyLandmarks || Object.keys(keyLandmarks).length === 0) {
      setDetectionFailed(true);

      const previousStructural =
        profile?.structural_score ?? profile?.spine_score ?? 50;
      const consistencyScore = profile?.consistency_score ?? 50;
      const previousSpineScore = profile?.spine_score ?? 50;

      const newSpineScore = Math.round(
        previousStructural * 0.7 + consistencyScore * 0.3
      );

      setScanData({
        imageUrl: imageUrl || "",
        landmarks: [],
        findings: [],
        overallScore: 0,
        summary: "",
        pattern: "",
        trend: null,
        scanDate: format(new Date(), "yyyy-MM-dd"),
        subscores: {
          headNeck: 0,
          shoulderThoracic: 0,
          lumbarPelvis: 0,
        },
        spineDelta: newSpineScore - previousSpineScore,
        previousSpineScore,
        newSpineScore,
      });

      setPhase("results");
      return;
    }

    let findings = [];
    let overallScore = 0;
    let summary = "";
    let pattern = "";
    let subscores = {
      headNeck: 0,
      shoulderThoracic: 0,
      lumbarPelvis: 0,
    };
    let debugInfo = null;

    try {
      const result = analyzePosture(keyLandmarks, 1, 1.5, true);
      findings = result?.findings || [];
      overallScore = result?.overallScore ?? 0;
      summary = result?.summary || "";
      pattern = result?.pattern || "";
      subscores = result?.subscores || subscores;
      debugInfo = result?.debug || null;
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
          updated_at: new Date().toISOString(),
        });

        setProfile(updatedProfile);

        const refreshedScans = await fetchPreviousScans(user.id, 10);
        setPreviousScans(refreshedScans);
      } catch (err) {
        console.error("[PostureScan] save error:", err);
      }
    }

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
      debugInfo,
      spineDelta,
      previousSpineScore,
      newSpineScore,
    });

    setPhase("results");
  };

  const handleNewScan = () => {
    setScanData(null);
    setDetectionFailed(false);
    setPhase("guide");
  };

  const handleRetake = () => {
    setScanData(null);
    setDetectionFailed(false);
    setPhase("capture");
  };

  const handleSeeTotalSpineScore = () => {
    navigate("/onboarding?fromScan=true", {
      replace: true,
      state: { fromScan: true },
    });
  };

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold mb-2">Could not load SpineLab</h1>
          <p className="text-sm text-muted-foreground">{bootError}</p>
        </div>
      </div>
    );
  }

  if (phase === "guide") {
    return <LandmarkGuide onCamera={() => setPhase("capture")} />;
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
        onNewScan={handleNewScan}
        onRetakeCamera={handleRetake}
        onRetakeLibrary={handleRetake}
        showContinueButton={location.pathname === "/onboarding-scan"}
        onContinue={
          location.pathname === "/onboarding-scan"
            ? handleSeeTotalSpineScore
            : null
        }
        continueLabel="See Total Spine Score"
      />
    );
  }

  return null;
}