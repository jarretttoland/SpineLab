import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RotateCcw, TrendingUp, Eye, EyeOff, Camera, ImageIcon, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import MedicalDisclaimer from "@/components/legal/MedicalDisclaimer";

// ── Confidence pill ───────────────────────────────────────────────────────
function ConfidencePill({ confidence }) {
  const map = {
    high:     { label: "High confidence",      className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    moderate: { label: "Moderate confidence",  className: "bg-amber-50 text-amber-700 border-amber-100" },
    low:      { label: "Low confidence",       className: "bg-rose-50 text-rose-600 border-rose-100" },
  };
  const cfg = map[confidence] || map.low;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── Severity styling ──────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  good:     { text: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100", icon: CheckCircle2 },
  mild:     { text: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-100",   icon: AlertTriangle },
  moderate: { text: "text-orange-600",  bg: "bg-orange-50",   border: "border-orange-100",  icon: AlertTriangle },
  notable:  { text: "text-rose-600",    bg: "bg-rose-50",     border: "border-rose-100",    icon: AlertTriangle },
};

// ── Trend badge ───────────────────────────────────────────────────────────
function TrendBadge({ trend }) {
  if (!trend) return null;
  const isImproved = trend.toLowerCase().includes("improv");
  const isWorse = trend.toLowerCase().includes("increase");
  const Icon = isImproved ? ArrowDown : isWorse ? ArrowUp : Minus;
  const cls = isImproved
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : isWorse
    ? "bg-rose-50 text-rose-600 border-rose-100"
    : "bg-secondary text-muted-foreground border-border";
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${cls}`}>
      <Icon className="w-3 h-3" />
      {trend}
    </div>
  );
}

// ── Landmark overlay on image ─────────────────────────────────────────────
function LandmarkOverlay({ landmarks }) {
  if (!landmarks || landmarks.length === 0) return null;
  const avgX = landmarks.reduce((s, l) => s + l.normX, 0) / landmarks.length;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1" preserveAspectRatio="none">
      {/* Plumb line */}
      <line x1={avgX} y1="0.02" x2={avgX} y2="0.98"
        stroke="#3b82f6" strokeWidth="0.004" strokeDasharray="0.018,0.012" opacity="0.55" />
      {/* Connector */}
      <polyline
        points={landmarks.map((d) => `${d.normX},${d.normY}`).join(" ")}
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.003" strokeDasharray="0.014,0.01" />
      {/* Dots */}
      {landmarks.map((d) => (
        <g key={d.id}>
          <circle cx={d.normX} cy={d.normY} r="0.022" fill={d.color} opacity="0.20" />
          <circle cx={d.normX} cy={d.normY} r="0.011" fill={d.color} opacity="0.95" />
          <circle cx={d.normX} cy={d.normY} r="0.005" fill="white" />
        </g>
      ))}
    </svg>
  );
}

// ── Failure screen ────────────────────────────────────────────────────────
function FailureScreen({ onRetakeCamera, onRetakeLibrary, onNewScan }) {
  return (
    <div className="px-6 pt-12 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">Scan Result</p>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Scan couldn't be read</h1>
        <p className="text-sm text-muted-foreground mb-8">
          We couldn't get a reliable posture scan. Please retake with your full side profile visible.
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-secondary rounded-3xl p-6 text-center mb-8">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="font-bold text-base mb-2">Unclear posture reading</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Landmark detection was inconclusive. This usually means the body isn't fully sideways, is too close, or lighting is poor.
        </p>
      </motion.div>
      <div className="space-y-3">
        <Button onClick={onRetakeCamera} className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
          <Camera className="w-5 h-5" /> Retake with Camera
        </Button>
        <Button variant="outline" onClick={onRetakeLibrary} className="w-full h-12 rounded-2xl gap-2">
          <ImageIcon className="w-4 h-4" /> Choose Different Photo
        </Button>
        <Button variant="ghost" onClick={onNewScan} className="w-full text-muted-foreground text-sm">
          Back to start
        </Button>
      </div>
    </div>
  );
}

// ── Main results ──────────────────────────────────────────────────────────
export default function ScanResults({
  imageUrl,
  landmarks,     // [{ id, label, color, normX, normY }]
  findings,      // [{ id, label, detail, confidence, severity }]
  overallScore,
  summary,
  pattern,
  trend,
  scanDate,
  subscores,
  debugInfo,
  onNewScan,
  onRetakeCamera,
  onRetakeLibrary,
  detectionFailed = false,
}) {
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  if (detectionFailed) {
    return (
      <FailureScreen
        onRetakeCamera={onRetakeCamera}
        onRetakeLibrary={onRetakeLibrary}
        onNewScan={onNewScan}
      />
    );
  }

  return (
    <div className="px-4 pt-10 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-1">Analysis Complete</p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scan Results</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scanDate ? format(new Date(scanDate), "MMMM d, yyyy") : ""}
            </p>
          </div>
          {overallScore != null && (
            <div className="bg-primary/10 rounded-2xl px-3 py-1.5 text-right">
              <p className="text-xl font-bold text-primary">{overallScore}</p>
              <p className="text-[10px] text-primary/70 font-medium">/ 100</p>
            </div>
          )}
        </div>
        {pattern && (
          <div className="mt-1.5">
            <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border">
              {pattern}
            </span>
          </div>
        )}
        {trend && (
          <div className="mt-2">
            <TrendBadge trend={trend} />
          </div>
        )}
      </motion.div>

      {/* Annotated image */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="relative rounded-3xl overflow-hidden mb-3 bg-secondary"
        style={{ aspectRatio: "3/4" }}>
        <img src={imageUrl} alt="Posture scan" className="w-full h-full object-cover" />

        {showLandmarks && <LandmarkOverlay landmarks={landmarks} />}

        {/* Legend strip */}
        {landmarks?.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-sm px-3 py-2">
            <div className="flex items-center gap-3 justify-center flex-wrap">
              {landmarks.map((d) => (
                <div key={d.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-white/85 font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Toggle landmarks */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLandmarks((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showLandmarks ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showLandmarks ? "Hide landmarks" : "Show landmarks"}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 mb-5">
          <p className="text-sm text-foreground/85 leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Findings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Posture Patterns</h2>

        {!findings || findings.length === 0 ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">No significant postural tendencies detected.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {findings.map((f, i) => {
              const style = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.mild;
              const Icon = style.icon;
              const isExpanded = expandedId === f.id;
              return (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.07 }}
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  className={`w-full text-left flex flex-col gap-2 ${style.bg} border ${style.border} rounded-2xl px-4 py-3 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm text-foreground leading-snug`}>{f.label}</p>
                      <div className="mt-1">
                        <ConfidencePill confidence={f.confidence} />
                      </div>
                    </div>
                  </div>
                  {isExpanded && f.detail && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground leading-relaxed pl-7"
                    >
                      {f.detail}
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 text-center leading-relaxed px-2">
          Tap any finding to read more. These are posture tendencies — not diagnoses.
        </p>
      </motion.div>

      {/* Subscores */}
      {subscores && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="mb-5 grid grid-cols-3 gap-2">
          {[
            { label: "Head / Neck", score: subscores.headNeck },
            { label: "Shoulder / Upper", score: subscores.shoulderThoracic },
            { label: "Lumbar / Pelvis", score: subscores.lumbarPelvis },
          ].map(({ label, score }) => (
            <div key={label} className="bg-secondary rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{Math.round(score)}</p>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      )}



      <MedicalDisclaimer className="mb-5" />

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3">
        <Link to="/progress">
          <Button variant="outline" className="w-full h-12 rounded-2xl gap-2">
            <TrendingUp className="w-4 h-4" /> View Progress History
          </Button>
        </Link>
        <Button variant="ghost" onClick={onNewScan} className="w-full h-12 rounded-2xl text-muted-foreground gap-2">
          <RotateCcw className="w-4 h-4" /> New Scan
        </Button>
      </motion.div>
    </div>
  );
}