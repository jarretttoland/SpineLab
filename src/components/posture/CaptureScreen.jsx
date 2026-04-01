/**
 * CaptureScreen — posture camera with correct image pipeline.
 *
 * PIPELINE DESIGN:
 * ─────────────────────────────────────────────────────────
 * 1. VIDEO PREVIEW
 *    - Video element fills the viewfinder with object-fit:cover
 *    - Front camera is CSS-mirrored for natural selfie look
 *    - Zoom: CSS scale transform on the video (overflow:hidden clips it)
 *      The scale is purely visual in preview; we apply same scale on capture.
 *
 * 2. CAPTURE
 *    - We calculate the exact object-cover crop rect from the raw video frame
 *    - Apply zoom by shrinking that crop rect (zoom in = sample smaller area)
 *    - Draw that exact region to a canvas → this IS what user saw
 *    - Front camera: flip horizontally on canvas (un-mirror) for correct anatomy
 *    - Canvas → Blob → File → upload → MediaPipe analysis
 *
 * 3. ANALYSIS (MediaPipe)
 *    - Runs on the uploaded image (same dimensions as canvas output)
 *    - Returns landmarks normalized [0,1] relative to image pixel dimensions
 *
 * 4. REVIEW DISPLAY
 *    - Show captured image with object-fit:contain (no cropping, full body visible)
 *    - Measure actual rendered image rect using ResizeObserver + naturalWidth/Height
 *    - Landmark coords (normalized [0,1] from MediaPipe) → px = pad + norm * renderedSize
 *    - Dots positioned absolutely in pixels using transform:translate(-50%,-50%)
 *
 * ZOOM:
 *    - CSS transform: scale(zoom) on video for live preview
 *    - Capture: crop(1/zoom) of the cover-cropped region
 *    - No reliance on track.applyConstraints which has poor browser support
 *
 * FRONT CAMERA:
 *    - Video: CSS scaleX(-1) * zoom for mirrored preview
 *    - Capture canvas: horizontally flipped so anatomy is correct
 *    - MediaPipe then sees un-mirrored image → correct left/right landmark coords
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Camera, RotateCcw, CheckCircle2, Loader2, AlertTriangle,
  RefreshCw, ZoomIn, ZoomOut,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as MediaPipeLib from "@/lib/mediapipe";

// ── Constants ──────────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS   = 5;
const EVAL_INTERVAL_MS    = 200;
const VIEWFINDER_ASPECT   = 3 / 4;  // portrait 3:4 (width/height)
const ZOOM_STEPS          = [1.0, 1.3, 1.6, 2.0, 2.5];

// ── Geometry ───────────────────────────────────────────────────────────────
/**
 * Given source size (srcW×srcH) and display box (dstW×dstH),
 * compute the object-cover source crop: { sx, sy, sw, sh }
 * This is the region of the source that is actually visible.
 */
function objectCoverCrop(srcW, srcH, dstW, dstH) {
  const srcAR = srcW / srcH;
  const dstAR = dstW / dstH;
  let sw, sh, sx, sy;
  if (srcAR > dstAR) {
    // source wider → clip left/right
    sh = srcH;
    sw = srcH * dstAR;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    // source taller → clip top/bottom
    sw = srcW;
    sh = srcW / dstAR;
    sx = 0;
    sy = (srcH - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

/**
 * Given an image (natW×natH) displayed object-contain in (boxW×boxH),
 * return the letterbox layout: { imgX, imgY, imgW, imgH }
 * These are the pixel coordinates of the rendered image within the box.
 */
function objectContainLayout(natW, natH, boxW, boxH) {
  const scale = Math.min(boxW / natW, boxH / natH);
  const imgW  = natW * scale;
  const imgH  = natH * scale;
  const imgX  = (boxW - imgW) / 2;
  const imgY  = (boxH - imgH) / 2;
  return { imgX, imgY, imgW, imgH };
}

// ── Readiness evaluator ─────────────────────────────────────────────────────
// Returns { state, hint }
// state: "no_person" | "detected" | "almost" | "ready"
function evaluateReadiness(lm) {
  if (!lm || lm.length < 29) {
    return { state: "no_person", hint: "No person detected — step into frame" };
  }

  const vis  = (pt) => pt?.visibility ?? 0;
  const best = (a, b) => (vis(a) >= vis(b) ? a : b);

  const leftEar   = lm[7];  const rightEar   = lm[8];
  const leftSho   = lm[11]; const rightSho   = lm[12];
  const leftHip   = lm[23]; const rightHip   = lm[24];
  const leftKnee  = lm[25]; const rightKnee  = lm[26];
  const leftAnkle = lm[27]; const rightAnkle = lm[28];
  const nose      = lm[0];

  const ear    = best(leftEar,   rightEar);
  const sho    = best(leftSho,   rightSho);
  const hip    = best(leftHip,   rightHip);
  const knee   = best(leftKnee,  rightKnee);
  const ankle  = best(leftAnkle, rightAnkle);
  const headPt = vis(ear) >= 0.25 ? ear : nose;

  // ── Stage 1: require at least shoulder+hip to say "person detected" ──────
  const MIN_PERSON = 0.30;
  if (vis(sho) < MIN_PERSON || vis(hip) < MIN_PERSON) {
    // Could be a random object — only say "detected" if nose is also visible
    if (vis(nose) < 0.25) {
      return { state: "no_person", hint: "No person detected — step into frame" };
    }
    return { state: "detected", hint: "Person detected — step back so full body is visible" };
  }

  // ── Stage 2: check for key lower body landmarks ───────────────────────────
  const MIN_LOWER = 0.25;
  if (vis(ankle) < MIN_LOWER) {
    if (vis(knee) < MIN_LOWER) {
      return { state: "detected", hint: "Step back — legs not in frame" };
    }
    return { state: "almost", hint: "Step back — feet not visible" };
  }
  if (vis(headPt) < 0.25) {
    return { state: "almost", hint: "Head not visible — raise camera or step back" };
  }
  if (vis(knee) < MIN_LOWER) {
    return { state: "almost", hint: "Keep full body in frame" };
  }

  // ── Stage 3: anatomical order ─────────────────────────────────────────────
  // All key points must be in top-to-bottom order with tolerance
  const TOL = 0.04;
  if (headPt.y > sho.y + TOL) {
    return { state: "almost", hint: "Stand upright — body landmarks out of order" };
  }
  if (sho.y > hip.y + TOL) {
    return { state: "almost", hint: "Stand upright — shoulder above hip required" };
  }
  if (hip.y > knee.y + TOL) {
    return { state: "almost", hint: "Stand upright — hip above knee required" };
  }
  if (knee.y > ankle.y + TOL) {
    return { state: "almost", hint: "Stand upright — knee above ankle required" };
  }

  // ── Stage 4: body span (not too close, not too far) ───────────────────────
  const bodySpan = ankle.y - headPt.y;
  if (bodySpan < 0.38) {
    return { state: "almost", hint: "Move farther back from the camera" };
  }
  if (bodySpan > 1.02) {
    return { state: "almost", hint: "Move slightly closer" };
  }

  // ── Stage 5: side-facing check ─────────────────────────────────────────────
  // In a true side view, both shoulders have very similar x; separation is small
  const shoulderSep = (vis(leftSho) >= 0.2 && vis(rightSho) >= 0.2)
    ? Math.abs(leftSho.x - rightSho.x)
    : 0;

  if (shoulderSep > 0.35) {
    return { state: "almost", hint: "Turn more sideways — rotate 90° to camera" };
  }
  if (shoulderSep > 0.22) {
    return { state: "almost", hint: "Turn a little more sideways" };
  }

  // ── Stage 6: centering ────────────────────────────────────────────────────
  const midX = (sho.x + hip.x) / 2;
  if (midX < 0.08) return { state: "almost", hint: "Move slightly right" };
  if (midX > 0.92) return { state: "almost", hint: "Move slightly left" };

  return { state: "ready", hint: "Hold still — starting countdown" };
}

// ── Silhouette overlay ─────────────────────────────────────────────────────
function CameraOverlay({ readinessState }) {
  const c =
    readinessState === "ready"    ? { stroke: "rgba(52,211,153,0.95)", fill: "rgba(52,211,153,0.12)" } :
    readinessState === "almost"   ? { stroke: "rgba(251,191,36,0.90)",  fill: "rgba(251,191,36,0.10)"  } :
    readinessState === "detected" ? { stroke: "rgba(147,197,253,0.85)", fill: "rgba(147,197,253,0.08)" } :
                                    { stroke: "rgba(255,255,255,0.25)", fill: "rgba(255,255,255,0.04)" };

  const zones = [
    { label: "Head",     cx: 162, cy: 52,  r: 28, color: "rgba(99,179,237,0.7)"   },
    { label: "Shoulder", cx: 122, cy: 122, r: 24, color: "rgba(167,139,250,0.7)"  },
    { label: "Hip",      cx: 146, cy: 262, r: 24, color: "rgba(52,211,153,0.7)"   },
    { label: "Knee",     cx: 150, cy: 366, r: 20, color: "rgba(252,165,165,0.65)" },
    { label: "Ankle",    cx: 153, cy: 452, r: 18, color: "rgba(251,191,36,0.65)"  },
  ];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 300 530" preserveAspectRatio="xMidYMid meet">
      {/* Border */}
      <rect x="8" y="4" width="284" height="522" rx="18"
        fill="none" stroke={c.stroke} strokeWidth="1.8" strokeDasharray="10,6" />
      {/* Plumb line */}
      <line x1="150" y1="8" x2="150" y2="522"
        stroke={c.stroke} strokeWidth="0.9" strokeDasharray="6,5" opacity="0.35" />
      {/* Head */}
      <ellipse cx="162" cy="52" rx="21" ry="25"
        fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
      {/* Neck */}
      <path d="M156 77 Q153 93 152 107"
        stroke={c.stroke} strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.65" />
      {/* Torso */}
      <path d="M130 107 Q116 165 120 218 Q124 248 148 264"
        stroke={c.stroke} strokeWidth="26" strokeLinecap="round" fill="none" opacity="0.42" />
      {/* Arm */}
      <path d="M126 128 Q114 178 116 222"
        stroke={c.stroke} strokeWidth="11" strokeLinecap="round" fill="none" opacity="0.25" />
      {/* Upper leg */}
      <path d="M148 264 Q148 315 150 368"
        stroke={c.stroke} strokeWidth="21" strokeLinecap="round" fill="none" opacity="0.45" />
      {/* Lower leg */}
      <path d="M150 368 Q151 410 153 452"
        stroke={c.stroke} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.42" />
      {/* Foot */}
      <path d="M146 452 Q153 468 180 466 Q188 465 188 462 Q168 460 153 452"
        fill={c.fill} stroke={c.stroke} strokeWidth="1.3" />
      {/* Zone circles */}
      {zones.map((z) => (
        <g key={z.label}>
          <circle cx={z.cx} cy={z.cy} r={z.r}
            fill="transparent" stroke={z.color} strokeWidth="1.8" strokeDasharray="5,3" />
          <circle cx={z.cx} cy={z.cy} r={z.r * 0.33} fill={z.color} />
        </g>
      ))}
      {/* Instruction */}
      <text x="150" y="518" textAnchor="middle" fontSize="10"
        fill={c.stroke} fontWeight="600" opacity="0.6">
        Position your full side profile in frame
      </text>
    </svg>
  );
}

// ── Countdown display ──────────────────────────────────────────────────────
function CountdownDisplay({ seconds }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        key={seconds}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{ scale: 0.7,    opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-sm border-4 border-emerald-400 flex items-center justify-center"
      >
        <span className="text-5xl font-black text-emerald-400">{seconds}</span>
      </motion.div>
    </div>
  );
}

// ── Landmark meta ──────────────────────────────────────────────────────────
const LANDMARK_META = [
  { id: "ear",      label: "Ear",      color: "#3b82f6" },
  { id: "shoulder", label: "Shoulder", color: "#8b5cf6" },
  { id: "hip",      label: "Hip",      color: "#10b981" },
  { id: "knee",     label: "Knee",     color: "#ef4444" },
  { id: "ankle",    label: "Ankle",    color: "#f59e0b" },
];

// ── Review screen ──────────────────────────────────────────────────────────
/**
 * Displays the captured image (object-contain, no cropping) with
 * landmark dots correctly mapped to the visible image area.
 *
 * Landmark coords are normalized [0,1] relative to the captured image's
 * natural pixel dimensions. We use a ResizeObserver to measure the
 * actual rendered image size (accounting for letterboxing), then place
 * dots at: px = letterboxOffset + normalizedCoord * renderedImageSize
 */
function ReviewStep({ preview, capturedDims, qualityResult, landmarks, onLandmarksChange, onAccept, onRetake, onBack }) {
  const boxRef     = useRef(null);
  const imgRef     = useRef(null);
  const [layout,   setLayout]   = useState(null); // { imgX, imgY, imgW, imgH }
  const [dragging, setDragging] = useState(null);

  // Compute layout whenever box or image size changes
  const computeLayout = useCallback(() => {
    const box = boxRef.current;
    const img = imgRef.current;
    if (!box || !img || !capturedDims) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const { imgX, imgY, imgW, imgH } = objectContainLayout(capturedDims.w, capturedDims.h, boxW, boxH);
    setLayout({ imgX, imgY, imgW, imgH });
  }, [capturedDims]);

  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(computeLayout);
    ro.observe(boxRef.current);
    computeLayout();
    return () => ro.disconnect();
  }, [computeLayout]);

  // Convert normalized [0,1] → absolute px in the box
  const normToPx = (normX, normY) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: layout.imgX + normX * layout.imgW,
      y: layout.imgY + normY * layout.imgH,
    };
  };

  // Convert absolute px in box → normalized [0,1]
  const pxToNorm = (pxX, pxY) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (pxX - layout.imgX) / layout.imgW)),
      y: Math.max(0, Math.min(1, (pxY - layout.imgY) / layout.imgH)),
    };
  };

  const handlePointerDown = (e, id) => { e.preventDefault(); setDragging(id); };

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const pxX  = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const pxY  = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const norm = pxToNorm(pxX, pxY);
    onLandmarksChange(landmarks.map((lm) =>
      lm.id === dragging ? { ...lm, normX: norm.x, normY: norm.y } : lm
    ));
  }, [dragging, layout, landmarks, onLandmarksChange]); // eslint-disable-line

  const handlePointerUp = () => setDragging(null);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup",   handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup",   handlePointerUp);
    };
  }, [dragging, handlePointerMove]);

  const avgNormX = landmarks.length > 0
    ? landmarks.reduce((s, l) => s + l.normX, 0) / landmarks.length
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-0.5">Review</p>
        <h1 className="text-xl font-bold tracking-tight">Check your photo</h1>
        {qualityResult?.pass && (
          <p className="text-xs text-muted-foreground mt-0.5">Drag dots to fine-tune if needed.</p>
        )}
      </div>

      {/* Image box — takes available space, never clips image */}
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

        {/* Landmark overlay — only render when layout is known and landmarks are valid */}
        {qualityResult?.pass && layout && landmarks.length > 0 && (
          <div className="absolute inset-0" style={{ touchAction: "none" }}>
            {/* Plumb line */}
            {avgNormX !== null && (() => {
              const lx = layout.imgX + avgNormX * layout.imgW;
              const y1 = layout.imgY;
              const y2 = layout.imgY + layout.imgH;
              return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1={lx} y1={y1} x2={lx} y2={y2}
                    stroke="#3b82f6" strokeWidth="1.5"
                    strokeDasharray="8,5" opacity="0.45" />
                </svg>
              );
            })()}

            {/* Landmark dots */}
            {landmarks.map((d) => {
              const { x, y } = normToPx(d.normX, d.normY);
              // Safety: skip dots outside image area
              if (
                x < layout.imgX - 10 || x > layout.imgX + layout.imgW + 10 ||
                y < layout.imgY - 10 || y > layout.imgY + layout.imgH + 10
              ) return null;
              return (
                <div
                  key={d.id}
                  onPointerDown={(e) => handlePointerDown(e, d.id)}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                    cursor: dragging === d.id ? "grabbing" : "grab",
                    touchAction: "none",
                    zIndex: 10,
                  }}
                >
                  {/* Outer glow */}
                  <div style={{
                    position: "absolute", width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: d.color, opacity: 0.18,
                    top: -16, left: -16,
                  }} />
                  {/* Dot */}
                  <div style={{
                    position: "absolute", width: 14, height: 14, borderRadius: "50%",
                    backgroundColor: d.color,
                    border: "2.5px solid white",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.55)",
                    top: -7, left: -7,
                  }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Status banner */}
        <AnimatePresence>
          {qualityResult && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-0 left-0 right-0 px-4 py-3 backdrop-blur-sm ${
                qualityResult.pass ? "bg-emerald-700/88" : "bg-rose-800/88"
              }`}>
              <div className="flex items-start gap-2.5">
                {qualityResult.pass
                  ? <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                <p className="text-white text-sm font-medium leading-snug">
                  {qualityResult.pass ? "Landmarks detected — ready for analysis!" : qualityResult.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      {qualityResult?.pass && landmarks.length > 0 && (
        <div className="flex items-center gap-3 justify-center flex-wrap px-4 pt-2">
          {landmarks.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-muted-foreground font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      )}



      {/* Actions */}
      <div className="px-5 pt-3 pb-8 space-y-2.5 flex-shrink-0">
        {qualityResult?.pass ? (
          <Button onClick={onAccept} className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
            <CheckCircle2 className="w-5 h-5" /> Continue to Analysis
          </Button>
        ) : (
          <Button onClick={onAccept} variant="outline"
            className="w-full h-12 rounded-2xl gap-2 font-semibold text-sm">
            Use This Photo Anyway
          </Button>
        )}
        <Button variant={qualityResult?.pass ? "outline" : "default"}
          onClick={onRetake} className="w-full h-12 rounded-2xl gap-2 font-semibold">
          <RotateCcw className="w-4 h-4" /> Retake Photo
        </Button>
        <Button variant="ghost" onClick={onBack}
          className="w-full h-10 text-muted-foreground text-sm">← Back</Button>
      </div>
    </div>
  );
}

// ── Processing view ────────────────────────────────────────────────────────
function ProcessingView({ stage }) {
  const label =
    stage === "upload"   ? "Uploading photo…"         :
    stage === "detect"   ? "Running pose detection…"  :
    stage === "validate" ? "Validating landmarks…"    :
                           "Preparing results…";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-5 bg-background">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <div className="text-center">
        <p className="font-bold text-lg mb-1">Analyzing your posture</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Camera capture ─────────────────────────────────────────────────────────
function CameraCapture({ onFileReady, onBack }) {
  const videoRef      = useRef(null);
  const captureCanvas = useRef(null);
  const evalCanvas    = useRef(null);
  const viewfinderRef = useRef(null);
  const streamRef     = useRef(null);
  const evalTimer     = useRef(null);
  const countdownRef    = useRef(null); // interval for countdown
  const countdownActive = useRef(false); // true while countdown is ticking
  const didCapture      = useRef(false);

  const [facingMode,    setFacingMode]    = useState("environment");
  const [zoomIndex,     setZoomIndex]     = useState(0);
  const [camReady,      setCamReady]      = useState(false);
  const [camError,      setCamError]      = useState(null);
  const [mpReady,       setMpReady]       = useState(false);
  const [readinessState, setReadinessState] = useState("no_person");
  const [hint,          setHint]          = useState("Position yourself sideways in frame");
  const [countdown,     setCountdown]     = useState(null); // null | 5..1
  const [flashFrame,    setFlashFrame]    = useState(false);

  const isFront   = facingMode === "user";
  const zoomScale = ZOOM_STEPS[zoomIndex];

  // ── Camera start ────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode) => {
    clearInterval(evalTimer.current);
    clearInterval(countdownRef.current);
    countdownActive.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCamReady(false);
    setCamError(null);
    didCapture.current = false;
    setReadinessState("no_person");
    setHint("Position yourself sideways in frame");
    setCountdown(null);
    setZoomIndex(0); // always reset zoom to 1x on camera start

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width:  { ideal: 1280 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamReady(true);
      }
    } catch {
      setCamError("Camera access denied. Please allow camera access in your browser settings.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    MediaPipeLib.getLandmarker().then(() => setMpReady(true)).catch(() => setMpReady(true));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearInterval(evalTimer.current);
      clearInterval(countdownRef.current);
    };
  }, []); // eslint-disable-line

  const toggleCamera = useCallback(() => {
    const next = isFront ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  }, [isFront, startCamera]);

  const handleZoomIn    = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const handleZoomOut   = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const handleZoomReset = () => setZoomIndex(0);

  // ── Capture ─────────────────────────────────────────────────────────────
  // Captures exactly what the user sees: same cover-crop + zoom crop.
  const doCapture = useCallback(() => {
    if (didCapture.current) return;
    didCapture.current = true;
    clearInterval(evalTimer.current);
    clearInterval(countdownRef.current);

    const video  = videoRef.current;
    const canvas = captureCanvas.current;
    const vf     = viewfinderRef.current;
    if (!video || !canvas || !vf) return;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (!srcW || !srcH) return;

    const vfW = vf.clientWidth;
    const vfH = vf.clientHeight;

    // Step 1: what does object-cover show in the viewfinder?
    const crop = objectCoverCrop(srcW, srcH, vfW, vfH);

    // Step 2: zoom in by sampling a smaller central region
    const zoomedSW = crop.sw / zoomScale;
    const zoomedSH = crop.sh / zoomScale;
    const sx = crop.sx + (crop.sw - zoomedSW) / 2;
    const sy = crop.sy + (crop.sh - zoomedSH) / 2;

    // Output canvas matches the zoomed region
    const outW = Math.round(zoomedSW);
    const outH = Math.round(zoomedSH);
    canvas.width  = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (isFront) {
      // Flip horizontally to un-mirror front camera
      ctx.save();
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, zoomedSW, zoomedSH, 0, 0, outW, outH);
      ctx.restore();
    } else {
      ctx.drawImage(video, sx, sy, zoomedSW, zoomedSH, 0, 0, outW, outH);
    }

    setFlashFrame(true);
    setTimeout(() => setFlashFrame(false), 220);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onFileReady(
            new File([blob], "posture-capture.jpg", { type: "image/jpeg" }),
            { w: outW, h: outH }
          );
        }
      },
      "image/jpeg",
      0.93
    );
  }, [isFront, zoomScale, onFileReady]);

  // ── Countdown logic ──────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    if (countdownActive.current) return; // already running
    countdownActive.current = true;
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
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

  // ── Live eval loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!camReady || !mpReady) return;
    const ec = evalCanvas.current;
    if (!ec) return;
    const ctx = ec.getContext("2d");

    evalTimer.current = setInterval(async () => {
      const video = videoRef.current;
      const vf    = viewfinderRef.current;
      if (!video || !vf || video.readyState < 2 || didCapture.current) return;

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      if (!srcW || !srcH) return;

      // Eval canvas: same crop+zoom as capture, but small for speed
      const EVAL_W = 320;
      const EVAL_H = Math.round(EVAL_W / VIEWFINDER_ASPECT);

      ec.width  = EVAL_W;
      ec.height = EVAL_H;

      const vfW  = vf.clientWidth;
      const vfH  = vf.clientHeight;
      const crop = objectCoverCrop(srcW, srcH, vfW, vfH);
      const zoomedSW = crop.sw / zoomScale;
      const zoomedSH = crop.sh / zoomScale;
      const sx = crop.sx + (crop.sw - zoomedSW) / 2;
      const sy = crop.sy + (crop.sh - zoomedSH) / 2;

      if (isFront) {
        ctx.save();
        ctx.translate(EVAL_W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, zoomedSW, zoomedSH, 0, 0, EVAL_W, EVAL_H);
        ctx.restore();
      } else {
        ctx.drawImage(video, sx, sy, zoomedSW, zoomedSH, 0, 0, EVAL_W, EVAL_H);
      }

      let result = { state: "no_person", hint: "Position yourself sideways in frame" };
      try {
        const landmarker = await MediaPipeLib.getLandmarker();
        const bitmap     = await createImageBitmap(ec);
        const detection  = landmarker.detect(bitmap);
        bitmap.close?.();
        const lm = detection?.landmarks?.[0];
        result = lm
          ? evaluateReadiness(lm)
          : { state: "no_person", hint: "No person detected — step into frame" };
      } catch {
        return;
      }

      setReadinessState(result.state);
      setHint(result.hint);

      // Countdown management
      if (result.state === "ready") {
        startCountdown(); // no-op if already running (guarded by countdownActive ref)
      } else {
        cancelCountdown(); // no-op if not running
      }
    }, EVAL_INTERVAL_MS);

    return () => clearInterval(evalTimer.current);
  }, [camReady, mpReady, isFront, zoomScale, startCountdown, cancelCountdown]);

  // ── Status styles ────────────────────────────────────────────────────────
  const statusBg =
    readinessState === "ready"    ? "bg-emerald-700/88"  :
    readinessState === "almost"   ? "bg-amber-700/82"    :
    readinessState === "detected" ? "bg-blue-700/80"     :
                                    "bg-slate-900/78";
  const dotColor =
    readinessState === "ready"    ? "bg-emerald-400" :
    readinessState === "almost"   ? "bg-amber-400"   :
    readinessState === "detected" ? "bg-blue-400"    :
                                    "bg-rose-400";
  const statusLabel =
    readinessState === "ready"    ? "Ready" :
    readinessState === "almost"   ? "Almost there" :
    readinessState === "detected" ? "Person detected" :
                                    "No person";

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      <canvas ref={captureCanvas} className="hidden" />
      <canvas ref={evalCanvas}    className="hidden" />

      {/* Viewfinder — fixed 3:4 aspect ratio */}
      <div
        ref={viewfinderRef}
        className="relative bg-slate-950 mx-3 mt-3 rounded-3xl overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "3/4" }}
      >
        {/* Video — CSS zoom via scale, parent clips overflow */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover",
            transform: `scale(${zoomScale}) scaleX(${isFront ? -1 : 1})`,
            transformOrigin: "center center",
          }}
          playsInline muted autoPlay
        />

        <CameraOverlay readinessState={readinessState} />

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <CountdownDisplay seconds={countdown} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flash */}
        <AnimatePresence>
          {flashFrame && (
            <motion.div key="flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="absolute inset-0 bg-white pointer-events-none" />
          )}
        </AnimatePresence>

        {/* Camera loading */}
        {!camReady && !camError && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white/70 text-xs">Starting camera…</p>
          </div>
        )}

        {/* MP loading */}
        {camReady && !mpReady && (
          <div className="absolute top-3 left-14 right-14">
            <div className="flex items-center gap-2 bg-black/65 backdrop-blur-sm rounded-2xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
              <p className="text-white/85 text-xs font-medium">Loading pose detection…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {camError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center px-8 gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-white text-sm text-center leading-relaxed">{camError}</p>
            <Button size="sm" onClick={() => startCamera(facingMode)}>Try Again</Button>
          </div>
        )}

        {/* Zoom — left side */}
        {camReady && !camError && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            <button onClick={handleZoomIn} disabled={zoomIndex >= ZOOM_STEPS.length - 1}
              className="w-9 h-9 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform">
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleZoomReset}
              className="w-9 h-6 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">{zoomScale.toFixed(1)}×</span>
            </button>
            <button onClick={handleZoomOut} disabled={zoomIndex <= 0}
              className="w-9 h-9 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform">
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Camera flip — top right */}
        <button onClick={toggleCamera}
          className="absolute top-3 right-3 w-10 h-10 bg-black/55 backdrop-blur-sm rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
          <RefreshCw className="w-5 h-5 text-white" />
        </button>

        {/* Status bar */}
        {camReady && !camError && (
          <AnimatePresence mode="wait">
            <motion.div key={statusLabel + hint} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-0 left-0 right-0 px-4 py-2.5 backdrop-blur-sm ${statusBg}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor} ${readinessState === "ready" ? "animate-pulse" : ""}`} />
                <div>
                  <p className="text-white text-xs font-bold leading-tight">{statusLabel}</p>
                  <p className="text-white/80 text-xs leading-tight">{hint}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Controls below viewfinder */}
      <div className="px-4 pt-3 space-y-2.5 flex-1">
        <Button onClick={doCapture} disabled={!camReady || countdown !== null}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
          <Camera className="w-5 h-5" />
          {countdown !== null ? `Taking photo in ${countdown}…` : "Take Photo Now"}
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full h-10 text-muted-foreground text-sm">
          ← Back
        </Button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function CaptureScreen({ onAccepted, onBack }) {
  const [uiState,       setUiState]       = useState("capture");
  const [processStage,  setProcessStage]  = useState("upload");
  const [preview,       setPreview]       = useState(null);
  const [capturedDims,  setCapturedDims]  = useState(null); // { w, h } of captured canvas
  const [uploadedUrl,   setUploadedUrl]   = useState(null);
  const [landmarks,     setLandmarks]     = useState([]);
  const [qualityResult, setQualityResult] = useState(null);

  const processFile = useCallback(async (file, dims) => {
    setPreview(URL.createObjectURL(file));
    setCapturedDims(dims ?? null);
    setUiState("processing");
    setProcessStage("upload");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);

    setProcessStage("detect");
    let keyLandmarks = null;

    try {
      const imgEl = await MediaPipeLib.loadImageElement(file_url);
      const result = await MediaPipeLib.detectPose(imgEl);
      setProcessStage("validate");
      keyLandmarks = MediaPipeLib.extractKeyLandmarks(result.landmarks);
      // Log raw coords for debugging
      console.log("[PostureScan] Raw landmarks from MediaPipe:", JSON.stringify({
        ear: { x: keyLandmarks.ear.x.toFixed(4), y: keyLandmarks.ear.y.toFixed(4), vis: keyLandmarks.ear.visibility?.toFixed(3) },
        shoulder: { x: keyLandmarks.shoulder.x.toFixed(4), y: keyLandmarks.shoulder.y.toFixed(4), vis: keyLandmarks.shoulder.visibility?.toFixed(3) },
        hip: { x: keyLandmarks.hip.x.toFixed(4), y: keyLandmarks.hip.y.toFixed(4) },
        ankle: { x: keyLandmarks.ankle.x.toFixed(4), y: keyLandmarks.ankle.y.toFixed(4) },
      }));
    } catch (err) {
      console.warn("[PostureScan] MediaPipe extraction failed:", err?.message);
      keyLandmarks = null;
    }

    setProcessStage("analyze");
    await new Promise((r) => setTimeout(r, 280));

    if (!keyLandmarks) {
      setQualityResult({
        pass: false,
        message: "Couldn't reliably detect all body landmarks. You can retake or use this photo anyway.",
      });
      setLandmarks([]);
      setUiState("review");
      return;
    }

    const { ear, shoulder, hip, knee, ankle } = keyLandmarks;
    setLandmarks([
      { ...LANDMARK_META[0], normX: ear.x,      normY: ear.y      },
      { ...LANDMARK_META[1], normX: shoulder.x,  normY: shoulder.y  },
      { ...LANDMARK_META[2], normX: hip.x,        normY: hip.y        },
      { ...LANDMARK_META[3], normX: knee.x,       normY: knee.y       },
      { ...LANDMARK_META[4], normX: ankle.x,      normY: ankle.y      },
    ]);
    setQualityResult({ pass: true });
    setUiState("review");
  }, []);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setCapturedDims(null);
    setUploadedUrl(null);
    setLandmarks([]);
    setQualityResult(null);
    setUiState("capture");
  }, []);

  const handleAccept = useCallback(() => {
    const kl = landmarks.reduce((acc, lm) => {
      acc[lm.id] = { x: lm.normX, y: lm.normY, visibility: 1 };
      return acc;
    }, {});
    console.log("[CaptureScreen] Passing landmarks to analyzePosture");
    onAccepted(uploadedUrl, Object.keys(kl).length > 0 ? kl : null);
  }, [uploadedUrl, landmarks, onAccepted]);

  if (uiState === "processing") return <ProcessingView stage={processStage} />;

  if (uiState === "review") {
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
      />
    );
  }

  return <CameraCapture onFileReady={processFile} onBack={onBack} />;
}