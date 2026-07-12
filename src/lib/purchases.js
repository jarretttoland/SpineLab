/**
 * src/lib/purchases.js
 *
 * RevenueCat wrapper for SpineLab.
 * Handles initialization, purchasing, entitlement checks, and Supabase sync.
 *
 * Product IDs (must match App Store Connect exactly):
 *   Monthly : spinelab_premium_monthly   ($7.99/mo)
 *   Annual  : spinelab_premium_annual    ($59.99/yr)
 *
 * RevenueCat entitlement: "premium"
 *
 * ─── Setup checklist ───────────────────────────────────────────────────────
 * 1. npm install @revenuecat/purchases-capacitor
 * 2. npx cap sync ios
 * 3. Replace REVENUECAT_IOS_API_KEY below with your iOS public SDK key
 *    (RevenueCat dashboard → Project → API Keys → Public app-specific keys → iOS)
 * 4. In RevenueCat dashboard:
 *    a. Create products: spinelab_premium_monthly + spinelab_premium_annual
 *    b. Create entitlement "premium", attach both products
 *    c. Create offering "default", add both as packages (MONTHLY + ANNUAL)
 * ───────────────────────────────────────────────────────────────────────────
 */

import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { supabase } from "./supabase";

// ─── Replace with your actual iOS SDK key from RevenueCat dashboard ────────
const REVENUECAT_IOS_API_KEY = "appl_VvbowySqjHTLTVkhtMehhLaABuu";

const ENTITLEMENT_ID = "premium";

let _initialized = false;

// ── Initialize ───────────────────────────────────────────────────────────────

/**
 * Call once on app start (after auth resolves).
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * @param {string|null} userId  Supabase user ID, or null for anonymous
 */
export async function initPurchases(userId = null) {
  if (_initialized) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({
      apiKey: REVENUECAT_IOS_API_KEY,
      appUserID: userId ?? undefined,
    });
    _initialized = true;
    console.log("[Purchases] RevenueCat initialized", userId ? `as ${userId}` : "anonymous");
  } catch (err) {
    console.error("[Purchases] init error:", err);
  }
}

/**
 * Call after the user logs in so RevenueCat links purchases to their account.
 * @param {string} userId
 */
export async function identifyUser(userId) {
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.error("[Purchases] logIn error:", err);
  }
}

// ── Entitlement check ────────────────────────────────────────────────────────

/**
 * Returns true if the current user has an active "premium" entitlement.
 * Always fetches fresh state from RevenueCat.
 */
export async function checkPremiumEntitlement() {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
  } catch (err) {
    console.error("[Purchases] entitlement check error:", err);
    return false;
  }
}

// ── Offerings ────────────────────────────────────────────────────────────────

/**
 * Fetches the current RevenueCat offering.
 * Returns { monthly, annual } package objects, or null on failure.
 */
export async function getOfferings() {
  try {
    const { offerings } = await Purchases.getOfferings();
    if (!offerings?.current) return null;
    const pkgs = offerings.current.availablePackages;
    return {
      monthly: pkgs.find((p) => p.packageType === "MONTHLY") ?? null,
      annual:  pkgs.find((p) => p.packageType === "ANNUAL")  ?? null,
      raw: offerings.current,
    };
  } catch (err) {
    console.error("[Purchases] getOfferings error:", err);
    return null;
  }
}

// ── Purchase ─────────────────────────────────────────────────────────────────

/**
 * Triggers the StoreKit purchase sheet for a given RevenueCat package.
 * On success, syncs the premium status to Supabase.
 *
 * @param {object} pkg   A RevenueCat package from getOfferings()
 * @param {string} userId  Supabase user ID for DB sync
 * @returns {{ success: boolean, cancelled: boolean, error: string|null }}
 */
export async function purchasePackage(pkg, userId) {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const isPremium = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

    if (isPremium && userId) {
      await syncSubscriptionToSupabase(userId, true);
    }

    return { success: isPremium, cancelled: false, error: null };
  } catch (err) {
    // User cancelled — not an error
    if (err?.code === "1" || err?.message?.includes("cancel")) {
      return { success: false, cancelled: true, error: null };
    }
    console.error("[Purchases] purchase error:", err);
    return { success: false, cancelled: false, error: err?.message ?? "Purchase failed" };
  }
}

// ── Restore ──────────────────────────────────────────────────────────────────

/**
 * Restores prior purchases. Syncs to Supabase if premium found.
 * @param {string} userId
 * @returns {{ success: boolean, hasPremium: boolean, error: string|null }}
 */
export async function restorePurchases(userId) {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isPremium = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

    if (userId) {
      await syncSubscriptionToSupabase(userId, isPremium);
    }

    return { success: true, hasPremium: isPremium, error: null };
  } catch (err) {
    console.error("[Purchases] restore error:", err);
    return { success: false, hasPremium: false, error: err?.message ?? "Restore failed" };
  }
}

// ── Supabase sync ────────────────────────────────────────────────────────────

/**
 * Writes subscription_tier to the profiles table.
 * Called after purchase, restore, and on app launch entitlement check.
 */
export async function syncSubscriptionToSupabase(userId, isPremium) {
  try {
    await supabase
      .from("profiles")
      .update({
        subscription_tier: isPremium ? "premium" : "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } catch (err) {
    console.error("[Purchases] Supabase sync error:", err);
  }
}
