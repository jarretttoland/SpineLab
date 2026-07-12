// FILE: src/lib/postureScanSupabase.js
// All Supabase interactions for the posture-scan flow.
// Tables assumed:
//   profiles        — one row per user (id = auth.uid)
//   posture_scans   — one row per scan
// Storage bucket:
//   posture-scans   — raw JPEG uploads

import { supabase } from "./supabase";

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Returns the currently signed-in Supabase user, or throws if not found.
 */
export async function getCurrentUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user;
}

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetch the user's profile row. Returns null if none exists yet.
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Insert or update (upsert) a profile row.
 * Pass the full or partial profile object — must include `id`.
 * Returns the saved row.
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Scans ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the N most recent posture scans for a user.
 */
export async function fetchPreviousScans(userId, limit = 10) {
  const { data, error } = await supabase
    .from("posture_scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Insert a new posture scan row.
 * Returns the created row.
 */
export async function createPostureScan(scan) {
  const { data, error } = await supabase
    .from("posture_scans")
    .insert(scan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Image upload ──────────────────────────────────────────────────────────────

/**
 * Upload a posture scan image to Supabase Storage.
 * Returns { publicUrl, path }.
 *
 * Storage bucket:  posture-scans
 * Path structure:  {userId}/{timestamp}.jpg
 *
 * The bucket must have:
 *   - RLS policy allowing authenticated inserts for the user's own folder
 *   - Public read access (or a signed-URL policy) so imageUrl works
 */
export async function uploadPostureScanImage(file, userId) {
  const ext = file.name?.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("posture-scans")
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("posture-scans").getPublicUrl(path);

  return { publicUrl, path };
}
