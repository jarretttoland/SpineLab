// FILE: src/pages/Landing.jsx
// Replace your existing file with this entire file.
//
// What changed from the previous version:
//   - Removed the @capacitor-community/apple-sign-in import (that package
//     is stuck on Capacitor 7, incompatible with our Capacitor 8 project)
//   - Apple Sign-In now uses Supabase's built-in OAuth flow on ALL platforms.
//     The button opens Apple's sign-in inside the WKWebView and Supabase
//     handles the callback. Satisfies Apple guideline 4.8.
//
// You should ALSO run, once, in your terminal:
//   npm uninstall @capacitor-community/apple-sign-in
//   npx cap sync ios

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase, NATIVE_OAUTH_REDIRECT } from "@/lib/supabase";
import { ArrowRight, ShieldCheck, TrendingUp, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const SpineIcon = () => (
  <svg
    viewBox="0 0 40 40"
    className="w-10 h-10"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <rect x="15" y="4" width="10" height="5" rx="2.5" opacity="0.9" />
    <rect x="13" y="11" width="14" height="5" rx="2.5" />
    <rect x="13" y="18" width="14" height="5" rx="2.5" />
    <rect x="13" y="25" width="14" height="5" rx="2.5" />
    <rect x="15" y="32" width="10" height="4" rx="2" opacity="0.9" />
    <line x1="13" y1="10" x2="27" y2="10" stroke="white" strokeWidth="0.8" opacity="0.35" />
    <line x1="13" y1="17" x2="27" y2="17" stroke="white" strokeWidth="0.8" opacity="0.35" />
    <line x1="13" y1="24" x2="27" y2="24" stroke="white" strokeWidth="0.8" opacity="0.35" />
    <line x1="13" y1="31" x2="27" y2="31" stroke="white" strokeWidth="0.8" opacity="0.35" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 14.45c-.32.74-.69 1.42-1.13 2.05-.6.85-1.09 1.43-1.46 1.76-.58.53-1.21.8-1.87.81-.48 0-1.06-.14-1.73-.42-.68-.28-1.3-.42-1.86-.42-.59 0-1.23.14-1.91.42-.69.28-1.24.43-1.66.44-.64.03-1.27-.25-1.91-.84-.4-.36-.91-.97-1.53-1.83-.67-.93-1.21-2-1.64-3.22-.45-1.32-.68-2.59-.68-3.83 0-1.41.3-2.63.92-3.65a5.42 5.42 0 0 1 1.93-1.94 5.18 5.18 0 0 1 2.61-.73c.5 0 1.17.16 2 .47.84.31 1.37.47 1.61.47.18 0 .77-.18 1.78-.55.95-.34 1.76-.49 2.42-.43 1.8.15 3.15.86 4.04 2.15-1.61.98-2.41 2.36-2.4 4.12.01 1.37.51 2.51 1.49 3.41.44.42.94.74 1.49.97-.12.34-.25.67-.39.99zM13.39 1.1c0 1.05-.39 2.04-1.16 2.95-.93 1.08-2.05 1.7-3.27 1.6a3.16 3.16 0 0 1-.02-.4c0-1.01.44-2.09 1.23-2.97.39-.45.89-.82 1.5-1.12.6-.29 1.18-.45 1.72-.48.01.14.02.28.02.42z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z" fill="#4285F4" />
    <path d="M10 20c2.7 0 4.97-.9 6.62-2.46l-3.24-2.5a6.03 6.03 0 0 1-8.94-3.17H1.08v2.58A10 10 0 0 0 10 20z" fill="#34A853" />
    <path d="M4.44 11.87A6.03 6.03 0 0 1 4.44 8.13V5.55H1.08a10 10 0 0 0 0 8.9l3.36-2.58z" fill="#FBBC05" />
    <path d="M10 3.96a5.44 5.44 0 0 1 3.84 1.5l2.87-2.87A9.65 9.65 0 0 0 10 0 10 10 0 0 0 1.08 5.55l3.36 2.58A5.96 5.96 0 0 1 10 3.96z" fill="#EA4335" />
  </svg>
);

const FEATURES = [
  { icon: TrendingUp, label: "Spine Score tracking" },
  { icon: Scan, label: "AI Posture Analysis" },
  { icon: ShieldCheck, label: "Personalized routines" },
];

async function routeAfterAuth(navigate) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) {
    throw new Error("No authenticated user found.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        pain_areas: [],
        secondary_pain: [],
        secondary_goals: [],
        scan_results: [],
        onboarding_complete: false,
        spine_score: 0,
        posture_score: 0,
        structural_score: 0,
        consistency_score: 50,
        mobility_score: 50,
        strength_score: 50,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (insertError) throw insertError;

    navigate("/onboarding", { replace: true });
    return;
  }

  if (profile.onboarding_complete) {
    navigate("/dashboard", { replace: true });
  } else {
    navigate("/onboarding", { replace: true });
  }
}

export default function Landing() {
  const [screen, setScreen] = useState(null);
  const [emailMode, setEmailMode] = useState("login");
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const { startGuestSession } = useAuth();
  const navigate = useNavigate();

  // Shared helper: kicks off an OAuth flow and routes based on platform.
  //  - Web → normal redirect inside the same tab
  //  - Native (Capacitor) → opens Safari View Controller via @capacitor/browser,
  //    Apple redirects back to our custom URL scheme, and AuthContext's
  //    deep-link listener exchanges the code for a session.
  const startOAuth = async (provider) => {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative
      ? NATIVE_OAUTH_REDIRECT
      : `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });

    if (error) throw error;

    if (isNative) {
      if (!data?.url) {
        throw new Error("Could not get OAuth URL from Supabase.");
      }
      // Open Apple/Google sign-in in Safari. After the user authenticates,
      // Apple/Google → Supabase → redirects to NATIVE_OAUTH_REDIRECT which
      // re-opens our app and fires AuthContext's appUrlOpen handler.
      await Browser.open({
        url: data.url,
        windowName: "_self",
        presentationStyle: "fullscreen",
      });
    }
    // On web, signInWithOAuth navigates away on its own.
  };

  const handleApple = async () => {
    try {
      setLoadingApple(true);
      await startOAuth("apple");
    } catch (err) {
      console.error("Apple sign in error:", err);
      alert(err?.message || "Could not sign in with Apple. Please try again.");
    } finally {
      setLoadingApple(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true);
      await startOAuth("google");
    } catch (err) {
      console.error("Google sign in error:", err?.message || err);
      alert(err?.message || "Could not sign in with Google. Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoadingGuest(true);
      await startGuestSession();
      await routeAfterAuth(navigate);
    } catch (err) {
      console.error("Guest sign in error:", err.message);
      alert(err.message);
    } finally {
      setLoadingGuest(false);
    }
  };

  const openEmailFromSignup = () => {
    setEmailMode("signup");
    setScreen("email");
  };

  const openEmailFromLogin = () => {
    setEmailMode("login");
    setScreen("email");
  };

  if (screen === "email") {
    return <EmailAuthScreen mode={emailMode} onBack={() => setScreen(null)} />;
  }

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
              {isSignup
                ? "Start your SpineLab journey."
                : "Log in to continue your progress."}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 pb-14 space-y-3"
        >
          <button
            onClick={handleApple}
            disabled={loadingApple || loadingGoogle}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-black hover:bg-zinc-800 text-white transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <AppleIcon />
            {loadingApple
              ? "Loading..."
              : isSignup
              ? "Sign up with Apple"
              : "Continue with Apple"}
          </button>

          <button
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingApple}
            className="w-full h-14 rounded-2xl text-base font-semibold border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <GoogleIcon />
            {loadingGoogle
              ? "Loading..."
              : isSignup
              ? "Sign up with Google"
              : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or use email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            onClick={isSignup ? openEmailFromSignup : openEmailFromLogin}
            variant="outline"
            className="w-full h-14 rounded-2xl text-base font-semibold border-border"
          >
            {isSignup ? "Sign up with Email" : "Continue with Email"}
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 bg-primary rounded-[22px] flex items-center justify-center shadow-lg shadow-primary/25 mb-5">
            <SpineIcon />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground mb-1">
            Welcome to SpineLab
          </h1>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Fix Your Spine. Track Your Progress.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mb-8"
        >
          Create an account to start tracking your posture, or log in to continue where you left off.
        </motion.p>

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

        <Button
          onClick={handleGuest}
          disabled={loadingGuest}
          variant="secondary"
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {loadingGuest ? "Loading..." : "Continue as Guest"}
        </Button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed pt-1">
          Guests can try SpineLab before creating a full account.
        </p>
      </motion.div>
    </div>
  );
}

function EmailAuthScreen({ mode: initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    try {
      setLoading(true);

      let result;

      if (mode === "signup") {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) throw result.error;

      const sessionUser = result.data?.user ?? null;
      const session = result.data?.session ?? null;

      if (mode === "signup" && !session) {
        alert(
          "Account created. If email confirmation is enabled, please verify your email before logging in."
        );
        onBack();
        return;
      }

      if (!sessionUser) {
        throw new Error("Login succeeded but no user session was found.");
      }

      await routeAfterAuth(navigate);
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-6 space-y-4">
        <h1 className="text-2xl font-black text-foreground">
          {mode === "signup" ? "Create account with email" : "Log in with email"}
        </h1>

        <input
          className="w-full h-12 rounded-xl border border-border px-4 bg-background text-foreground"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />

        <input
          className="w-full h-12 rounded-xl border border-border px-4 bg-background text-foreground"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          onClick={submit}
          disabled={loading || !email || !password}
          className="w-full h-12 rounded-xl"
        >
          {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Log In"}
        </Button>

        <button
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="text-sm text-muted-foreground"
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>

        <button onClick={onBack} className="text-sm text-muted-foreground">
          ← Back
        </button>
      </div>
    </div>
  );
}
