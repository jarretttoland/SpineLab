import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { uploadPostureScanImage } from "@/lib/postureScanSupabase";
import * as MediaPipeLib from "@/lib/mediapipe";

const COUNTDOWN_SECONDS = 5;
const EVAL_INTERVAL_MS = 200;
const VIEWFINDER_ASPECT = 3 / 4;
const ZOOM_STEPS = [1.0, 1.3, 1.6, 2.0, 2.5];

function objectCoverCrop(srcW, srcH, dstW, dstH) {
  const srcAR = srcW / srcH;
  const dstAR = dstW / dstH;
  let sw, sh, sx, sy;

  if (srcAR > dstAR) {
    sh = srcH;
    sw = srcH * dstAR;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    sw = srcW;
    sh = srcW / dstAR;
    sx = 0;
    sy = (srcH - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

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
    return { state: "no_person", hint: "Step into frame" };
  }

  const vis = (pt) => pt?.visibility ?? 0;
  const best = (a, b) => (vis(a) >= vis(b) ? a : b);

  const leftEar = lm[7];
  const rightEar = lm[8];
  const leftSho = lm[11];
  const rightSho = lm[12];
  const leftHip = lm[23];
  const rightHip = lm[24];

  const ear = best(leftEar, rightEar);
  const sho = best(leftSho, rightSho);
  const hip = best(leftHip, rightHip);

  if (vis(sho) < 0.3 || vis(hip) < 0.3) {
    return { state: "no_person", hint: "Step into frame" };
  }

  if (vis(ear) < 0.25) {
    return { state: "detected", hint: "Turn your head into view" };
  }

  const torsoHeight = Math.abs(hip.y - sho.y);

  if (torsoHeight < 0.1) {
    return { state: "almost", hint: "Move slightly closer" };
  }

  if (torsoHeight > 0.45) {
    return { state: "almost", hint: "Move slightly farther away" };
  }

  const shoulderSep =
    vis(leftSho) >= 0.2 && vis(rightSho) >= 0.2
      ? Math.abs(leftSho.x - rightSho.x)
      : 0;

  if (shoulderSep > 0.35) {
    return { state: "almost", hint: "Turn sideways (profile view)" };
  }

  const midX = (sho.x + hip.x) / 2;
  if (midX < 0.15) return { state: "almost", hint: "Move slightly right" };
  if (midX > 0.85) return { state: "almost", hint: "Move slightly left" };

  return { state: "ready", hint: "Hold still — starting scan" };
}

function CameraOverlay({ readinessState }) {
  const c =
    readinessState === "ready"
      ? { stroke: "rgba(52,211,153,0.95)", fill: "rgba(52,211,153,0.12)" }
      : readinessState === "almost"
      ? { stroke: "rgba(251,191,36,0.90)", fill: "rgba(251,191,36,0.10)" }
      : readinessState === "detected"
      ? { stroke: "rgba(147,197,253,0.85)", fill: "rgba(147,197,253,0.08)" }
      : { stroke: "rgba(255,255,255,0.25)", fill: "rgba(255,255,255,0.04)" };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 300 530"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x="8"
        y="4"
        width="284"
        height="522"
        rx="18"
        fill="none"
        stroke={c.stroke}
        strokeWidth="1.8"
        strokeDasharray="10,6"
      />
      <line
        x1="150"
        y1="8"
        x2="150"
        y2="522"
        stroke={c.stroke}
        strokeWidth="0.9"
        strokeDasharray="6,5"
        opacity="0.35"
      />
      <ellipse
        cx="162"
        cy="52"
        rx="21"
        ry="25"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.6"
      />
      <path
        d="M156 77 Q153 93 152 107"
        stroke={c.stroke}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <path
        d="M130 107 Q116 165 120 218 Q124 248 148 264"
        stroke={c.stroke}
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
      <path
        d="M126 128 Q114 178 116 222"
        stroke={c.stroke}
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M148 264 Q148 315 150 368"
        stroke={c.stroke}
        strokeWidth="21"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M150 368 Q151 410 153 452"
        stroke={c.stroke}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
      <path
        d="M146 452 Q153 468 180 466 Q188 465 188 462 Q168 460 153 452"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.3"
      />
      <text
        x="150"
        y="518"
        textAnchor="middle"
        fontSize="10"
        fill={c.stroke}
        fontWeight="600"
        opacity="0.6"
      >
        Align your ear, shoulder, and hip in the guide
      </text>
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
        className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-sm border-4 border-emerald-400 flex items-center justify-center"
      >
        <span className="text-5xl font-black text-emerald-400">{seconds}</span>
      </motion.div>
    </div>
  );
}

function ReviewStep({
  preview,
  capturedDims,
  qualityResult,
  landmarks,
  onLandmarksChange,
  onAccept,
  onRetake,
  onBack,
}) {
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [dragging, setDragging] = useState(null);

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

  const handlePointerDown = (e, id) => {
    e.preventDefault();
    setDragging(id);
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const pxX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const pxY = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
      const norm = pxToNorm(pxX, pxY);
      onLandmarksChange(
        landmarks.map((lm) =>
          lm.id === dragging ? { ...lm, normX: norm.x, normY: norm.y } : lm
        )
      );
    },
    [dragging, landmarks, onLandmarksChange]
  );

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", () => setDragging(null), { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [dragging, handlePointerMove]);

  const avgNormX =
    landmarks.length > 0
      ? landmarks.reduce((s, l) => s + l.normX, 0) / landmarks.length
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-5 pt-6 pb-3 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-0.5">
          Review
        </p>
        <h1 className="text-xl font-bold tracking-tight">Check your photo</h1>
        {qualityResult?.pass && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag dots to fine-tune if needed.
          </p>
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
                  <line
                    x1={lx}
                    y1={y1}
                    x2={lx}
                    y2={y2}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="8,5"
                    opacity="0.45"
                  />
                </svg>
              );
            })()}

            {landmarks.map((d) => {
              const { x, y } = normToPx(d.normX, d.normY);
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
                  <div
                    style={{
                      position: "absolute",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: d.color,
                      opacity: 0.18,
                      top: -16,
                      left: -16,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: d.color,
                      border: "2.5px solid white",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.55)",
                      top: -7,
                      left: -7,
                    }}
                  />
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
                    ? "Landmarks detected — ready for analysis!"
                    : qualityResult.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pt-3 pb-8 space-y-2.5 flex-shrink-0">
        {qualityResult?.pass ? (
          <Button onClick={onAccept} className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
            <CheckCircle2 className="w-5 h-5" /> Continue to Analysis
          </Button>
        ) : (
          <Button onClick={onAccept} variant="outline" className="w-full h-12 rounded-2xl gap-2 font-semibold text-sm">
            Use This Photo Anyway
          </Button>
        )}
        <Button variant={qualityResult?.pass ? "outline" : "default"} onClick={onRetake} className="w-full h-12 rounded-2xl gap-2 font-semibold">
          <RotateCcw className="w-4 h-4" /> Retake Photo
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full h-10 text-muted-foreground text-sm">
          ← Back
        </Button>
      </div>
    </div>
  );
}

function ProcessingView({ stage }) {
  const label =
    stage === "upload"
      ? "Uploading photo…"
      : stage === "detect"
      ? "Running pose detection…"
      : stage === "validate"
      ? "Validating landmarks…"
      : "Preparing results…";

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

function CameraCapture({ onFileReady, onBack }) {
  const videoRef = useRef(null);
  const captureCanvas = useRef(null);
  const evalCanvas = useRef(null);
  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const evalTimer = useRef(null);
  const countdownRef = useRef(null);
  const countdownActive = useRef(false);
  const didCapture = useRef(false);

  const [facingMode, setFacingMode] = useState("environment");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [mpReady, setMpReady] = useState(false);
  const [readinessState, setReadinessState] = useState("no_person");
  const [hint, setHint] = useState("Position yourself sideways in frame");
  const [countdown, setCountdown] = useState(null);
  const [flashFrame, setFlashFrame] = useState(false);

  const isFront = facingMode === "user";
  const zoomScale = ZOOM_STEPS[zoomIndex];

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode) => {
    clearInterval(evalTimer.current);
    clearInterval(countdownRef.current);
    countdownActive.current = false;

    stopCamera();

    setCamReady(false);
    setCamError(null);
    didCapture.current = false;
    setReadinessState("no_person");
    setHint("Position yourself sideways in frame");
    setCountdown(null);
    setZoomIndex(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
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
    } catch (err) {
      console.error("Camera error:", err);
      setCamError("Camera access denied. Please allow camera access in your browser settings.");
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera(facingMode);
    MediaPipeLib.getLandmarker()
      .then(() => setMpReady(true))
      .catch(() => setMpReady(true));

    return () => {
      stopCamera();
      clearInterval(evalTimer.current);
      clearInterval(countdownRef.current);
    };
  }, [facingMode, startCamera, stopCamera]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const handleZoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const handleZoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const handleZoomReset = () => setZoomIndex(0);

  const doCapture = useCallback(() => {
    if (didCapture.current) return;
    didCapture.current = true;

    clearInterval(evalTimer.current);
    clearInterval(countdownRef.current);

    const video = videoRef.current;
    const canvas = captureCanvas.current;
    const vf = viewfinderRef.current;
    if (!video || !canvas || !vf) return;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (!srcW || !srcH) return;

    const vfW = vf.clientWidth;
    const vfH = vf.clientHeight;

    const crop = objectCoverCrop(srcW, srcH, vfW, vfH);
    const zoomedSW = crop.sw / zoomScale;
    const zoomedSH = crop.sh / zoomScale;
    const sx = crop.sx + (crop.sw - zoomedSW) / 2;
    const sy = crop.sy + (crop.sh - zoomedSH) / 2;

    const outW = Math.round(zoomedSW);
    const outH = Math.round(zoomedSH);
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");

    if (isFront) {
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
        if (!blob) return;
        onFileReady(
          new File([blob], "posture-capture.jpg", { type: "image/jpeg" }),
          { w: outW, h: outH }
        );
      },
      "image/jpeg",
      0.93
    );
  }, [isFront, onFileReady, zoomScale]);

  const startCountdown = useCallback(() => {
    if (countdownActive.current) return;

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

  useEffect(() => {
    if (!camReady || !mpReady) return;

    const ec = evalCanvas.current;
    if (!ec) return;
    const ctx = ec.getContext("2d");

    evalTimer.current = setInterval(async () => {
      const video = videoRef.current;
      const vf = viewfinderRef.current;
      if (!video || !vf || video.readyState < 2 || didCapture.current) return;

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      if (!srcW || !srcH) return;

      const EVAL_W = 320;
      const EVAL_H = Math.round(EVAL_W / VIEWFINDER_ASPECT);

      ec.width = EVAL_W;
      ec.height = EVAL_H;

      const vfW = vf.clientWidth;
      const vfH = vf.clientHeight;
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
        const detected = await MediaPipeLib.detectPoseForVideo(video, performance.now());
        const lm = detected?.landmarks ?? null;
        result = evaluateReadiness(lm);
      } catch (e) {
        result = { state: "no_person", hint: "Position yourself sideways in frame" };
      }

      setReadinessState(result.state);
      setHint(result.hint);

      if (result.state === "ready") {
        startCountdown();
      } else {
        cancelCountdown();
      }
    }, EVAL_INTERVAL_MS);

    return () => clearInterval(evalTimer.current);
  }, [camReady, mpReady, isFront, zoomScale, startCountdown, cancelCountdown]);

  const statusBg =
    readinessState === "ready"
      ? "bg-emerald-700/88"
      : readinessState === "almost"
      ? "bg-amber-700/82"
      : readinessState === "detected"
      ? "bg-blue-700/80"
      : "bg-slate-900/78";

  const statusLabel =
    readinessState === "ready"
      ? "Ready"
      : readinessState === "almost"
      ? "Almost there"
      : readinessState === "detected"
      ? "Person detected"
      : "No person";

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      <canvas ref={captureCanvas} className="hidden" />
      <canvas ref={evalCanvas} className="hidden" />

      <div
        ref={viewfinderRef}
        className="relative bg-slate-950 mx-3 mt-3 rounded-3xl overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "3/4" }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover",
            transform: `scale(${zoomScale}) scaleX(${isFront ? -1 : 1})`,
            transformOrigin: "center center",
          }}
          playsInline
          muted
          autoPlay
        />

        <CameraOverlay readinessState={readinessState} />

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <CountdownDisplay seconds={countdown} />
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

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <button
            onClick={onBack}
            className="bg-black/45 text-white px-3 py-2 rounded-xl text-sm"
          >
            Back
          </button>

          <button
            onClick={toggleCamera}
            className="bg-black/45 text-white px-3 py-2 rounded-xl text-sm"
          >
            {isFront ? "Back Camera" : "Front Camera"}
          </button>
        </div>

        <div className={`absolute bottom-16 left-3 right-3 ${statusBg} rounded-2xl px-4 py-3 z-20`}>
          <div className="text-white text-xs font-semibold uppercase tracking-wide mb-1">
            {statusLabel}
          </div>
          <div className="text-white text-sm">{camError || hint}</div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-5 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <button onClick={handleZoomOut} className="bg-secondary rounded-xl px-4 py-2 text-sm">
            Zoom Out
          </button>
          <button onClick={handleZoomReset} className="bg-secondary rounded-xl px-4 py-2 text-sm">
            1x
          </button>
          <button onClick={handleZoomIn} className="bg-secondary rounded-xl px-4 py-2 text-sm">
            Zoom In
          </button>
        </div>

        <Button onClick={doCapture} className="w-full h-12 rounded-2xl">
          Take Photo Now
        </Button>
      </div>
    </div>
  );
}

export default function CaptureScreen({ onAccepted, onBack, userId }) {
  const [uiState, setUiState] = useState("capture");
  const [processStage, setProcessStage] = useState("upload");
  const [preview, setPreview] = useState(null);
  const [capturedDims, setCapturedDims] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [qualityResult, setQualityResult] = useState(null);

  const handleFileReady = useCallback(async (file, dims) => {
    const localPreviewUrl = URL.createObjectURL(file);

    setPreview(localPreviewUrl);
    setCapturedDims(dims ?? null);
    setUiState("processing");
    setProcessStage("upload");

    let uploaded = { publicUrl: localPreviewUrl, path: null };

    try {
      if (userId) {
        uploaded = await uploadPostureScanImage(file, userId);
      }
    } catch (err) {
      console.error("[CaptureScreen] upload error:", err);
    }

    setUploadedUrl(uploaded.publicUrl);
    setProcessStage("detect");

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
        message: "Could not detect posture clearly.",
      });
      setLandmarks([]);
      setUiState("review");
      return;
    }

    const dynamic = [];

    if (keyLandmarks.ear) {
      dynamic.push({
        id: "ear",
        label: "Ear",
        color: "#3b82f6",
        normX: keyLandmarks.ear.x,
        normY: keyLandmarks.ear.y,
      });
    }

    if (keyLandmarks.shoulder) {
      dynamic.push({
        id: "shoulder",
        label: "Shoulder",
        color: "#8b5cf6",
        normX: keyLandmarks.shoulder.x,
        normY: keyLandmarks.shoulder.y,
      });
    }

    if (keyLandmarks.hip) {
      dynamic.push({
        id: "hip",
        label: "Hip",
        color: "#10b981",
        normX: keyLandmarks.hip.x,
        normY: keyLandmarks.hip.y,
      });
    }

    if (keyLandmarks.knee) {
      dynamic.push({
        id: "knee",
        label: "Knee",
        color: "#ef4444",
        normX: keyLandmarks.knee.x,
        normY: keyLandmarks.knee.y,
      });
    }

    if (keyLandmarks.ankle) {
      dynamic.push({
        id: "ankle",
        label: "Ankle",
        color: "#f59e0b",
        normX: keyLandmarks.ankle.x,
        normY: keyLandmarks.ankle.y,
      });
    }

    setLandmarks(dynamic);
    setQualityResult({
      pass: true,
      uploadedUrl: uploaded.publicUrl,
      storagePath: uploaded.path,
    });
    setUiState("review");
  }, [userId]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setCapturedDims(null);
    setUploadedUrl(null);
    setLandmarks([]);
    setQualityResult(null);
    setUiState("capture");
  }, []);

  const handleAccept = useCallback(() => {
    if (!uploadedUrl) return;

    const lm = (id) => landmarks.find((l) => l.id === id);

    const keyLandmarks = {
      ear: lm("ear") ? { x: lm("ear").normX, y: lm("ear").normY, visibility: 1 } : null,
      shoulder: lm("shoulder") ? { x: lm("shoulder").normX, y: lm("shoulder").normY, visibility: 1 } : null,
      hip: lm("hip") ? { x: lm("hip").normX, y: lm("hip").normY, visibility: 1 } : null,
      knee: lm("knee") ? { x: lm("knee").normX, y: lm("knee").normY, visibility: 1 } : null,
      ankle: lm("ankle") ? { x: lm("ankle").normX, y: lm("ankle").normY, visibility: 1 } : null,
    };

    onAccepted(uploadedUrl, keyLandmarks, qualityResult?.storagePath ?? null);
  }, [uploadedUrl, landmarks, qualityResult, onAccepted]);

  if (uiState === "capture") {
    return <CameraCapture onFileReady={handleFileReady} onBack={onBack} />;
  }

  if (uiState === "processing") {
    return <ProcessingView stage={processStage} />;
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
    />
  );
}