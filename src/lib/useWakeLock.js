/**
 * useWakeLock
 *
 * Prevents the device screen from sleeping while a component is mounted.
 * Automatically releases when the component unmounts.
 *
 * Strategy (in priority order):
 *   1. Capacitor native  — @capacitor-community/keep-awake (iOS/Android)
 *      Calls UIApplication.shared.isIdleTimerDisabled on iOS.
 *   2. Web Wake Lock API — navigator.wakeLock (modern browsers / PWA)
 *
 * Usage:
 *   import { useWakeLock } from "@/lib/useWakeLock";
 *   // Inside any component:
 *   useWakeLock();
 *
 * Fails silently — if neither API is available the app still works normally,
 * the screen just follows the user's system setting.
 */

import { useEffect } from "react";

function isNativePlatform() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform?.());
}

async function getKeepAwake() {
  const mod = await import("@capacitor-community/keep-awake");
  return mod.KeepAwake;
}

export function useWakeLock() {
  useEffect(() => {
    let webLock   = null;
    let released  = false;

    async function acquire() {
      try {
        if (isNativePlatform()) {
          // Native path — delegates to UIApplication.isIdleTimerDisabled on iOS
          const KA = await getKeepAwake();
          await KA.keepAwake();
        } else if ("wakeLock" in navigator) {
          // Web Wake Lock API (Chrome 84+, Safari 16.4+)
          webLock = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        // Non-critical — user may have denied permission, or API unavailable
        console.warn("[useWakeLock] acquire failed:", err?.message ?? err);
      }
    }

    async function release() {
      if (released) return;
      released = true;
      try {
        if (isNativePlatform()) {
          const KA = await getKeepAwake();
          await KA.allowSleep();
        } else if (webLock) {
          await webLock.release();
          webLock = null;
        }
      } catch (err) {
        console.warn("[useWakeLock] release failed:", err?.message ?? err);
      }
    }

    // Re-acquire if the page becomes visible again after being hidden
    // (the Web Wake Lock API automatically releases on page hide)
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !released) {
        acquire();
      }
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, []); // mount once — lifecycle matches the component
}
