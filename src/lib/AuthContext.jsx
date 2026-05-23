// FILE: src/lib/AuthContext.jsx
// Replace your existing file with this entire file.
//
// What's new in this version: native deep-link handling for OAuth.
// When Apple/Google finishes sign-in, Supabase redirects to
// app.spinelab.mobile://login-callback?code=... — Capacitor's
// `appUrlOpen` event fires, we close the in-app browser, and
// exchange the code for a Supabase session. onAuthStateChange then
// flips isAuthenticated to true and routes the user.

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const AuthContext = createContext(null);

function getIsAnonymousUser(user) {
  if (!user) return false;

  return (
    user.is_anonymous === true ||
    user.app_metadata?.provider === "anonymous" ||
    user.app_metadata?.providers?.includes?.("anonymous")
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        setIsLoadingAuth(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("[AuthContext] getSession error:", error.message);
          setUser(null);
          setIsGuest(false);
          setIsAuthenticated(false);
          setAuthError({ type: "auth_required", message: error.message });
          return;
        }

        const sessionUser = session?.user ?? null;

        if (sessionUser) {
          setUser(sessionUser);
          setIsGuest(getIsAnonymousUser(sessionUser));
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setUser(null);
          setIsGuest(false);
          setIsAuthenticated(false);
          setAuthError({
            type: "auth_required",
            message: "Authentication required",
          });
        }
      } catch (err) {
        console.error("[AuthContext] loadSession error:", err);
        if (!mounted) return;

        setUser(null);
        setIsGuest(false);
        setIsAuthenticated(false);
        setAuthError({
          type: "auth_required",
          message: err?.message || "Authentication required",
        });
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;

      if (sessionUser) {
        setUser(sessionUser);
        setIsGuest(getIsAnonymousUser(sessionUser));
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsGuest(false);
        setIsAuthenticated(false);
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }

      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  // ───────────────────────────────────────────────────────────────
  // Native OAuth deep-link handler
  // ───────────────────────────────────────────────────────────────
  // After Apple/Google sign-in, Supabase redirects the SFSafariViewController
  // to app.spinelab.mobile://login-callback?code=XXX. iOS routes that URL
  // back into our app via the appUrlOpen event. We:
  //   1. Close the in-app browser
  //   2. Parse the OAuth `code` out of the URL
  //   3. Call supabase.auth.exchangeCodeForSession(code) — this completes
  //      the PKCE handshake and writes a session into local storage
  // onAuthStateChange then fires and flips isAuthenticated to true.

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle = null;
    let cancelled = false;

    (async () => {
      const handle = await CapApp.addListener("appUrlOpen", async (event) => {
        try {
          const incomingUrl = event?.url || "";

          // Only handle our own callback URL
          if (!incomingUrl.startsWith("app.spinelab.mobile://login-callback")) {
            return;
          }

          // Try to close Safari View Controller as quickly as possible.
          try {
            await Browser.close();
          } catch (_e) {
            // Browser may already be closed — not fatal.
          }

          // Parse the code or error from the URL. Apple/Google return
          // ?code=XXX&state=YYY on success or ?error=... on failure.
          // Some providers put the code in the URL fragment (#) — handle both.
          const parsed = new URL(incomingUrl);
          const params = new URLSearchParams(parsed.search);

          // Fallback to hash params if needed
          if (!params.get("code") && parsed.hash) {
            const hash = parsed.hash.startsWith("#")
              ? parsed.hash.slice(1)
              : parsed.hash;
            const hashParams = new URLSearchParams(hash);
            hashParams.forEach((v, k) => {
              if (!params.has(k)) params.set(k, v);
            });
          }

          const errorDescription =
            params.get("error_description") || params.get("error");

          if (errorDescription) {
            console.error("[AuthContext] OAuth callback error:", errorDescription);
            return;
          }

          const code = params.get("code");

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error(
                "[AuthContext] exchangeCodeForSession error:",
                error.message
              );
            }
            // onAuthStateChange will pick up the new session and update
            // isAuthenticated, which causes ProtectedAppRoutes to render
            // the post-login app.
            return;
          }

          // Some token-flow providers return access_token / refresh_token
          // directly. Handle that as a fallback.
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error(
                "[AuthContext] setSession from token error:",
                error.message
              );
            }
          }
        } catch (err) {
          console.error("[AuthContext] appUrlOpen handler error:", err);
        }
      });

      if (cancelled) {
        handle.remove();
      } else {
        listenerHandle = handle;
      }
    })();

    return () => {
      cancelled = true;
      listenerHandle?.remove?.();
    };
  }, []);

  const startGuestSession = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    const anonUser = data?.user ?? null;

    if (!anonUser) {
      throw new Error("Anonymous sign-in succeeded but no user was returned.");
    }

    setUser(anonUser);
    setIsGuest(true);
    setIsAuthenticated(true);
    setAuthError(null);

    return anonUser;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] logout error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/";
  };

  const checkAppState = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sessionUser = session?.user ?? null;

      if (sessionUser) {
        setUser(sessionUser);
        setIsGuest(getIsAnonymousUser(sessionUser));
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsGuest(false);
        setIsAuthenticated(false);
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    } catch (err) {
      console.error("[AuthContext] checkAppState error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        startGuestSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
