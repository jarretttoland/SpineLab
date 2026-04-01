import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowRight, ShieldCheck, TrendingUp, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

const SpineIcon = () => (
  <svg viewBox="0 0 40 40" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="white">
    {/* Vertebrae stack */}
    <rect x="15" y="4"  width="10" height="5" rx="2.5" opacity="0.9"/>
    <rect x="13" y="11" width="14" height="5" rx="2.5"/>
    <rect x="13" y="18" width="14" height="5" rx="2.5"/>
    <rect x="13" y="25" width="14" height="5" rx="2.5"/>
    <rect x="15" y="32" width="10" height="4" rx="2" opacity="0.9"/>
    {/* Disc lines */}
    <line x1="13" y1="10"  x2="27" y2="10"  stroke="white" strokeWidth="0.8" opacity="0.35"/>
    <line x1="13" y1="17"  x2="27" y2="17"  stroke="white" strokeWidth="0.8" opacity="0.35"/>
    <line x1="13" y1="24"  x2="27" y2="24"  stroke="white" strokeWidth="0.8" opacity="0.35"/>
    <line x1="13" y1="31"  x2="27" y2="31"  stroke="white" strokeWidth="0.8" opacity="0.35"/>
  </svg>
);

const FEATURES = [
  { icon: TrendingUp, label: "Spine Score tracking" },
  { icon: Scan,       label: "AI Posture Analysis" },
  { icon: ShieldCheck, label: "Personalised routines" },
];

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.97-.9 6.62-2.46l-3.24-2.5a6.03 6.03 0 0 1-8.94-3.17H1.08v2.58A10 10 0 0 0 10 20z" fill="#34A853"/>
    <path d="M4.44 11.87A6.03 6.03 0 0 1 4.44 8.13V5.55H1.08a10 10 0 0 0 0 8.9l3.36-2.58z" fill="#FBBC05"/>
    <path d="M10 3.96a5.44 5.44 0 0 1 3.84 1.5l2.87-2.87A9.65 9.65 0 0 0 10 0 10 10 0 0 0 1.08 5.55l3.36 2.58A5.96 5.96 0 0 1 10 3.96z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = ({ className = "" }) => (
  <svg width="18" height="22" viewBox="0 0 18 22" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
    <path d="M14.95 11.55c-.02-2.23 1.82-3.3 1.9-3.36-1.04-1.52-2.65-1.73-3.22-1.75-1.37-.14-2.68.81-3.38.81-.7 0-1.78-.79-2.93-.77-1.5.02-2.89.88-3.66 2.22-1.57 2.72-.4 6.74 1.12 8.95.74 1.08 1.63 2.29 2.8 2.25 1.12-.05 1.55-.73 2.91-.73 1.36 0 1.74.73 2.93.71 1.21-.02 1.98-1.1 2.72-2.18.86-1.25 1.21-2.46 1.23-2.52-.03-.01-2.4-.92-2.42-3.63zM12.56 4.37C13.16 3.64 13.57 2.63 13.45 1.6c-.86.04-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.94-.48 2.54-1.18z"/>
  </svg>
);

export default function Landing() {
  const [screen, setScreen] = useState(null); // null | "signup" | "login"

  const handleProvider = (provider) => base44.auth.loginWithProvider(provider, window.location.href);
  const handleEmailAuth = () => base44.auth.redirectToLogin(window.location.href);

  if (screen === "signup" || screen === "login") {
    const isSignup = screen === "signup";
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-10"
          >
            <div className="w-16 h-16 bg-primary rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/25 mb-5">
              <SpineIcon />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Start your SpineLab journey." : "Log in to continue your progress."}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 pb-14 space-y-3"
        >
          {/* Google */}
          <button
            onClick={() => handleProvider("google")}
            className="w-full h-14 rounded-2xl text-base font-semibold border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            {isSignup ? "Sign up with Google" : "Continue with Google"}
          </button>

          {/* Apple */}
          <button
            onClick={() => handleProvider("apple")}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
          >
            <AppleIcon />
            {isSignup ? "Sign up with Apple" : "Continue with Apple"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or use email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            onClick={handleEmailAuth}
            variant="outline"
            className="w-full h-14 rounded-2xl text-base font-semibold border-border"
          >
            Continue with Email
          </Button>

          <button
            onClick={() => setScreen(null)}
            className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6 text-center">

        {/* Logo block */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 bg-primary rounded-[22px] flex items-center justify-center shadow-lg shadow-primary/25 mb-5">
            <SpineIcon />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-1">Welcome to SpineLab</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Fix Your Spine. Track Your Progress.
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mb-8"
        >
          Create an account to start tracking your posture, or log in to continue where you left off.
        </motion.p>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="flex flex-col gap-3 w-full max-w-xs mb-10"
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="px-6 pb-14 space-y-3"
      >
        <Button
          onClick={() => setScreen("signup")}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-md shadow-primary/20"
        >
          Create Account
          <ArrowRight className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => setScreen("login")}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold border-border"
        >
          Log In — I have an account
        </Button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed pt-1">
          All progress is saved to your personal account.
        </p>
      </motion.div>
    </div>
  );
}