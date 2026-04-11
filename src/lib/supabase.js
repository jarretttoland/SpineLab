import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dslaxbxapbamrreopcdm.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGF4YnhhcGJhbXJyZW9wY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjU5NTMsImV4cCI6MjA5MDY0MTk1M30.TUFikVyCNkRPpu7dF-eLTVNZLGSwQFP37UcIXP2H3-k"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)