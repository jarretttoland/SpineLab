import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCurrentUser } from "@/lib/useCurrentUser";
import LandmarkGuide from "@/components/posture/LandmarkGuide";
import CaptureScreen from "@/components/posture/CaptureScreen";
import ScanResults from "@/components/posture/ScanResults";
import PhotoConsentGate from "@/components/posture/PhotoConsentGate";
import { analyzePosture, compareTrend } from "@/lib/postureAnalysis";

// Phases: "consent" | "guide" | "capture" | "results"
export default function PostureScan() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [phase, setPhase] = useState("consent");
  const [scanData, setScanData] = useState(null);
  const [detectionFailed, setDetectionFailed] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: previousScans } = useQuery({
    queryKey: ["postureScans", user?.email],
    queryFn: () => base44.entities.PostureScan.filter({ created_by: user.email }, "-created_date", 5),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];

  const handleImageAccepted = async (imageUrl, keyLandmarks) => {
    if (!keyLandmarks || Object.keys(keyLandmarks).length === 0) {
      setDetectionFailed(true);
      setPhase("results");
      return;
    }

    const { findings, overallScore, summary, pattern, subscores, debug: debugInfo } = analyzePosture(keyLandmarks, 1, 1.5, true);

    let trend = null;
    if (previousScans.length > 0) {
      const normalizedPrev = (previousScans[0]?.issues || []).map((f) => ({
        severity: f.severity === "high" ? "notable" : f.severity === "medium" ? "moderate" : "mild",
      }));
      trend = compareTrend(findings, normalizedPrev);
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const newScore = Math.min(100, (profile?.spine_score || 50) + Math.round((overallScore - 70) / 10));

    await base44.entities.PostureScan.create({
      image_url: imageUrl,
      issues: findings.map((f) => ({
        label: f.label,
        severity: f.severity === "notable" ? "high" : f.severity === "moderate" ? "medium" : "low",
      })),
      landmarks_detected: ["ear", "shoulder", "hip", "knee", "ankle"],
      quality_score: overallScore,
      scan_date: today,
      notes: summary,
    });

    if (profile) {
      await base44.entities.UserProfile.update(profile.id, {
        scan_results: findings.filter((f) => f.severity !== "good").map((f) => f.id),
        scan_image_url: imageUrl,
        spine_score: newScore,
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["postureScans", user?.email] });
    }

    const COLORS = { ear: "#3b82f6", shoulder: "#8b5cf6", hip: "#10b981", knee: "#ef4444", ankle: "#f59e0b" };
    const LABELS = { ear: "Ear", shoulder: "Shoulder", hip: "Hip", knee: "Knee", ankle: "Ankle" };
    const LM_IDS = ["ear", "shoulder", "hip", "knee", "ankle"];
    const displayLandmarks = LM_IDS
      .filter((id) => keyLandmarks[id])
      .map((id) => ({
        id,
        label: LABELS[id],
        color: COLORS[id],
        normX: keyLandmarks[id].x,
        normY: keyLandmarks[id].y,
      }));

    setDetectionFailed(false);
    setScanData({ imageUrl, landmarks: displayLandmarks, findings, overallScore, summary, pattern, trend, scanDate: today, subscores, debugInfo });
    setPhase("results");
  };

  const handleNewScan = () => {
    setScanData(null);
    setDetectionFailed(false);
    setPhase("consent");
  };

  const handleRetake = () => {
    setScanData(null);
    setDetectionFailed(false);
    setPhase("capture");
  };

  if (phase === "consent") {
    return <PhotoConsentGate onConsentGiven={() => setPhase("guide")} />;
  }

  if (phase === "guide") {
    return <LandmarkGuide onCamera={() => setPhase("capture")} />;
  }

  if (phase === "capture") {
    return (
      <CaptureScreen
        onAccepted={handleImageAccepted}
        onBack={() => setPhase("guide")}
      />
    );
  }

  if (phase === "results") {
    return (
      <ScanResults
        imageUrl={scanData?.imageUrl}
        landmarks={scanData?.landmarks}
        findings={scanData?.findings}
        overallScore={scanData?.overallScore}
        summary={scanData?.summary}
        pattern={scanData?.pattern}
        trend={scanData?.trend}
        scanDate={scanData?.scanDate}
        subscores={scanData?.subscores}
        debugInfo={scanData?.debugInfo}
        detectionFailed={detectionFailed}
        onNewScan={handleNewScan}
        onRetakeCamera={handleRetake}
        onRetakeLibrary={handleRetake}
      />
    );
  }

  return null;
}