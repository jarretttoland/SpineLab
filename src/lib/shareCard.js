/**
 * src/lib/shareCard.js
 *
 * Generates a branded dark-gradient share card showing:
 *   - Posture score ring
 *   - Grade pill
 *   - Spine age (large, styled)
 *   - Total spine score (secondary)
 *
 * No extra packages needed — uses Canvas API + navigator.share.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOLD = "#F5C518";
const GOLD2 = "#FFE066";

function scoreColor(s) {
  if (s === 100) return GOLD;
  if (s >= 88)  return "#10b981"; // emerald
  if (s >= 74)  return "#3b82f6"; // blue
  if (s >= 58)  return "#f59e0b"; // amber
  return "#ef4444";               // rose
}

function scoreGrade(s) {
  if (s === 100) return "Perfect";
  if (s >= 88)   return "Excellent";
  if (s >= 74)   return "Good";
  if (s >= 58)   return "Fair";
  return "Needs Work";
}

/** Draws a gold shimmer band across the canvas for score=100 cards */
function drawGoldShimmer(ctx, W, H) {
  // Diagonal shimmer sweep
  const shimmer = ctx.createLinearGradient(0, H * 0.1, W, H * 0.9);
  shimmer.addColorStop(0,    "rgba(245,197,24,0)");
  shimmer.addColorStop(0.35, "rgba(245,197,24,0.04)");
  shimmer.addColorStop(0.5,  "rgba(255,224,102,0.09)");
  shimmer.addColorStop(0.65, "rgba(245,197,24,0.04)");
  shimmer.addColorStop(1,    "rgba(245,197,24,0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(0, 0, W, H);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Word-wrap text onto a canvas context. Returns the final y position. */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const w = ctx.measureText(testLine).width;
    if (w > maxWidth && line !== "") {
      ctx.fillText(line.trimEnd(), x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trimEnd(), x, currentY);
  return currentY;
}

// ─── Card generator ───────────────────────────────────────────────────────────

/**
 * Draws and returns a canvas element with the share card.
 *
 * @param {object} opts
 * @param {number}  opts.score            0–100 posture score
 * @param {number}  [opts.spineAge]       Spine age in years
 * @param {number}  [opts.totalSpineScore] Total spine score 0–100
 * @param {string}  [opts.scanDate]       ISO date string e.g. "2024-06-03"
 * @returns {HTMLCanvasElement}
 */
function buildCard({ score, spineAge, totalSpineScore, scanDate }) {
  const W = 1080;
  const H = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const isPerfect = score === 100;
  const color = scoreColor(score);
  const grade = scoreGrade(score);
  const { r, g, b } = hexToRgb(color);

  // ── Background gradient ────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
  if (isPerfect) {
    bg.addColorStop(0,   "#1a1400");
    bg.addColorStop(0.5, "#1f1800");
    bg.addColorStop(1,   "#221500");
  } else {
    bg.addColorStop(0,   "#0b0b1a");
    bg.addColorStop(0.5, "#10102a");
    bg.addColorStop(1,   "#150d28");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (isPerfect) drawGoldShimmer(ctx, W, H);

  // Radial glow behind the ring
  const glow = ctx.createRadialGradient(W / 2, 480, 0, W / 2, 480, 480);
  glow.addColorStop(0, `rgba(${r},${g},${b},${isPerfect ? 0.28 : 0.18})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── SpineLab wordmark ──────────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Small caps label
  ctx.font = "600 36px -apple-system, 'SF Pro Display', system-ui, sans-serif";
  ctx.letterSpacing = "0.18em";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("SPINELAB", W / 2, 100);
  ctx.letterSpacing = "0";

  // ── Score ring ─────────────────────────────────────────────────────────────
  const CX = W / 2;
  const CY = 460;
  const RADIUS = 230;
  const LINE_W = 26;

  // Track ring
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = LINE_W;
  ctx.stroke();

  // Glowing score arc
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * Math.PI * 2;

  // Outer glow pass
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth = LINE_W + 18;
  ctx.lineCap = "round";
  ctx.stroke();

  // Main arc
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, startAngle, endAngle);
  const arcGrad = ctx.createLinearGradient(CX - RADIUS, CY, CX + RADIUS, CY);
  if (isPerfect) {
    arcGrad.addColorStop(0,   GOLD2);
    arcGrad.addColorStop(0.5, GOLD);
    arcGrad.addColorStop(1,   GOLD2);
  } else {
    arcGrad.addColorStop(0, color);
    arcGrad.addColorStop(1, `rgba(${r},${g},${b},0.7)`);
  }
  ctx.strokeStyle = arcGrad;
  ctx.lineWidth = LINE_W;
  ctx.lineCap = "round";
  ctx.stroke();

  // ── Score number ───────────────────────────────────────────────────────────
  ctx.textBaseline = "middle";
  ctx.fillStyle = isPerfect ? GOLD : "#ffffff";
  ctx.font = `900 190px -apple-system, 'SF Pro Display', system-ui, sans-serif`;
  ctx.fillText(String(score), CX, CY - 18);

  // "POSTURE SCORE" caption
  ctx.font = "500 34px -apple-system, system-ui, sans-serif";
  ctx.letterSpacing = "0.16em";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("POSTURE SCORE", CX, CY + 85);
  ctx.letterSpacing = "0";

  // ── Grade pill ─────────────────────────────────────────────────────────────
  const PILL_Y = CY + 140;
  const pillText = grade;
  ctx.font = "700 32px -apple-system, system-ui, sans-serif";
  const pillW = ctx.measureText(pillText).width + 64;
  const pillH = 56;
  const pillX = CX - pillW / 2;

  // Pill background
  ctx.beginPath();
  ctx.roundRect(pillX, PILL_Y, pillW, pillH, pillH / 2);
  ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, CX, PILL_Y + pillH / 2);

  // ── Divider ────────────────────────────────────────────────────────────────
  const DIV_Y = 760;
  const divGrad = ctx.createLinearGradient(160, DIV_Y, W - 160, DIV_Y);
  divGrad.addColorStop(0, "rgba(255,255,255,0)");
  divGrad.addColorStop(0.5, "rgba(255,255,255,0.12)");
  divGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.moveTo(160, DIV_Y);
  ctx.lineTo(W - 160, DIV_Y);
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Spine age block ────────────────────────────────────────────────────────
  if (spineAge != null) {
    // Label
    ctx.font = "600 30px -apple-system, system-ui, sans-serif";
    ctx.letterSpacing = "0.16em";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.fillText("SPINE AGE", CX, 840);
    ctx.letterSpacing = "0";

    // "Spine of a" prefix
    ctx.font = "400 46px -apple-system, 'SF Pro Display', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("Spine of a", CX, 910);

    // Age number — large, color-matched
    ctx.font = `900 160px -apple-system, 'SF Pro Display', system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(String(spineAge), CX, 1030);

    // "year-old" suffix
    ctx.font = "400 46px -apple-system, 'SF Pro Display', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("year-old", CX, 1130);
  }

  // ── Total spine score (secondary stat) ────────────────────────────────────
  if (totalSpineScore != null) {
    ctx.font = "500 32px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.fillText(`Total Spine Score  ${totalSpineScore}`, CX, 1210);
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  // Date
  let dateLabel = "";
  if (scanDate) {
    try {
      dateLabel = new Date(scanDate + "T12:00:00").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
    } catch (_) {
      dateLabel = scanDate;
    }
  }

  ctx.font = "400 28px -apple-system, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fillText(dateLabel, CX, H - 100);

  ctx.font = "500 28px -apple-system, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillText("spinelab.app", CX, H - 56);

  return canvas;
}

// ─── Workout card ─────────────────────────────────────────────────────────────

/**
 * Builds a share card for workout completion.
 * Shows total spine score ring, level, spine age, and streak.
 */
function buildWorkoutCard({ spineScore, levelTitle, levelColor, spineAge, streak }) {
  const W = 1080;
  const H = 1350;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const isPerfect = spineScore === 100;
  const color = isPerfect ? GOLD : (levelColor || "#3b82f6");
  const { r, g, b } = hexToRgb(color);

  // ── Background ─────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
  if (isPerfect) {
    bg.addColorStop(0,   "#1a1400");
    bg.addColorStop(0.5, "#1f1800");
    bg.addColorStop(1,   "#221500");
  } else {
    bg.addColorStop(0,   "#0b0b1a");
    bg.addColorStop(0.5, "#10102a");
    bg.addColorStop(1,   "#150d28");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (isPerfect) drawGoldShimmer(ctx, W, H);

  const glow = ctx.createRadialGradient(W / 2, 460, 0, W / 2, 460, 460);
  glow.addColorStop(0, `rgba(${r},${g},${b},${isPerfect ? 0.28 : 0.18})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Wordmark ───────────────────────────────────────────────────────────────
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font         = "600 36px -apple-system, 'SF Pro Display', system-ui, sans-serif";
  ctx.letterSpacing = "0.18em";
  ctx.fillStyle    = "rgba(255,255,255,0.35)";
  ctx.fillText("SPINELAB", W / 2, 100);
  ctx.letterSpacing = "0";

  // ── Score ring ─────────────────────────────────────────────────────────────
  const CX = W / 2, CY = 460, RADIUS = 230, LINE_W = 26;

  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = LINE_W;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle   = startAngle + (Math.min(spineScore, 100) / 100) * Math.PI * 2;

  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth   = LINE_W + 18;
  ctx.lineCap     = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, startAngle, endAngle);
  const arcGrad = ctx.createLinearGradient(CX - RADIUS, CY, CX + RADIUS, CY);
  if (isPerfect) {
    arcGrad.addColorStop(0,   GOLD2);
    arcGrad.addColorStop(0.5, GOLD);
    arcGrad.addColorStop(1,   GOLD2);
  } else {
    arcGrad.addColorStop(0, color);
    arcGrad.addColorStop(1, `rgba(${r},${g},${b},0.7)`);
  }
  ctx.strokeStyle = arcGrad;
  ctx.lineWidth   = LINE_W;
  ctx.lineCap     = "round";
  ctx.stroke();

  // ── Score number ───────────────────────────────────────────────────────────
  ctx.textBaseline = "middle";
  ctx.fillStyle    = isPerfect ? GOLD : "#ffffff";
  ctx.font         = `900 190px -apple-system, 'SF Pro Display', system-ui, sans-serif`;
  ctx.fillText(String(spineScore), CX, CY - 18);

  ctx.font          = "500 34px -apple-system, system-ui, sans-serif";
  ctx.letterSpacing = "0.16em";
  ctx.fillStyle     = "rgba(255,255,255,0.35)";
  ctx.textBaseline  = "alphabetic";
  ctx.fillText("SPINE SCORE", CX, CY + 85);
  ctx.letterSpacing = "0";

  // ── Level pill ─────────────────────────────────────────────────────────────
  const PILL_Y = CY + 140;
  ctx.font = "700 32px -apple-system, system-ui, sans-serif";
  const pillW = ctx.measureText(levelTitle).width + 64;
  const pillH = 56;
  const pillX = CX - pillW / 2;

  ctx.beginPath();
  ctx.roundRect(pillX, PILL_Y, pillW, pillH, pillH / 2);
  ctx.fillStyle   = `rgba(${r},${g},${b},0.15)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.fillStyle    = color;
  ctx.textBaseline = "middle";
  ctx.fillText(levelTitle, CX, PILL_Y + pillH / 2);

  // ── Divider ────────────────────────────────────────────────────────────────
  const DIV_Y = 760;
  const divGrad = ctx.createLinearGradient(160, DIV_Y, W - 160, DIV_Y);
  divGrad.addColorStop(0,   "rgba(255,255,255,0)");
  divGrad.addColorStop(0.5, "rgba(255,255,255,0.12)");
  divGrad.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.moveTo(160, DIV_Y);
  ctx.lineTo(W - 160, DIV_Y);
  ctx.strokeStyle = divGrad;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Spine age ──────────────────────────────────────────────────────────────
  if (spineAge != null) {
    ctx.font          = "600 30px -apple-system, system-ui, sans-serif";
    ctx.letterSpacing = "0.16em";
    ctx.fillStyle     = "rgba(255,255,255,0.35)";
    ctx.textBaseline  = "alphabetic";
    ctx.textAlign     = "center";
    ctx.fillText("SPINE AGE", CX, 840);
    ctx.letterSpacing = "0";

    ctx.font      = "400 46px -apple-system, 'SF Pro Display', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("Spine of a", CX, 910);

    ctx.font         = `900 150px -apple-system, 'SF Pro Display', system-ui, sans-serif`;
    ctx.fillStyle    = color;
    ctx.textBaseline = "middle";
    ctx.fillText(String(spineAge), CX, 1020);

    ctx.font         = "400 46px -apple-system, 'SF Pro Display', system-ui, sans-serif";
    ctx.fillStyle    = "rgba(255,255,255,0.55)";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("year-old", CX, 1120);
  }

  // ── Streak ─────────────────────────────────────────────────────────────────
  if (streak != null && streak > 0) {
    ctx.font      = "700 38px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`🔥 ${streak}-day streak`, CX, 1210);
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  ctx.font      = "500 28px -apple-system, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillText("spinelab.app", CX, H - 56);

  return canvas;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate the share card and open the native share sheet.
 *
 * @param {object} opts
 * @param {number}  opts.score
 * @param {number}  [opts.spineAge]
 * @param {number}  [opts.totalSpineScore]
 * @param {string}  [opts.scanDate]
 * @returns {Promise<boolean>}   true if shared successfully
 */
export async function shareSpineScore({ score, spineAge, totalSpineScore, scanDate } = {}) {
  const canvas = buildCard({ score: score ?? 0, spineAge, totalSpineScore, scanDate });

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      const file = new File([blob], "spine-score.png", { type: "image/png" });

      // Try native share (works on iOS/Android in Capacitor WebView)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `Spine Score: ${score ?? 0}`,
            text: "Check out my posture scan from SpineLab!",
          });
          resolve(true);
          return;
        } catch (err) {
          // User cancelled (AbortError) — not a real error
          if (err?.name === "AbortError") {
            resolve(false);
            return;
          }
        }
      }

      // Fallback: trigger download (desktop / unsupported browsers)
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spine-score.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(true);
      } catch (_) {
        resolve(false);
      }
    }, "image/png");
  });
}

/**
 * Generate a workout completion share card and open the native share sheet.
 *
 * @param {object} opts
 * @param {number}  opts.spineScore    Total spine score 0–100
 * @param {string}  opts.levelTitle    e.g. "Strong"
 * @param {string}  opts.levelColor    hex color for the level ring
 * @param {number}  [opts.spineAge]    Spine age in years
 * @param {number}  [opts.streak]      Current day streak
 * @returns {Promise<boolean>}
 */
export async function shareWorkoutResult({ spineScore, levelTitle, levelColor, spineAge, streak } = {}) {
  const canvas = buildWorkoutCard({
    spineScore:  spineScore  ?? 0,
    levelTitle:  levelTitle  ?? "Strong",
    levelColor:  levelColor  ?? "#10b981",
    spineAge,
    streak,
  });

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(false); return; }

      const file = new File([blob], "spine-workout.png", { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Spine Score: ${spineScore ?? 0}`,
            text:  "Just completed my SpineLab session!",
          });
          resolve(true);
          return;
        } catch (err) {
          if (err?.name === "AbortError") { resolve(false); return; }
        }
      }

      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spine-workout.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(true);
      } catch (_) {
        resolve(false);
      }
    }, "image/png");
  });
}
