// FILE: src/lib/notifications.js
// NEW FILE. Save to: src/lib/notifications.js
//
// Wrapper around @capacitor/local-notifications.
// Provides: requestPermission, scheduleDailyRoutine, scheduleReScanReminder,
// cancel helpers, and a getPreferences() that the Account page reads.
//
// Preferences are stored in localStorage so they survive across app launches
// without requiring a DB change.
 
import { LocalNotifications } from "@capacitor/local-notifications";
 
const STORAGE = {
  daily_enabled: "spinelab_notif_daily_enabled",
  daily_hour: "spinelab_notif_daily_hour",
  daily_minute: "spinelab_notif_daily_minute",
  rescan_enabled: "spinelab_notif_rescan_enabled",
};
 
const NOTIF_IDS = {
  daily_routine: 1001,
  rescan: 1002,
};
 
// ────────────────────────────────────────────────────────────
// Permission
// ────────────────────────────────────────────────────────────
 
export async function requestPermission() {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (err) {
    console.error("[notifications] request error:", err);
    return false;
  }
}
 
export async function checkPermission() {
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}
 
// ────────────────────────────────────────────────────────────
// Daily routine reminder (recurring)
// ────────────────────────────────────────────────────────────
 
export async function scheduleDailyRoutine(hour = 8, minute = 0) {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_IDS.daily_routine }],
    });
 
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIF_IDS.daily_routine,
          title: "Time for SpineLab",
          body: "Your 2-minute routine is ready. Keep the streak going.",
          schedule: {
            on: { hour, minute },
            allowWhileIdle: true,
          },
        },
      ],
    });
 
    localStorage.setItem(STORAGE.daily_enabled, "true");
    localStorage.setItem(STORAGE.daily_hour, String(hour));
    localStorage.setItem(STORAGE.daily_minute, String(minute));
  } catch (err) {
    console.error("[notifications] daily schedule error:", err);
  }
}
 
export async function cancelDailyRoutine() {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_IDS.daily_routine }],
    });
    localStorage.setItem(STORAGE.daily_enabled, "false");
  } catch (err) {
    console.error("[notifications] daily cancel error:", err);
  }
}
 
// ────────────────────────────────────────────────────────────
// Re-scan reminder (one-time, set N days out from "now")
// ────────────────────────────────────────────────────────────
 
/**
 * Schedule the re-scan reminder for `daysFromNow` days in the future at 10:00am.
 * Call this:
 *   - When user enables the reminder in Settings
 *   - After every successful posture scan (resets the clock)
 *
 * If the user has disabled rescan reminders, this no-ops.
 */
export async function scheduleReScanReminder(daysFromNow = 7) {
  const enabled = localStorage.getItem(STORAGE.rescan_enabled) !== "false";
  if (!enabled) return;
 
  const granted = await checkPermission();
  if (!granted) return;
 
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_IDS.rescan }],
    });
 
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    target.setHours(10, 0, 0, 0);
 
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIF_IDS.rescan,
          title: "See how you've improved",
          body:
            "It's been a week. Take a quick posture scan to see your progress.",
          schedule: {
            at: target,
            allowWhileIdle: true,
          },
        },
      ],
    });
  } catch (err) {
    console.error("[notifications] rescan schedule error:", err);
  }
}
 
export async function cancelReScanReminder() {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_IDS.rescan }],
    });
    localStorage.setItem(STORAGE.rescan_enabled, "false");
  } catch (err) {
    console.error("[notifications] rescan cancel error:", err);
  }
}
 
export function enableReScanReminder() {
  localStorage.setItem(STORAGE.rescan_enabled, "true");
  return scheduleReScanReminder();
}
 
// ────────────────────────────────────────────────────────────
// Preferences (read by Account page)
// ────────────────────────────────────────────────────────────
 
export function getPreferences() {
  return {
    dailyEnabled: localStorage.getItem(STORAGE.daily_enabled) === "true",
    dailyHour: parseInt(localStorage.getItem(STORAGE.daily_hour) || "8", 10),
    dailyMinute: parseInt(localStorage.getItem(STORAGE.daily_minute) || "0", 10),
    rescanEnabled: localStorage.getItem(STORAGE.rescan_enabled) !== "false",
  };
}
 
export function formatTime(hour, minute) {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const m = String(minute).padStart(2, "0");
  return `${h12}:${m} ${ampm}`;
}