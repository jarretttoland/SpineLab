import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  TrendingUp,
  Minus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

function LandmarkOverlay({ landmarks }) {
  if (!landmarks || landmarks.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {landmarks.map((d) => (
        <g key={d.id}>
          <circle cx={d.normX} cy={d.normY} r="0.022" fill={d.color} opacity="0.2" />
          <circle cx={d.normX} cy={d.normY} r="0.011" fill={d.color} opacity="0.95" />
          <circle cx={d.normX} cy={d.normY} r="0.005" fill="white" />
        </g>
      ))}
    </svg>
  );
}

function FailureScreen({
  onRetakeCamera,
  onRetakeLibrary,
  onNewScan,
  onContinue,
  continueLabel,
}) {
  return (
    <div className="px-6 pt-12 pb-8 max-w-lg mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">
        Scan Result
      </p>

      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Scan couldn't be read
      </h1>

      <p className="text-sm text-muted-foreground mb-8">
        We couldn't get a reliable posture scan. Please retake with your side profile visible.
      </p>

      <div className="bg-secondary rounded-3xl p-6 text-center mb-8">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>

        <h2 className="font-bold text-base mb-2">Unclear posture reading</h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Landmark detection was inconclusive. This usually means the body was not fully sideways,
          was too close, or the lighting was poor.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onRetakeCamera}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Retake with Camera
        </Button>

        <Button
          variant="outline"
          onClick={onRetakeLibrary}
          className="w-full h-12 rounded-2xl"
        >
          Choose Different Photo
        </Button>

        {onContinue ? (
          <Button
            variant="secondary"
            onClick={onContinue}
            className="w-full h-12 rounded-2xl"
          >
            {continueLabel}
          </Button>
        ) : null}

        <Button
          variant="ghost"
          onClick={onNewScan}
          className="w-full text-muted-foreground text-sm"
        >
          Back to start
        </Button>
      </div>
    </div>
  );
}

function TrendRow({ trend }) {
  if (!trend) return null;

  const lower = trend.toLowerCase();
  const improved = lower.includes("improv");
  const worse = lower.includes("increase");

  const Icon = improved ? ArrowDown : worse ? ArrowUp : Minus;

  const cls = improved
    ? "text-emerald-700 bg-emerald-50 border-emerald-100"
    : worse
    ? "text-rose-700 bg-rose-50 border-rose-100"
    : "text-muted-foreground bg-secondary border-border";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {trend}
    </div>
  );
}

export default function ScanResults({
  imageUrl = "",
  landmarks = [],
  findings = [],
  overallScore = 0,
  summary = "",
  pattern = "",
  trend = null,
  scanDate = "",
  subscores = {
    headNeck: 0,
    shoulderThoracic: 0,
    lumbarPelvis: 0,
  },
  spineDelta = 0,
  previousSpineScore = 50,
  newSpineScore = 50,
  onNewScan,
  onRetakeCamera,
  onRetakeLibrary,
  onContinue,
  continueLabel = "Continue",
  detectionFailed = false,
}) {
  const [showLandmarks, setShowLandmarks] = useState(true);

  if (detectionFailed) {
    return (
      <FailureScreen
        onRetakeCamera={onRetakeCamera}
        onRetakeLibrary={onRetakeLibrary}
        onNewScan={onNewScan}
        onContinue={onContinue}
        continueLabel={continueLabel}
      />
    );
  }

  return (
    <div className="px-4 pt-10 pb-8 max-w-lg mx-auto">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-1">
          Analysis Complete
        </p>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scan Results</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{scanDate}</p>
          </div>

          <div className="bg-primary/10 rounded-2xl px-3 py-1.5 text-right">
            <p className="text-xl font-bold text-primary">{overallScore}</p>
            <p className="text-[10px] text-primary/70 font-medium">
              Posture Score
            </p>
          </div>
        </div>

        {pattern ? (
          <div className="mt-2">
            <span className="text-xs font-semibold bg-secondary text-foreground/70 px-2.5 py-1 rounded-xl border border-border">
              {pattern}
            </span>
          </div>
        ) : null}

        <div className="mt-3">
          <TrendRow trend={trend} />
        </div>
      </div>

      <div
        className="relative rounded-3xl overflow-hidden mb-3 bg-secondary"
        style={{ aspectRatio: "3/4" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Posture scan"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            No scan image available
          </div>
        )}

        {showLandmarks && imageUrl ? (
          <LandmarkOverlay landmarks={landmarks} />
        ) : null}
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLandmarks((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showLandmarks ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          {showLandmarks ? "Hide landmarks" : "Show landmarks"}
        </button>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Spine Score Impact</p>
        </div>

        <p className="text-sm text-foreground/85">
          Spine Score: {previousSpineScore} →{" "}
          <span className="font-semibold text-primary">{newSpineScore}</span>{" "}
          ({spineDelta > 0 ? "+" : ""}
          {spineDelta})
        </p>
      </div>

      {summary ? (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 mb-5">
          <p className="text-sm text-foreground/85 leading-relaxed">{summary}</p>
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">
            {Math.round(subscores.headNeck ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
            Head / Neck
          </p>
        </div>

        <div className="bg-secondary rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">
            {Math.round(subscores.shoulderThoracic ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
            Shoulder / Upper
          </p>
        </div>

        <div className="bg-secondary rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">
            {Math.round(subscores.lumbarPelvis ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
            Lumbar / Pelvis
          </p>
        </div>
      </div>

      <div className="mb-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Posture Patterns
        </h2>

        {findings.length === 0 ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">
              No significant postural tendencies detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {findings.map((f, i) => (
              <div
                key={f.id || `${f.label}-${i}`}
                className="bg-secondary border border-border rounded-2xl px-4 py-3"
              >
                <p className="font-medium text-sm text-foreground leading-snug">
                  {f.label || "Finding"}
                </p>

                {f.detail ? (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {f.detail}
                  </p>
                ) : null}

                {f.confidence ? (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Confidence: {f.confidence}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {onContinue ? (
          <Button
            onClick={onContinue}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {continueLabel}
          </Button>
        ) : null}

        <Button
          variant="ghost"
          onClick={onNewScan}
          className="w-full h-12 rounded-2xl text-muted-foreground gap-2"
        >
          <RotateCcw className="w-4 h-4" /> New Scan
        </Button>
      </div>
    </div>
  );
}