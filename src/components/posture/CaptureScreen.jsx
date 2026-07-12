// FILE: src/components/posture/CaptureScreen.jsx
// Major redesign of the camera screen:
//   - Camera is now FULL-BLEED (fixed inset-0) so it fills the entire screen
//     in both /onboarding-scan and /scan, on every iPhone size
//   - Zoom controls removed (digital zoom isn't useful for posture scans;
//     users just need to stand further back to fit in the frame)
//   - Premium round capture button at the bottom (iOS Camera style)
//   - Floating top bar with back + camera switch buttons
//   - Status banner anchored above the capture button
//   - Route-aware bottom inset: in /scan the capture button sits above the
//     bottom nav; in /onboarding-scan it sits above the safe area
//
// ReviewStep, ProcessingView and the orchestrator stay unchanged.

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  SwitchCamera,
  ArrowLeft,
} from "lucide-react";
import { uploadPostureScanImage } from "@/lib/postureScanSupabase";
import * as MediaPipeLib from "@/lib/mediapipe";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

// ───────────────────────────────────────────────────────────
// Capacitor helpers
// ───────────────────────────────────────────────────────────

/** True when running inside the Capacitor iOS/Android shell. */
function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform?.());
}

/** Lazy import of @capacitor-community/camera-preview. */
async function getCameraPreview() {
  const mod = await import("@capacitor-community/camera-preview");
  return mod.CameraPreview;
}

/** Convert a base64 JPEG string (no data-URL prefix) to a File. */
function base64ToFile(b64, filename = "posture-capture.jpg") {
  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new File([bytes], filename, { type: "image/jpeg" });
}

const COUNTDOWN_SECONDS = 5;
const EVAL_INTERVAL_MS  = 200;
const NATIVE_EVAL_MS    = 300; // native bridge has some latency
const NATIVE_STABILITY  = 5;   // ~1.5 s of stable pose before countdown fires
const READY_STABILITY_FRAMES = 7; // ~1.4 s at 200 ms intervals before countdown fires

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

function objectContainLayout(natW, natH, boxW, boxH) {
  const scale = Math.min(boxW / natW, boxH / natH);
  const imgW = natW * scale;
  const imgH = natH * scale;
  const imgX = (boxW - imgW) / 2;
  const imgY = (boxH - imgH) / 2;
  return { imgX, imgY, imgW, imgH };
}

function evaluateReadiness(lm) {
  if (!lm || lm.length < 25) {
    return { state: "no_person", hint: "Step into frame — show your full side profile" };
  }

  const vis = (pt) => pt?.visibility ?? 0;

  // Use the best-visible side for each joint
  const sho = Math.max(vis(lm[11]), vis(lm[12]));
  const hip = Math.max(vis(lm[23]), vis(lm[24]));
  const ear = Math.max(vis(lm[7]),  vis(lm[8]));

  // Meaningful detection threshold — avoids false positives from background objects
  if (sho < 0.35 || hip < 0.35) {
    return { state: "no_person", hint: "Step into frame — show your full side profile" };
  }

  // Body is partially visible but not yet well-positioned
  if (sho < 0.55 || hip < 0.55) {
    return { state: "detected", hint: "Good — back up a little so your full body is visible" };
  }

  // Body looks good but ear not yet visible
  if (ear < 0.25) {
    return { state: "almost", hint: "Almost there — turn slightly so your ear is visible" };
  }

  return { state: "ready", hint: "Perfect — hold still" };
}

// ───────────────────────────────────────────────────────────
// Camera overlay — silhouette guide on top of viewfinder
// preserveAspectRatio="slice" so it fills the full-bleed camera
// ───────────────────────────────────────────────────────────

function CameraOverlay({ readinessState }) {
  const stroke =
    readinessState === "ready"
      ? "rgba(52,211,153,0.95)"
      : readinessState === "almost"
      ? "rgba(251,191,36,0.90)"
      : readinessState === "detected"
      ? "rgba(147,197,253,0.90)"
      : "rgba(255,255,255,0.55)";

  const earColor = "#3b82f6";
  const shoulderColor = "#8b5cf6";
  const hipColor = "#10b981";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 300 530"
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M14 38 L14 14 L38 14" />
        <path d="M262 14 L286 14 L286 38" />
        <path d="M14 492 L14 516 L38 516" />
        <path d="M262 516 L286 516 L286 492" />
      </g>

      <line x1="150" y1="40" x2="150" y2="490"
        stroke={stroke} strokeWidth="1" strokeDasharray="4,7" opacity="0.35" />

      <g fill="none" stroke={stroke} strokeLinecap="round" opacity="0.32">
        <ellipse cx="162" cy="80" rx="22" ry="26" strokeWidth="1.5" />
        <path d="M156 106 Q154 118 152 132" strokeWidth="6" />
        <path d="M138 132 Q128 200 134 280" strokeWidth="18" opacity="0.55" />
        <path d="M150 280 Q151 360 153 420" strokeWidth="14" opacity="0.55" />
        <path d="M150 420 Q155 460 175 458" strokeWidth="2" />
      </g>

      <g>
        <circle cx="180" cy="78" r="13" fill={`${earColor}1F`} stroke={earColor} strokeWidth="2" />
        <circle cx="180" cy="78" r="4" fill={earColor} />
        <text x="201" y="82" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="700" letterSpacing="1">EAR</text>
      </g>
      <g>
        <circle cx="138" cy="135" r="13" fill={`${shoulderColor}1F`} stroke={shoulderColor} strokeWidth="2" />
        <circle cx="138" cy="135" r="4" fill={shoulderColor} />
        <text x="119" y="139" textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="700" letterSpacing="1">SHOULDER</text>
      </g>
      <g>
        <circle cx="148" cy="280" r="13" fill={`${hipColor}1F`} stroke={hipColor} strokeWidth="2" />
        <circle cx="148" cy="280" r="4" fill={hipColor} />
        <text x="169" y="284" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="700" letterSpacing="1">HIP</text>
      </g>
    </svg>
  );
}

function CountdownDisplay({ seconds }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        key={seconds}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-28 h-28 rounded-full bg-black/60 backdrop-blur-md border-4 border-emerald-400 flex items-center justify-center"
      >
        <span className="text-6xl font-black text-emerald-400">{seconds}</span>
      </motion.div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Premium native-camera overlays
// ───────────────────────────────────────────────────────────

/** Four corner L-brackets that glow green when the pose is ready. */
function CornerBrackets({ readinessState }) {
  const isReady  = readinessState === "ready";
  const isAlmost = readinessState === "almost";
  const color  = isReady  ? "#34d399" : isAlmost ? "#fbbf24" : "rgba(255,255,255,0.72)";
  const glow   = isReady  ? "0 0 14px #34d39988, 0 0 4px #34d399cc" : "none";
  const ARM = 38, THICK = 3.5, PAD = 28;

  const lineBase = {
    position: "absolute",
    background: color,
    boxShadow: glow,
    borderRadius: THICK,
    transition: "background 0.35s ease, box-shadow 0.35s ease",
  };

  const corners = [
    // [ container, h-arm, v-arm ]
    [{ top: PAD, left: PAD },     { top: 0, left: 0, width: ARM, height: THICK }, { top: 0, left: 0, width: THICK, height: ARM }],
    [{ top: PAD, right: PAD },    { top: 0, right: 0, width: ARM, height: THICK }, { top: 0, right: 0, width: THICK, height: ARM }],
    [{ bottom: PAD, left: PAD },  { bottom: 0, left: 0, width: ARM, height: THICK }, { bottom: 0, left: 0, width: THICK, height: ARM }],
    [{ bottom: PAD, right: PAD }, { bottom: 0, right: 0, width: ARM, height: THICK }, { bottom: 0, right: 0, width: THICK, height: ARM }],
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {corners.map(([cPos, hPos, vPos], i) => (
        <div key={i} style={{ position: "absolute", width: ARM, height: ARM, ...cPos }}>
          <div style={{ ...lineBase, ...hPos }} />
          <div style={{ ...lineBase, ...vPos }} />
        </div>
      ))}
    </div>
  );
}

/** SVG ring countdown with animated arc + large centered number. */
function CountdownRing({ seconds, total = COUNTDOWN_SECONDS }) {
  const R            = 68;
  const circumference = 2 * Math.PI * R;
  const dashOffset    = circumference * (1 - seconds / total);

  return (
    <div style={{ position: "relative", width: 176, height: 176 }}>
      {/* Ring SVG */}
      <svg
        width="176"
        height="176"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle cx="88" cy="88" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
        <motion.circle
          cx="88" cy="88" r={R}
          fill="none"
          stroke="#34d399"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ filter: "drop-shadow(0 0 9px #34d399aa)" }}
        />
      </svg>
      {/* Number */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={seconds}
            initial={{ scale: 1.45, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
              textShadow: "0 2px 24px rgba(0,0,0,0.55)",
            }}
          >
            {seconds}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Review step (unchanged)
// ───────────────────────────────────────────────────────────

function ReviewStep({
  preview,
  capturedDims,
  qualityResult,
  landmarks,
  onLandmarksChange,
  onAccept,
  onRetake,
  onBack,
  uploading,
  uploadError,
}) {
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const draggingRef = useRef(null);
  const landmarksRef = useRef(landmarks);
  const [layout, setLayout] = useState(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  const computeLayout = useCallback(() => {
    const box = boxRef.current;
    const img = imgRef.current;
    if (!box || !img || !capturedDims) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const { imgX, imgY, imgW, imgH } = objectContainLayout(
      capturedDims.w,
      capturedDims.h,
      boxW,
      boxH
    );
    setLayout({ imgX, imgY, imgW, imgH });
  }, [capturedDims]);

  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(computeLayout);
    ro.observe(boxRef.current);
    computeLayout();
    return () => ro.disconnect();
  }, [computeLayout]);

  const normToPx = (normX, normY) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: layout.imgX + normX * layout.imgW,
      y: layout.imgY + normY * layout.imgH,
    };
  };

  const pxToNorm = (pxX, pxY) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (pxX - layout.imgX) / layout.imgW)),
      y: Math.max(0, Math.min(1, (pxY - layout.imgY) / layout.imgH)),
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      const id = draggingRef.current;
      if (!id || !boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const pxX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const pxY = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
      const norm = pxToNorm(pxX, pxY);
      const next = landmarksRef.current.map((lm) =>
        lm.id === id ? { ...lm, normX: norm.x, normY: norm.y } : lm
      );
      onLandmarksChange(next);
    };
    const handleUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null;
        forceRender((n) => n + 1);
      }
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [onLandmarksChange]);

  const handlePointerDown = (e, id) => {
    e.preventDefault();
    draggingRef.current = id;
    forceRender((n) => n + 1);
  };

  const avgNormX =
    landmarks.length > 0
      ? landmarks.reduce((s, l) => s + l.normX, 0) / landmarks.length
      : null;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="px-6 pt-2 pb-3 flex-shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1">Review</p>
        <h1 className="text-[22px] font-bold tracking-tight leading-tight">Take a look</h1>
        {qualityResult?.pass && (
          <p className="text-xs text-muted-foreground mt-0.5">Drag any dot to fine-tune the landmarks.</p>
        )}
      </div>

      <div
        ref={boxRef}
        className="relative mx-4 rounded-3xl overflow-hidden bg-black flex-1"
        style={{ minHeight: 300 }}
      >
        <img
          ref={imgRef}
          src={preview}
          alt="Posture capture"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain" }}
          onLoad={computeLayout}
        />

        {qualityResult?.pass && layout && landmarks.length > 0 && (
          <div className="absolute inset-0" style={{ touchAction: "none" }}>
            {avgNormX !== null && (() => {
              const lx = layout.imgX + avgNormX * layout.imgW;
              const y1 = layout.imgY;
              const y2 = layout.imgY + layout.imgH;
              return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1={lx} y1={y1} x2={lx} y2={y2}
                    stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="8,5" opacity="0.45" />
                </svg>
              );
            })()}

            {landmarks.map((d) => {
              const { x, y } = normToPx(d.normX, d.normY);
              const isDragging = draggingRef.current === d.id;
              return (
                <div
                  key={d.id}
                  onPointerDown={(e) => handlePointerDown(e, d.id)}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
                    transition: "transform 120ms ease",
                    touchAction: "none",
                    zIndex: 10,
                  }}
                >
                  <div style={{
                    position: "absolute", width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: d.color, opacity: 0.18, top: -16, left: -16,
                  }} />
                  <div style={{
                    position: "absolute", width: 14, height: 14, borderRadius: "50%",
                    backgroundColor: d.color, border: "2.5px solid white",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.55)", top: -7, left: -7,
                  }} />
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {qualityResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-sm ${
                qualityResult.pass ? "bg-emerald-700/88" : "bg-rose-800/88"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {qualityResult.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                )}
                <p className="text-white text-sm font-medium leading-snug">
                  {qualityResult.pass
                    ? "Landmarks look good — ready for analysis"
                    : qualityResult.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {uploadError && (
        <div className="mx-4 mt-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 leading-snug">{uploadError}</p>
        </div>
      )}

      <div className="px-6 pt-4 pb-4 space-y-3 flex-shrink-0">
        {qualityResult?.pass ? (
          <Button
            onClick={() => { hapticSuccess(); onAccept(); }}
            disabled={uploading}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Looks Good — Continue
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onAccept}
            disabled={uploading}
            variant="outline"
            className="w-full h-12 rounded-2xl gap-2 font-semibold text-sm"
          >
            Use This Photo Anyway
          </Button>
        )}
        <Button
          variant={qualityResult?.pass ? "outline" : "default"}
          onClick={onRetake}
          disabled={uploading}
          className="w-full h-12 rounded-2xl gap-2 font-semibold"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={uploading}
          className="w-full h-10 text-muted-foreground text-sm"
        >
          ← Back
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Processing view (unchanged)
// ───────────────────────────────────────────────────────────

const PROCESS_STAGES = [
  { key: "detect", label: "Finding your posture…" },
  { key: "validate", label: "Checking the landmarks…" },
  { key: "analyze", label: "Preparing your results…" },
];

// Shown after the user taps "Looks Good — Continue", while the parent
// (PostureScan.handleImageAccepted) uploads the photo, runs the AI summary,
// and saves the scan. Keeping the user on a live progress screen here — instead
// of letting the Review button's spinner clear and going idle — is what
// removes the "dead" gap before results appear.
const SAVE_STAGES = [
  { key: "upload", label: "Uploading your photo…" },
  { key: "analyze", label: "Analyzing your posture…" },
  { key: "save", label: "Saving your results…" },
];

function ProcessingView({ stage, stages = PROCESS_STAGES, title = "Analyzing your posture" }) {
  const idx = Math.max(0, stages.findIndex((s) => s.key === stage));
  const label = stages[idx]?.label ?? "Preparing your results…";
  const progress = ((idx + 1) / stages.length) * 100;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-5 bg-background">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <div className="text-center">
        <p className="font-bold text-lg mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Native camera capture — Snapchat-style live preview
//
// Uses @capacitor-community/camera-preview with toBack:true so the
// native camera renders BEHIND the transparent WebView. We overlay a
// premium pose-detection UI on top. Once ear + shoulder + hip are
// detected for NATIVE_STABILITY consecutive frames the 5-second
// countdown fires automatically and the final photo is captured.
//
// Front camera opens first. Camera flip available at any time.
// No distance constraints — works at 5–12 ft.
// ───────────────────────────────────────────────────────────

function NativeCameraCapture({ onFileReady, onBack }) {
  // phase: "starting" | "live" | "countdown" | "capturing" | "error"
  const [phase, setPhase]               = useState("starting");
  const [readinessState, setReadinessState] = useState("no_person");
  const [hint, setHint]                 = useState("Stand sideways — show your side profile");
  const [countdown, setCountdown]       = useState(null);
  const [errorMsg, setErrorMsg]         = useState(null);
  // If the native camera-preview bridge times out, fall back to getUserMedia
  const [useFallback, setUseFallback]   = useState(false);

  const mountedRef         = useRef(true);
  const evalTimerRef       = useRef(null);
  const cdIntervalRef      = useRef(null);
  const countdownActiveRef = useRef(false);
  const stableFramesRef    = useRef(0);
  const evalBusyRef        = useRef(false);
  const cpRef              = useRef(null);
  const facingRef          = useRef("front");

  // ── Make WebView background transparent so native camera shows through ──
  useEffect(() => {
    const targets = [
      document.documentElement,
      document.body,
      document.getElementById("root"),
      document.querySelector(".app-shell"),
    ].filter(Boolean);

    targets.forEach((el) => el.style.setProperty("background", "transparent", "important"));
    return ()   => targets.forEach((el) => el.style.removeProperty("background"));
  }, []);

  // ── Restore backgrounds when falling back to web camera ──────────────
  useEffect(() => {
    if (!useFallback) return;
    [
      document.documentElement,
      document.body,
      document.getElementById("root"),
      document.querySelector(".app-shell"),
    ]
      .filter(Boolean)
      .forEach((el) => el.style.removeProperty("background"));
  }, [useFallback]);

  // ── Mount / unmount ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    launchPreview("front");
    return () => {
      mountedRef.current = false;
      killPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────
  function killPreview() {
    clearInterval(evalTimerRef.current);
    clearInterval(cdIntervalRef.current);
    const cp = cpRef.current;
    if (cp) { cpRef.current = null; cp.stop().catch(() => {}); }
  }

  async function launchPreview(position) {
    killPreview();
    setPhase("starting");
    setReadinessState("no_person");
    setHint("Stand sideways — show your side profile");
    setCountdown(null);
    countdownActiveRef.current = false;
    stableFramesRef.current    = 0;
    evalBusyRef.current        = false;

    try {
      const CP = await getCameraPreview();
      if (!mountedRef.current) return;

      cpRef.current     = CP;
      facingRef.current = position;

      // Race CP.start() against an 8-second timeout.
      // If the native bridge never responds (plugin not synced / no native
      // handler registered), we fall back to the web getUserMedia camera
      // rather than spinning forever.
      await Promise.race([
        CP.start({
          position,
          toBack:                       true,
          enableOpacity:                true,
          rotateWhenOrientationChanged: false,
          width:  Math.round(window.screen.width),
          height: Math.round(window.screen.height),
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("camera_preview_timeout")),
            8000
          )
        ),
      ]);

      if (!mountedRef.current) { CP.stop().catch(() => {}); return; }

      // Load MediaPipe while camera warms up
      await MediaPipeLib.getLandmarker();
      if (!mountedRef.current) { CP.stop().catch(() => {}); return; }

      setPhase("live");
      runEvalLoop(CP);
    } catch (err) {
      console.error("[NativeCamera] start error:", err);
      if (!mountedRef.current) return;

      if (err?.message === "camera_preview_timeout") {
        // Native bridge hung — fall back to the web camera (getUserMedia).
        // This always works in WKWebView on iOS 14.3+.
        console.warn("[NativeCamera] bridge timeout — falling back to web camera");
        cpRef.current = null;
        setUseFallback(true);
      } else {
        setErrorMsg(
          "Camera couldn't start. Open Settings → SpineLab → Camera, grant access, then tap Retry."
        );
        setPhase("error");
      }
    }
  }

  function runEvalLoop(CP) {
    clearInterval(evalTimerRef.current);

    evalTimerRef.current = setInterval(async () => {
      if (!mountedRef.current || evalBusyRef.current) return;
      evalBusyRef.current = true;

      try {
        const sample = await CP.captureSample({ quality: 40 });
        if (!sample?.value || !mountedRef.current) return;

        const imgEl  = await MediaPipeLib.loadImageElement(`data:image/jpeg;base64,${sample.value}`);
        const result = await MediaPipeLib.detectPose(imgEl);
        // detectPose may return array-of-arrays (multi-person) or a flat landmark array
        const rawLm  = result?.landmarks;
        const lm     = Array.isArray(rawLm?.[0]) ? rawLm[0] : (rawLm ?? null);
        const ev     = evaluateReadiness(lm);

        if (!mountedRef.current) return;

        setReadinessState(ev.state);
        setHint(ev.hint);

        if (ev.state === "ready") {
          stableFramesRef.current += 1;
          if (stableFramesRef.current >= NATIVE_STABILITY && !countdownActiveRef.current) {
            launchCountdown(CP);
          }
        } else {
          stableFramesRef.current = 0;
          if (countdownActiveRef.current) abortCountdown();
        }
      } catch (_) {
        // transient frame error — ignore
      } finally {
        evalBusyRef.current = false;
      }
    }, NATIVE_EVAL_MS);
  }

  function launchCountdown(CP) {
    if (countdownActiveRef.current) return;
    countdownActiveRef.current = true;
    setPhase("countdown");

    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);

    hapticLight(); // first tick
    cdIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) { clearInterval(cdIntervalRef.current); return; }
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(cdIntervalRef.current);
        clearInterval(evalTimerRef.current); // stop sampling before final capture
        setCountdown(null);
        hapticSuccess(); // shutter moment
        finalCapture(CP);
      } else {
        hapticLight(); // each tick
        setCountdown(remaining);
      }
    }, 1000);
  }

  function abortCountdown() {
    clearInterval(cdIntervalRef.current);
    countdownActiveRef.current = false;
    stableFramesRef.current    = 0;
    setCountdown(null);
    setPhase("live");
  }

  async function finalCapture(CP) {
    setPhase("capturing");
    try {
      const photo = await CP.capture({ quality: 90 });
      await CP.stop();
      cpRef.current = null;

      const file   = base64ToFile(photo.value);
      const objUrl = URL.createObjectURL(file);
      const dims   = await new Promise((resolve) => {
        const img    = new Image();
        img.onload   = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(objUrl); };
        img.onerror  = () => { resolve(null); URL.revokeObjectURL(objUrl); };
        img.src      = objUrl;
      });

      if (mountedRef.current) onFileReady(file, dims);
    } catch (err) {
      console.error("[NativeCamera] capture error:", err);
      if (mountedRef.current) {
        setErrorMsg("Couldn't take the photo. Tap Retry to try again.");
        setPhase("error");
        countdownActiveRef.current = false;
      }
    }
  }

  async function handleFlip() {
    if (!cpRef.current || phase === "capturing" || phase === "starting") return;
    const newPos = facingRef.current === "front" ? "rear" : "front";
    await launchPreview(newPos);
  }

  // ── Fallback: native bridge timed out — use web getUserMedia camera ──
  if (useFallback) {
    return <CameraCapture onFileReady={onFileReady} onBack={onBack} />;
  }

  // ── Error screen ─────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 gap-5 bg-background">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl mb-2">Camera unavailable</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{errorMsg}</p>
        </div>
        <Button
          onClick={() => launchPreview("front")}
          className="h-14 px-8 rounded-2xl text-base font-semibold gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Retry
        </Button>
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          ← Go Back
        </Button>
      </div>
    );
  }

  // ── Capture flash + spinner ───────────────────────────────────────────
  if (phase === "capturing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "transparent" }}>
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 bg-white pointer-events-none"
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-white animate-spin drop-shadow-lg" />
          <p className="text-white font-semibold text-base drop-shadow">Capturing…</p>
        </div>
      </div>
    );
  }

  // Status pill config
  const statusMap = {
    no_person: { label: "Get into frame",  bg: "rgba(0,0,0,0.65)" },
    detected:  { label: "Adjust position", bg: "rgba(30,64,175,0.85)" },
    almost:    { label: "Almost there",    bg: "rgba(146,64,14,0.88)" },
    ready:     { label: "Hold still",      bg: "rgba(6,95,70,0.90)" },
  };
  const sc = statusMap[readinessState] ?? statusMap.no_person;

  // ── Main overlay (starting / live / countdown) ────────────────────────
  return (
    <div className="fixed inset-0 z-40" style={{ background: "transparent" }}>

      {/* Corner L-brackets */}
      <CornerBrackets readinessState={readinessState} />

      {/* Starting scrim + spinner */}
      <AnimatePresence>
        {phase === "starting" && (
          <motion.div
            key="starting-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.62)" }}
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-white/80 text-sm font-medium tracking-wide">Starting camera…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown ring */}
      <AnimatePresence>
        {phase === "countdown" && countdown !== null && (
          <motion.div
            key="countdown-ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <CountdownRing seconds={countdown} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar — back + flip buttons */}
      <div
        className="absolute top-0 left-0 right-0 z-50 px-5 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)", paddingBottom: 12 }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ background: "rgba(0,0,0,0.42)" }}
          className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform duration-150"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleFlip}
          aria-label="Flip camera"
          style={{ background: "rgba(0,0,0,0.42)" }}
          className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform duration-150"
        >
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Status pill — bottom */}
      <AnimatePresence mode="wait">
        {phase !== "starting" && (
          <motion.div
            key={readinessState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="absolute left-4 right-4 z-50"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 48px)" }}
          >
            <div
              className="rounded-2xl px-4 py-3 backdrop-blur-md shadow-xl"
              style={{ background: sc.bg }}
            >
              <div className="text-white text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5">
                {sc.label}
              </div>
              <div className="text-white/90 text-sm leading-snug">{hint}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Camera view — full-bleed, native-feeling
// ───────────────────────────────────────────────────────────

function CameraCapture({ onFileReady, onBack }) {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding-scan";

  const videoRef = useRef(null);
  const captureCanvas = useRef(null);
  const evalCanvas = useRef(document.createElement("canvas")); // frame grab for pose detection
  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const evalTimer = useRef(null);
  const countdownRef = useRef(null);
  const countdownActive = useRef(false);
  const didCapture = useRef(false);
  const mountedRef = useRef(true);
  const readyStreak = useRef(0);

  const [facingMode, setFacingMode] = useState("user");
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [mpError, setMpError] = useState(null);
  const [mpReady, setMpReady] = useState(false);
  const [readinessState, setReadinessState] = useState("no_person");
  const [hint, setHint] = useState("Step into the frame");
  const [countdown, setCountdown] = useState(null);
  const [flashFrame, setFlashFrame] = useState(false);
  const [evalTick, setEvalTick]     = useState(0); // increments each eval cycle

  const isFront = facingMode === "user";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode) => {
      clearInterval(evalTimer.current);
      clearInterval(countdownRef.current);
      countdownActive.current = false;
      readyStreak.current = 0;

      stopCamera();

      setCamReady(false);
      setCamError(null);
      didCapture.current = false;
      setReadinessState("no_person");
      setHint("Step into the frame");
      setCountdown(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // No explicit width/height — let iOS use its native camera resolution
          // so it returns a portrait stream directly. Specifying dimensions
          // causes iOS to give a landscape stream that gets zoomed by objectFit.
          video: { facingMode: { ideal: mode } },
          audio: false,
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCamReady(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCamError(
          "Camera access is off. Open Settings → SpineLab and turn on Camera."
        );
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    startCamera(facingMode);

    // Only the IMAGE landmarker is needed — the eval loop draws each video
    // frame to a canvas and calls detectPose() (IMAGE mode) directly.
    // This bypasses the VIDEO mode landmarker which silently fails in
    // WKWebView on iOS due to GPU delegate / timestamp ordering issues.
    MediaPipeLib.getLandmarker()
      .then(() => {
        if (mountedRef.current) setMpReady(true);
      })
      .catch((err) => {
        console.error("MediaPipe load failed:", err);
        if (mountedRef.current) {
          setMpError(
            "We couldn't start the scan engine. Check your connection and try again."
          );
        }
      });

    return () => {
      stopCamera();
      clearInterval(evalTimer.current);
      clearInterval(countdownRef.current);
    };
  }, [facingMode, startCamera, stopCamera]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const doCapture = useCallback(() => {
    if (didCapture.current || !mountedRef.current) return;
    didCapture.current = true;

    clearInterval(evalTimer.current);
    clearInterval(countdownRef.current);

    const video = videoRef.current;
    const canvas = captureCanvas.current;
    if (!video || !canvas) return;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (!srcW || !srcH) return;

    // Capture the FULL camera frame at native resolution — no zoom, no crop.
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext("2d");

    if (isFront) {
      ctx.save();
      ctx.translate(srcW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, srcW, srcH);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, srcW, srcH);
    }

    setFlashFrame(true);
    setTimeout(() => setFlashFrame(false), 220);

    canvas.toBlob(
      (blob) => {
        if (!blob || !mountedRef.current) return;
        onFileReady(
          new File([blob], "posture-capture.jpg", { type: "image/jpeg" }),
          { w: srcW, h: srcH }
        );
      },
      "image/jpeg",
      0.93
    );
  }, [isFront, onFileReady]);

  const startCountdown = useCallback(() => {
    if (countdownActive.current) return;

    countdownActive.current = true;
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;

    countdownRef.current = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(countdownRef.current);
        return;
      }
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownActive.current = false;
        setCountdown(null);
        doCapture();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [doCapture]);

  const cancelCountdown = useCallback(() => {
    if (!countdownActive.current) return;
    clearInterval(countdownRef.current);
    countdownActive.current = false;
    setCountdown(null);
  }, []);

  useEffect(() => {
    if (!camReady || !mpReady) return;

    const busy = { current: false };

    evalTimer.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || didCapture.current) return;
      if (busy.current) return; // don't overlap async calls
      busy.current = true;

      let result = { state: "no_person", hint: "Step into frame — show your full side" };

      try {
        // Grab the video frame at 320×240 — small enough that CPU-mode
        // MediaPipe finishes in <50 ms without blocking the main thread.
        const canvas = evalCanvas.current;
        const w = video.videoWidth  || 640;
        const h = video.videoHeight || 480;
        const EVAL_W = 320;
        const EVAL_H = Math.round((h / w) * EVAL_W);
        canvas.width  = EVAL_W;
        canvas.height = EVAL_H;
        canvas.getContext("2d").drawImage(video, 0, 0, EVAL_W, EVAL_H);
        const detected = await MediaPipeLib.detectPose(canvas);
        result = evaluateReadiness(detected?.landmarks ?? null);
      } catch (e) {
        // "no_person_detected" is normal — keep result as no_person
        if (e?.message !== "no_person_detected") {
          console.warn("[eval]", e?.message);
        }
      } finally {
        busy.current = false;
      }

      if (!mountedRef.current) return;

      setEvalTick((n) => n + 1); // heartbeat — proves the loop is running
      setReadinessState(result.state);
      setHint(result.hint);

      if (result.state === "ready") {
        readyStreak.current += 1;
        if (readyStreak.current >= READY_STABILITY_FRAMES) {
          startCountdown();
        }
      } else {
        readyStreak.current = 0;
        cancelCountdown();
      }
    }, EVAL_INTERVAL_MS);

    return () => clearInterval(evalTimer.current);
  }, [camReady, mpReady, startCountdown, cancelCountdown]);

  const statusMap = {
    no_person: { label: "Get into frame",  bg: "rgba(0,0,0,0.65)" },
    detected:  { label: "Adjust position", bg: "rgba(30,64,175,0.85)" },
    almost:    { label: "Almost there",    bg: "rgba(146,64,14,0.88)" },
    ready:     { label: "Hold still",      bg: "rgba(6,95,70,0.90)" },
  };
  const sc = statusMap[readinessState] ?? statusMap.no_person;

  if (mpError) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-4 bg-background">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <div className="text-center max-w-sm">
          <p className="font-bold text-lg mb-1">Can't start scan</p>
          <p className="text-sm text-muted-foreground">{mpError}</p>
        </div>
        <Button onClick={onBack} variant="outline" className="rounded-2xl h-12 px-6">
          Go back
        </Button>
      </div>
    );
  }

  // Bottom inset:
  //  - /scan (post-login): leave room for the Layout bottom nav (~80px)
  //  - /onboarding-scan: just the safe area
  const captureBottom = isOnboarding
    ? "calc(env(safe-area-inset-bottom) + 32px)"
    : "calc(env(safe-area-inset-bottom) + 100px)";
  const statusBottom = isOnboarding
    ? "calc(env(safe-area-inset-bottom) + 150px)"
    : "calc(env(safe-area-inset-bottom) + 220px)";

  return (
    <div className="fixed inset-0 bg-black z-30">
      {/* Camera preview — full screen */}
      <div ref={viewfinderRef} className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover",
            transform: isFront ? "scaleX(-1)" : "none",
          }}
          playsInline
          muted
          autoPlay
        />

        <CornerBrackets readinessState={readinessState} />

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 18, stiffness: 260 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <CountdownRing seconds={countdown} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {flashFrame && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Top bar — floating overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-20 px-5 flex items-center justify-between"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 8px)",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={toggleCamera}
          aria-label="Switch camera"
          className="w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>

      {/* Status pill — floats above the capture button */}
      <AnimatePresence mode="wait">
        <motion.div
          key={readinessState}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="absolute left-4 right-4 z-20"
          style={{ bottom: statusBottom }}
        >
          <div
            className="rounded-2xl px-4 py-3 backdrop-blur-md shadow-xl"
            style={{ background: sc.bg }}
          >
            <div className="text-white text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5">
              {sc.label}
            </div>
            <div className="text-white/90 text-sm leading-snug">{camError || hint}</div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Capture button — round, iOS-style, anchored to bottom */}
      <div
        className="absolute left-0 right-0 z-20 flex justify-center"
        style={{ bottom: captureBottom }}
      >
        <button
          onClick={doCapture}
          aria-label="Capture"
          className="w-20 h-20 rounded-full bg-white active:scale-95 transition-transform duration-150 flex items-center justify-center shadow-2xl"
        >
          <div className="w-[68px] h-[68px] rounded-full border-[3px] border-black/15 bg-white" />
        </button>
      </div>

      <canvas ref={captureCanvas} className="hidden" />
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Orchestrator (unchanged)
// ───────────────────────────────────────────────────────────

export default function CaptureScreen({ onAccepted, onBack, userId }) {
  const [uiState, setUiState] = useState("capture");
  const [processStage, setProcessStage] = useState("detect");
  const [saveStage, setSaveStage] = useState("upload");
  const [preview, setPreview] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [capturedDims, setCapturedDims] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [qualityResult, setQualityResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileReady = useCallback(async (file, dims) => {
    const localPreviewUrl = URL.createObjectURL(file);

    setPreview(localPreviewUrl);
    setCapturedFile(file);
    setCapturedDims(dims ?? null);
    setUiState("processing");
    setProcessStage("detect");
    setUploadError(null);

    let keyLandmarks = null;

    try {
      const imgEl = await MediaPipeLib.loadImageElement(localPreviewUrl);
      const result = await MediaPipeLib.detectPose(imgEl);
      setProcessStage("validate");
      keyLandmarks = MediaPipeLib.extractKeyLandmarks(result.landmarks);
    } catch (err) {
      console.warn("[CaptureScreen] detect error:", err);
      keyLandmarks = null;
    }

    setProcessStage("analyze");
    await new Promise((r) => setTimeout(r, 250));

    if (!keyLandmarks) {
      setQualityResult({
        pass: false,
        message:
          "We couldn't make out your posture clearly. Try again with better lighting or a plain background.",
      });
      setLandmarks([]);
      setUiState("review");
      return;
    }

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

    // Ankle is excluded — it's not needed for posture analysis and MediaPipe
    // frequently extrapolates it off-screen with a plausible but wrong position.
    const dynamic = ["ear", "shoulder", "hip", "knee"]
      .filter((id) => keyLandmarks[id])
      .map((id) => ({
        id,
        label: LABELS[id],
        color: COLORS[id],
        normX: keyLandmarks[id].x,
        normY: keyLandmarks[id].y,
      }));

    setLandmarks(dynamic);
    setQualityResult({ pass: true });
    setUiState("review");
  }, []);

  const handleRetake = useCallback(() => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setCapturedFile(null);
    setCapturedDims(null);
    setLandmarks([]);
    setQualityResult(null);
    setUploadError(null);
    setUiState("capture");
  }, [preview]);

  const handleAccept = useCallback(async () => {
    if (uploading) return;

    setUploading(true);
    setUploadError(null);

    // Switch to a live "saving" screen right away instead of leaving the
    // user on the Review screen once the button's own spinner clears — this
    // is what closes the dead gap before results appear.
    setSaveStage("upload");
    setUiState("saving");

    let publicUrl = preview;
    let storagePath = null;

    // Upload is best-effort. If it fails (bucket policy, network, whatever)
    // we still let the user see their results — we just won't have a remote
    // copy of the photo. The local blob URL stays usable for the session.
    try {
      if (userId && capturedFile) {
        const uploaded = await uploadPostureScanImage(capturedFile, userId);
        publicUrl = uploaded.publicUrl;
        storagePath = uploaded.path;
      }
    } catch (err) {
      console.warn("[CaptureScreen] upload failed, continuing with local preview:", err);
      // Intentionally not setting uploadError or returning — the scan
      // still completes and the user gets their results.
    }

    setSaveStage("analyze");

    let keyLandmarks = {};

    if (qualityResult?.pass && landmarks.length > 0) {
      const lm = (id) => landmarks.find((l) => l.id === id);
      keyLandmarks = {
        ear: lm("ear") ? { x: lm("ear").normX, y: lm("ear").normY, visibility: 1 } : null,
        shoulder: lm("shoulder") ? { x: lm("shoulder").normX, y: lm("shoulder").normY, visibility: 1 } : null,
        hip: lm("hip") ? { x: lm("hip").normX, y: lm("hip").normY, visibility: 1 } : null,
        knee: lm("knee") ? { x: lm("knee").normX, y: lm("knee").normY, visibility: 1 } : null,
        ankle: lm("ankle") ? { x: lm("ankle").normX, y: lm("ankle").normY, visibility: 1 } : null,
      };
    }

    setSaveStage("save");

    // onAccepted (PostureScan.handleImageAccepted) runs the AI summary +
    // Supabase writes and flips the parent to the results screen when it's
    // done. We stay mounted on the "saving" ProcessingView the whole time —
    // no idle state to fall back into — and unmount naturally once the
    // parent's phase changes.
    await onAccepted(publicUrl, keyLandmarks, storagePath);
  }, [uploading, preview, capturedFile, userId, qualityResult, landmarks, onAccepted]);

  if (uiState === "capture") {
    // Always use the getUserMedia web camera for live pose-detection preview.
    // @capacitor-community/camera-preview (toBack:true) requires transparent
    // WKWebView configuration in the iOS AppDelegate and a specific Xcode
    // build setup — too fragile in practice. getUserMedia works reliably in
    // WKWebView on iOS 14.3+ and delivers the same live preview + auto-
    // countdown experience with the premium CornerBrackets / CountdownRing UI.
    return <CameraCapture onFileReady={handleFileReady} onBack={onBack} />;
  }

  if (uiState === "processing") {
    return <ProcessingView stage={processStage} />;
  }

  if (uiState === "saving") {
    return <ProcessingView stage={saveStage} stages={SAVE_STAGES} title="Finishing up" />;
  }

  return (
    <ReviewStep
      preview={preview}
      capturedDims={capturedDims}
      qualityResult={qualityResult}
      landmarks={landmarks}
      onLandmarksChange={setLandmarks}
      onAccept={handleAccept}
      onRetake={handleRetake}
      onBack={onBack}
      uploading={uploading}
      uploadError={uploadError}
    />
  );
}
