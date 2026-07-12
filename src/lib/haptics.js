/**
 * Haptics wrapper — gracefully no-ops on web / simulator.
 * Uses a dynamic import so the app compiles even before
 * `npm install @capacitor/haptics` is run.
 *
 * After install, run:  npx cap sync ios
 */

import { Capacitor } from "@capacitor/core";

let _Haptics         = null;
let _ImpactStyle     = null;
let _NotificationType = null;
let _loaded          = false;

async function load() {
  if (_loaded) return;
  _loaded = true;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const mod = await import("@capacitor/haptics");
    _Haptics          = mod.Haptics;
    _ImpactStyle      = mod.ImpactStyle;
    _NotificationType = mod.NotificationType;
  } catch {
    // package not yet installed — all calls are silent no-ops
  }
}

// Kick off the load immediately
load();

export async function hapticLight() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.impact({ style: _ImpactStyle.Light }); } catch {}
}

export async function hapticMedium() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.impact({ style: _ImpactStyle.Medium }); } catch {}
}

export async function hapticHeavy() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.impact({ style: _ImpactStyle.Heavy }); } catch {}
}

export async function hapticSuccess() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.notification({ type: _NotificationType.Success }); } catch {}
}

export async function hapticError() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.notification({ type: _NotificationType.Error }); } catch {}
}

export async function hapticWarning() {
  await load();
  if (!_Haptics) return;
  try { await _Haptics.notification({ type: _NotificationType.Warning }); } catch {}
}
