/**
 * MediaPipe Pose Landmarker wrapper
 * Supports:
 * - IMAGE mode for final captured photo analysis
 * - VIDEO mode for live camera readiness checks
 *
 * BlazePose 33-point indices:
 *   7  = left ear,   8  = right ear
 *  11  = left shoulder, 12 = right shoulder
 *  23  = left hip,   24 = right hip
 *  25  = left knee,  26 = right knee
 *  27  = left ankle, 28 = right ankle
 */

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

let imageLandmarkerPromise = null;
let videoLandmarkerPromise = null;

const MIN_VIS_CRITICAL = 0.2; // shoulder + hip
const MIN_VIS_OPTIONAL = 0.15; // ear + knee + ankle

async function buildImageLandmarker() {
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

async function buildVideoLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
}

export function getImageLandmarker() {
  if (!imageLandmarkerPromise) {
    imageLandmarkerPromise = buildImageLandmarker();
  }
  return imageLandmarkerPromise;
}

export function getVideoLandmarker() {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = buildVideoLandmarker();
  }
  return videoLandmarkerPromise;
}

/**
 * Backward-compatible helper so existing CaptureScreen code
 * that calls MediaPipeLib.getLandmarker() does not break.
 */
export function getLandmarker() {
  return getImageLandmarker();
}

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
  const landmarker = await getImageLandmarker();
  const result = landmarker.detect(imageEl);

  if (!result.landmarks || result.landmarks.length === 0) {
    throw new Error("no_person_detected");
  }

  return {
    landmarks: result.landmarks[0],
    worldLandmarks: result.worldLandmarks?.[0] ?? null,
  };
}

/**
 * Run live pose detection on a video element.
 * Returns { landmarks, worldLandmarks } or null if nothing found.
 */
export async function detectPoseForVideo(videoEl, timestampMs) {
  const landmarker = await getVideoLandmarker();
  const result = landmarker.detectForVideo(videoEl, timestampMs);

  if (!result.landmarks || result.landmarks.length === 0) {
    return null;
  }

  return {
    landmarks: result.landmarks[0],
    worldLandmarks: result.worldLandmarks?.[0] ?? null,
  };
}

function pickBestSide(lm) {
  const left = {
    side: "left",
    ear: lm[7],
    shoulder: lm[11],
    hip: lm[23],
    knee: lm[25],
    ankle: lm[27],
  };

  const right = {
    side: "right",
    ear: lm[8],
    shoulder: lm[12],
    hip: lm[24],
    knee: lm[26],
    ankle: lm[28],
  };

  const scoreSide = (side) =>
    (side.ear?.visibility ?? 0) +
    (side.shoulder?.visibility ?? 0) +
    (side.hip?.visibility ?? 0);

  return scoreSide(right) > scoreSide(left) ? right : left;
}

/**
 * Extract key lateral landmarks.
 * Required:
 * - ear
 * - shoulder
 * - hip
 *
 * Optional:
 * - knee
 * - ankle
 */
export function extractKeyLandmarks(lm) {
  const chosen = pickBestSide(lm);
  const { side, ear, shoulder, hip, knee, ankle } = chosen;

  if (!shoulder || shoulder.visibility < MIN_VIS_CRITICAL) {
    throw new Error("low_confidence:shoulder");
  }

  if (!hip || hip.visibility < MIN_VIS_CRITICAL) {
    throw new Error("low_confidence:hip");
  }

  if (!ear || ear.visibility < MIN_VIS_OPTIONAL) {
    throw new Error("low_confidence:ear");
  }

  return {
    side,
    ear,
    shoulder,
    hip,
    knee: knee && knee.visibility >= MIN_VIS_OPTIONAL ? knee : null,
    ankle: ankle && ankle.visibility >= MIN_VIS_OPTIONAL ? ankle : null,
  };
}