import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, Zap, Shield, Scan, Dumbbell, TrendingUp, Activity, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getOfferings, purchasePackage, restorePurchases } from "@/lib/purchases";

const PREMIUM_FEATURES = [
  { icon: Scan,        text: "Unlimited posture scans" },
  { icon: Dumbbell,    text: "6-Week Desk Worker Protocol" },
  { icon: Activity,    text: "6-Week Low Back Pain Protocol" },
  { icon: Zap,         text: "Personalized plan from your scan results" },
  { icon: TrendingUp,  text: "Full progress history and trend tracking" },
];

const PLANS = {
  monthly: {
    label:    "Monthly",
    price:    "$7.99",
    period:   "/mo",
    sub:      "Billed monthly",
    badge:    null,
    perMonth: null,
  },
  annual: {
    label:    "Annual",
    price:    "$59.99",
    period:   "/yr",
    sub:      "Billed once a year",
    badge:    "Save 37%",
    perMonth: "$5.00/mo",
  },
};

const HEADLINES = {
  scan:     { title: "Free scan used",        sub: "Upgrade for unlimited scans and structured protocols." },
  protocol: { title: "Unlock your program",   sub: "6-week plans that actually progress — not random exercises." },
  progress_trend: { title: "Upgrade to Premium", sub: "Track how your posture score changes over time." },
  general:  { title: "Upgrade to Premium",    sub: "Unlimited scans, structured protocols, deeper insights." },
};

export default function PaywallScreen({ onClose, onUpgrade, source = "general" }) {
  const [billing, setBilling]         = useState("annual");
  const [offerings, setOfferings]     = useState(null);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [restoring, setRestoring]     = useState(false);
  const [error, setError]             = useState(null);

  const { title, sub } = HEADLINES[source] || HEADLINES.general;
  const plan = PLANS[billing];

  // Load live RevenueCat offerings — retry up to 5 times with 800ms delay
  // to handle the case where RevenueCat is still initializing
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function fetchOfferings() {
      while (attempts < 5 && !cancelled) {
        attempts++;
        const o = await getOfferings();
        if (cancelled) return;
        if (o?.monthly || o?.annual) {
          setOfferings(o);
          setOfferingsLoading(false);
          return;
        }
        // Wait 800ms before retrying
        await new Promise((r) => setTimeout(r, 800));
      }
      // All retries exhausted
      if (!cancelled) setOfferingsLoading(false);
    }

    fetchOfferings();
    return () => { cancelled = true; };
  }, []);

  const handlePurchase = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // Get current user for Supabase sync
      const { data: { user } } = await supabase.auth.getUser();

      const pkg = billing === "annual" ? offerings?.annual : offerings?.monthly;

      if (!pkg) {
        setError("Could not connect to the App Store. Check your connection and try again.");
        return;
      }

      const result = await purchasePackage(pkg, user?.id);

      if (result.cancelled) return; // user dismissed StoreKit sheet — silent
      if (result.error)    { setError(result.error); return; }
      if (result.success)  { onUpgrade?.(billing); }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("[PaywallScreen] purchase error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setError(null);
    setRestoring(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await restorePurchases(user?.id);

      if (result.hasPremium) {
        onUpgrade?.(billing);
      } else {
        setError("No previous purchase found for this Apple ID.");
      }
    } catch (err) {
      setError("Restore failed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden"
    >
      {/* ── Close button ── */}
      <div
        className="flex justify-end px-5 shrink-0"
        style={{ paddingTop: "max(12px, calc(env(safe-area-inset-top) + 12px))" }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Scrollable middle ── */}
      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-3">

        {/* Icon + headline */}
        <div className="flex justify-center mb-2.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-center mb-0.5">{title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-3 leading-snug">{sub}</p>

        {/* ── Billing toggle ── */}
        <div className="bg-secondary rounded-2xl p-1 flex gap-1 mb-3">
          {Object.entries(PLANS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setBilling(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                billing === key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {p.label}
              {p.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white leading-none">
                  {p.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Price card ── */}
        <motion.div
          key={billing}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-3 mb-3 flex items-center justify-between"
        >
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black tracking-tight">{plan.price}</span>
              <span className="text-sm text-muted-foreground mb-1">{plan.period}</span>
            </div>
            {plan.perMonth && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                That's just {plan.perMonth}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-right leading-snug">
            {plan.sub}<br />Cancel anytime
          </p>
        </motion.div>

        {/* ── Feature list ── */}
        <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
            Premium includes
          </p>
          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <p className="flex-1 text-sm text-foreground/85">{text}</p>
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ── SpineLab 100 ── */}
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-2.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-snug">
            <span className="font-bold">SpineLab 100:</span>{" "}
            {billing === "annual"
              ? "Reach a Spine Score of 100 and your next annual renewal drops in half — permanently."
              : "Reach a Spine Score of 100 and your price drops in half permanently."}
          </p>
        </div>

        {/* ── Error message ── */}
        {error && (
          <p className="text-xs text-rose-600 text-center mt-3 px-2">{error}</p>
        )}
      </div>

      {/* ── Pinned CTA ── */}
      <div
        className="px-5 pt-3 shrink-0 bg-background border-t border-border/40"
        style={{ paddingBottom: "max(16px, calc(env(safe-area-inset-bottom) + 16px))" }}
      >
        <Button
          onClick={handlePurchase}
          disabled={loading || restoring || offeringsLoading}
          className="w-full h-14 rounded-2xl text-base font-bold gap-2 shadow-md shadow-primary/20"
        >
          {(loading || offeringsLoading) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {offeringsLoading
            ? "Loading…"
            : loading
            ? "Processing…"
            : billing === "annual"
            ? "Start Annual Plan"
            : "Start Monthly Plan"}
        </Button>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">
              Managed by Apple · Cancel anytime
            </p>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring || loading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground disabled:opacity-50"
          >
            {restoring
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RotateCcw className="w-3 h-3" />}
            Restore
          </button>
        </div>
      </div>
    </motion.div>
  );
}
