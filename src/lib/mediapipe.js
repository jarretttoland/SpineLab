/**
 * MediaPipe Pose Landmarker wrapper
 * Uses @mediapipe/tasks-vision npm package.
 *
 * BlazePose 33-point indices (side-view key points):
 *   0  = nose
 *   7  = left ear,  8  = right ear
 *  11  = left shoulder, 12 = right shoulder
 *  23  = left hip,  24  = right hip
 *  25  = left knee, 26  = right knee
 *  27  = left ankle, 28 = right ankle
 */

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

let landmarkerPromise = null;

async function buildLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
}

export function getLandmarker() {
  if (!landmarkerPromise) landmarkerPromise = buildLandmarker();
  return landmarkerPromise;
}

// ── Public helpers ─────────────────────────────────────────────────────────

/** Load a URL into an HTMLImageElement */
export function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Run pose detection on an HTMLImageElement.
 * Returns { landmarks, worldLandmarks }
 * Throws "no_person_detected" if nothing found.
 */
export async function detectPose(imageEl) {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(imageEl);
  if (!result.landmarks || result.landmarks.length === 0) {
    throw new Error("no_person_detected");
  }
  return {
    landmarks: result.landmarks[0],
    worldLandmarks: result.worldLandmarks?.[0] ?? null,
  };
}

// ── Landmark selection ─────────────────────────────────────────────────────

function best(a, b) {
  return (a?.visibility ?? 0) >= (b?.visibility ?? 0) ? a : b;
}

// Critical landmarks must be present; optional ones fall back gracefully
const MIN_VIS_CRITICAL = 0.20; // shoulder + hip must be above this
const MIN_VIS_OPTIONAL = 0.15; // ear, knee, ankle — require reasonable confidence

/**
 * Extract the 5 key side-view landmarks (all left side).
 *
 * Returns an object with ear, shoulder, hip, knee, ankle.
 * The posture analysis layer will auto-detect which side has better visibility.
 *
 * Only throws if critical landmarks are missing/unreliable.
 */
export function extractKeyLandmarks(lm) {
  const ear      = lm[7];   // left ear
  const shoulder = lm[11];  // left shoulder
  const hip      = lm[23];  // left hip
  const knee     = lm[25];  // left knee
  const ankle    = lm[27];  // left ankle

  // Critical landmarks must be present; allow graceful failure for others
  if (!shoulder || shoulder.visibility < MIN_VIS_CRITICAL) throw new Error("low_confidence:shoulder");
  if (!hip      || hip.visibility      < MIN_VIS_CRITICAL) throw new Error("low_confidence:hip");
  if (!ear || ear.visibility < MIN_VIS_OPTIONAL) throw new Error("low_confidence:ear");

  // Ankle — required for plumb line
  if (!ankle || ankle.visibility < MIN_VIS_OPTIONAL) throw new Error("low_confidence:ankle");

  // Knee — estimate from midpoint if weak
  const kneeFinal = (knee && knee.visibility >= MIN_VIS_OPTIONAL) ? knee : {
    x: (hip.x + ankle.x) / 2,
    y: (hip.y + ankle.y) / 2,
    visibility: 0.1,
  };

  return { ear, shoulder, hip, knee: kneeFinal, ankle };
}