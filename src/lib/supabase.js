// FILE: src/lib/supabase.js
// Replace your existing file with this entire file.
//
// What's new: we explicitly configure the auth client with:
//   - flowType: "pkce"        → required for native OAuth, where we
//                                receive a `code` via deep link and
//                                exchange it for a session on-device
//   - detectSessionInUrl: true → lets supabase auto-handle the redirect
//                                URL if it ever lands inside the WebView
//   - persistSession / autoRefreshToken → defaults, just explicit

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dslaxbxapbamrreopcdm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGF4YnhhcGJhbXJyZW9wY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjU5NTMsImV4cCI6MjA5MDY0MTk1M30.TUFikVyCNkRPpu7dF-eLTVNZLGSwQFP37UcIXP2H3-k";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Used by the native OAuth flow as the redirect target. Must be
// registered in Info.plist (CFBundleURLTypes) AND added to Supabase
// Dashboard → Authentication → URL Configuration → Redirect URLs.
export const NATIVE_OAUTH_REDIRECT = "app.spinelab.mobile://login-callback";
