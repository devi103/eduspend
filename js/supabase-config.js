/**
 * EduSpend — Supabase Client Configuration
 * Connects to Supabase using the public anon/publishable key (safe for browser).
 * Never expose service_role or secret keys in frontend code.
 */

(function() {
  'use strict';

  const SUPABASE_URL = 'https://rzsceanhmmrkevyzbqba.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_Io3nYD8s_3rLReuCT6wv2Q_NYXy9dB6';

  // Initialize Supabase client using the CDN-loaded library
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[EduSpend] Supabase JS library not loaded. Ensure the CDN script is included before this file.');
    window.eduspendSupabase = null;
    return;
  }

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  // Expose globally for other modules
  window.eduspendSupabase = supabaseClient;
  window.EDUSPEND_SUPABASE_URL = SUPABASE_URL;

  console.log('[EduSpend] Supabase client initialized for:', SUPABASE_URL);
})();
