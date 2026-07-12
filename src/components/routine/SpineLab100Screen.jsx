import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { hapticHeavy } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";

function GoldRing() {
  return (
    <div className="relative flex items-center justify-center mb-6">
      {/* Outer glow pulse */}
      <motion.div
        className="absolute w-44 h-44 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ring */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="w-36 h-36 rounded-full border-4 border-amber-400 flex flex-col items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 50%, #fbbf24 100%)" }}
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-black text-amber-800 leading-none"
        >
          100
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mt-1"
        >
          SpineLab
        </motion.p>
      </motion.div>

      {/* Orbiting stars */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 180,
            height: 180,
            rotate: deg,
          }}
          animate={{ rotate: [deg, deg + 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
        >
          <Star
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-amber-400 text-amber-400"
            style={{ opacity: 0.7 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function SpineLab100Screen({ onContinue }) {
  const firedRef = useRef(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("subscription_period")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.subscription_period === "annual") setIsAnnual(true);
        });
    });
  }, []);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    hapticHeavy();

    // First burst
    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#fbbf24", "#f59e0b", "#fef3c7", "#ffffff", "#fde68a"],
    });

    // Second wave
    setTimeout(() => {
      hapticHeavy();
      confetti({
        particleCount: 120,
        spread: 120,
        origin: { y: 0.35 },
        colors: ["#fbbf24", "#f59e0b", "#ffffff"],
        startVelocity: 35,
      });
    }, 400);

    // Third from sides
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ["#fbbf24", "#fef3c7"] });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ["#fbbf24", "#fef3c7"] });
    }, 750);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-background overflow-hidden"
      style={{ paddingTop: "max(48px, calc(env(safe-area-inset-top) + 48px))" }}
    >
      {/* Background gold shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.08) 0%, transparent 65%)",
        }}
      />

      <div className="flex flex-col items-center px-6 flex-1 justify-center">
        <GoldRing />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-4"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-2">
            Maximum Level
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-3">
            You hit SpineLab 100.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
            You've reached the highest possible Spine Score. This is what consistency looks like.
          </p>
        </motion.div>

        {/* Reward card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="w-full max-w-sm bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl px-5 py-4 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-200 dark:bg-amber-800/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              SpineLab 100 Reward Unlocked
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-snug">
              {isAnnual
                ? "Your next annual renewal drops in half — permanently. Applied at your next billing date."
                : "Your premium subscription price drops in half — permanently."}
            </p>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="w-full px-6"
        style={{ paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 32px))" }}
      >
        <Button
          onClick={onContinue}
          className="w-full h-14 rounded-2xl text-base font-bold gap-2"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white",
            boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
          }}
        >
          <Star className="w-4 h-4 fill-white" />
          Continue to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
