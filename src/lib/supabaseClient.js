// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Estas variables se inyectan en build por Vite (vienen de .env o Vercel)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Aviso útil en consola si faltan (solo en desarrollo)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabaseClient] Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Revisa tu .env local o las Environment Variables de Vercel.'
  );
}

// Crea cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'hdc-liga-frontend'
    }
  }
});

