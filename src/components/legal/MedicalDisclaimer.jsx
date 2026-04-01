import { ShieldCheck } from "lucide-react";

export default function MedicalDisclaimer({ className = "" }) {
  return (
    <div className={`flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3.5 ${className}`}>
      <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-primary mb-0.5">Wellness guidance only</p>
        <p className="text-xs text-foreground/70 leading-relaxed">
          SpineLab is not a medical device and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting any new exercise program.
        </p>
      </div>
    </div>
  );
}