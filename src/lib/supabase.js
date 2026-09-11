import { createClient } from '@supabase/supabase-js';

// Intentar leer las variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('tina_supabase_url') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('tina_supabase_key') || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helpers para guardar configuración de Supabase desde la UI
export function saveSupabaseCredentials(url, key) {
  localStorage.setItem('tina_supabase_url', url.trim());
  localStorage.setItem('tina_supabase_key', key.trim());
  window.location.reload();
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('tina_supabase_url');
  localStorage.removeItem('tina_supabase_key');
  window.location.reload();
}
