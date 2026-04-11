import { supabase } from "@/lib/supabase";

const SCAN_BUCKET = "posture-scans";

export async function getCurrentUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("not_authenticated");
  return user;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchPreviousScans(userId, limit = 5) {
  const { data, error } = await supabase
    .from("posture_scans")
    .select("*")
    .eq("user_id", userId)
    .order("scan_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function upsertProfile(profile) {
  if (!profile?.id) {
    throw new Error("Profile id is required");
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const merged = {
    ...(existing || {}),
    ...profile,
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(merged)
    .eq("id", profile.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createPostureScan(scan) {
  const payload = {
    ...scan,
    created_at: scan.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("posture_scans")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadPostureScanImage(file, userId) {
  const ext = file.name?.split(".").pop()?.toLowerCase() || "jpg";
  const fileName =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const path = `${userId}/${Date.now()}-${fileName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SCAN_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(SCAN_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl,
  };
}