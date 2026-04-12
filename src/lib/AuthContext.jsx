import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

function hasGuestSession() {
  try {
    return localStorage.getItem("guest") === "true";
  } catch {
    return false;
  }
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

          const guestActive = hasGuestSession();
          setUser(null);
          setIsGuest(guestActive);
          setIsAuthenticated(guestActive);
          setAuthError(
            guestActive
              ? null
              : { type: "auth_required", message: error.message }
          );
          return;
        }

        const sessionUser = session?.user ?? null;
        const guestActive = hasGuestSession();

        if (sessionUser) {
          setUser(sessionUser);
          setIsGuest(false);
          setIsAuthenticated(true);
          setAuthError(null);
        } else if (guestActive) {
          setUser(null);
          setIsGuest(true);
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

        const guestActive = hasGuestSession();
        setUser(null);
        setIsGuest(guestActive);
        setIsAuthenticated(guestActive);
        setAuthError(
          guestActive
            ? null
            : {
                type: "auth_required",
                message: err?.message || "Authentication required",
              }
        );
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
      const guestActive = hasGuestSession();

      if (sessionUser) {
        setUser(sessionUser);
        setIsGuest(false);
        setIsAuthenticated(true);
        setAuthError(null);
      } else if (guestActive) {
        setUser(null);
        setIsGuest(true);
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

  const startGuestSession = () => {
    try {
      localStorage.setItem("guest", "true");
    } catch {
      // ignore
    }

    setUser(null);
    setIsGuest(true);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const logout = async () => {
    try {
      localStorage.removeItem("guest");
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
      const guestActive = hasGuestSession();

      if (sessionUser) {
        setUser(sessionUser);
        setIsGuest(false);
        setIsAuthenticated(true);
        setAuthError(null);
      } else if (guestActive) {
        setUser(null);
        setIsGuest(true);
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