// ─── Supabase client ─────────────────────────────────────────────────────────
// Project URL uses your project reference ID (qtmjwsomljtzgkjlyvsh).
// ANON KEY: Go to Supabase Dashboard → Settings → API → "anon public" key.
//           Paste it below. Never paste the service_role key here.
const SUPABASE_URL      = 'https://qtmjwsomljtzgkjlyvsh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bWp3c29tbGp0emdramx5dnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzYyNTMsImV4cCI6MjA5NzE1MjI1M30.3sFLpwUh1Yc1Dpfc4TffcEM3MC9SXsPV6o4Gs5jc5d0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
