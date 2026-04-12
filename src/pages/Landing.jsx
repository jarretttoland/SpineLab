import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ArrowRight, ShieldCheck, TrendingUp, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

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
    <line
      x1="13"
      y1="10"
      x2="27"
      y2="10"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.35"
    />
    <line
      x1="13"
      y1="17"
      x2="27"
      y2="17"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.35"
    />
    <line
      x1="13"
      y1="24"
      x2="27"
      y2="24"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.35"
    />
    <line
      x1="13"
      y1="31"
      x2="27"
      y2="31"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.35"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z"
      fill="#4285F4"
    />
    <path
      d="M10 20c2.7 0 4.97-.9 6.62-2.46l-3.24-2.5a6.03 6.03 0 0 1-8.94-3.17H1.08v2.58A10 10 0 0 0 10 20z"
      fill="#34A853"
    />
    <path
      d="M4.44 11.87A6.03 6.03 0 0 1 4.44 8.13V5.55H1.08a10 10 0 0 0 0 8.9l3.36-2.58z"
      fill="#FBBC05"
    />
    <path
      d="M10 3.96a5.44 5.44 0 0 1 3.84 1.5l2.87-2.87A9.65 9.65 0 0 0 10 0 10 10 0 0 0 1.08 5.55l3.36 2.58A5.96 5.96 0 0 1 10 3.96z"
      fill="#EA4335"
    />
  </svg>
);

const FEATURES = [
  { icon: TrendingUp, label: "Spine Score tracking" },
  { icon: Scan, label: "AI Posture Analysis" },
  { icon: ShieldCheck, label: "Personalized routines" },
];

async function routeAfterAuth() {
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

    window.location.href = "/onboarding";
    return;
  }

  if (profile.onboarding_complete) {
    window.location.href = "/dashboard";
  } else {
    window.location.href = "/onboarding";
  }
}

export default function Landing() {
  const [screen, setScreen] = useState(null);
  const [emailMode, setEmailMode] = useState("login");
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { startGuestSession } = useAuth();

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google sign in error:", err.message);
      alert(err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoadingGuest(true);
      startGuestSession();
      window.location.href = "/onboarding";
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
            onClick={handleGoogle}
            disabled={loadingGoogle}
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
          All progress is saved to your personal account.
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

      await routeAfterAuth();
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