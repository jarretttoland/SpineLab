/**
 * src/lib/healthkit.js
 *
 * Dynamic import wrapper for @perfood/capacitor-healthkit.
 * Compiles and imports cleanly without the package installed.
 * Activates automatically once you run:
 *   npm install @perfood/capacitor-healthkit
 *   npx cap sync ios
 *
 * Xcode setup (one time):
 *   1. Target → Signing & Capabilities → + Capability → HealthKit
 *   2. Info.plist → add two keys:
 *      NSHealthShareUsageDescription  → "SpineLab reads health data to track your posture progress."
 *      NSHealthUpdateUsageDescription → "SpineLab saves your Spine Score to Apple Health."
 */

import { Capacitor } from "@capacitor/core";

let _HK = null;
let _loaded = false;
let _authorized = false;

const WRITE_TYPES = ["MINDFUL_SESSION"];
const READ_TYPES = [];

async function load() {
  if (_loaded) return _HK !== null;
  _loaded = true;

  if (!Capacitor.isNativePlatform()) return false;

  try {
    const mod = await import(/* @vite-ignore */ "@perfood/capacitor-healthkit");
    _HK = mod.CapacitorHealthkit ?? mod.default ?? null;
  } catch {
    // Package not yet installed — silently no-op
    _HK = null;
  }

  return _HK !== null;
}

/** Request HealthKit write authorization. Call once before the first write. */
export async function requestHealthKitPermission() {
  const available = await load();
  if (!available || !_HK) return false;

  try {
    await _HK.requestAuthorization({
      all: [],
      read: READ_TYPES,
      write: WRITE_TYPES,
    });
    _authorized = true;
    return true;
  } catch (err) {
    console.warn("[HealthKit] requestAuthorization failed:", err);
    return false;
  }
}

/**
 * Write a Spine Score to Apple Health as a Mind & Body workout session.
 *
 * @param {number} score         0–100 Spine Score
 * @param {Date|string} date     When the scan happened (defaults to now)
 * @param {number} durationMins  Workout duration to record (default 1)
 * @returns {Promise<boolean>}   true on success
 */
export async function writeSpineScore(score, date = new Date(), durationMins = 1) {
  const available = await load();
  if (!available || !_HK) return false;

  if (!_authorized) {
    const granted = await requestHealthKitPermission();
    if (!granted) return false;
  }

  try {
    const startDate = date instanceof Date ? date : new Date(date);
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

    await _HK.saveWorkout({
      activityType: 52, // HKWorkoutActivityTypeMindAndBody
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      energyBurned: 0,
      energyBurnedUnit: "KILOCALORIE",
      distance: 0,
      distanceUnit: "METER",
      metadata: {
        SpineLabScore: score,
        HKMetadataKeyWasUserEntered: true,
      },
    });

    return true;
  } catch (err) {
    console.warn("[HealthKit] writeSpineScore failed:", err);
    return false;
  }
}
