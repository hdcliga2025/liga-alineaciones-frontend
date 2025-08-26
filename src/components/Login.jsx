// src/components/Login.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabaseClient.js';
// Si prefires forzar a ruta tras login, descomenta:
// import { route } from 'preact-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setErr(error.message || 'Erro iniciando sesión.');
        return;
      }

      // Éxito: AuthWatcher detectará a sesión e redirixirá a /dashboard.
      // Se queres redirixir aquí manualmente, descomenta:
      // route('/dashboard', true);
    } catch (e2) {
      setErr('Erro inesperado iniciando sesión.');
      console.error(e2);
    } finally {
      // Asegura que o botón non quede en "Accedendo…"
      setLoading(false);
    }
  }

  return (
    <main style="display:flex;justify-content:center;padding:24px;">
      <div style="width:100%;max-width:420px;">
        <h1 style="font-family: Montserrat, sans-serif; margin-bottom: 8px;">Heredéirxs do Celta</h1>
        <p style="margin-top:0;opacity:.8">Benvidxs á vosa comunidade celeste</p>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);">
          <form onSubmit={handleSubmit}>
            <div style="margin-bottom:12px;">
              <label for="email" style="display:block;margin-bottom:6px;">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                autocomplete="username"
                style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;"
              />
            </div>

            <div style="margin-bottom:12px;">
              <label for="password" style="display:block;margin-bottom:6px;">Contrasinal</label>
              <input
                id="password"
                type="password"
                value={password}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required
                autocomplete="current-password"
                style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;"
              />
            </div>

            {err && (
              <p style="margin:8px 0 12px;color:#b91c1c;font-size:.95rem">{err}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style="width:100%;padding:12px;border:none;border-radius:9999px;background-image:linear-gradient(180deg,#67b1ff,#5a8df5);color:#fff;font-weight:700;cursor:pointer;"
            >
              {loading ? 'Accedendo…' : 'Entrar'}
            </button>
          </form>

          <div style="margin-top:12px;text-align:center;">
            <a href="/register" style="display:inline-block;padding:10px 16px;border:1px solid #d1d5db;border-radius:9999px;text-decoration:none;">
              Rexístrate
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

