import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import Login from '../components/Login';
import Register from '../components/Register';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const [modo, setModo] = useState('login'); // 'login' | 'register'

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div class="landing">
      <header class="landing-header">
        {/* Logo desde /public */}
        <img src="/logoHDC.jpg" alt="Heredeirxs do Celta" class="landing-logo" />
        <h1 class="landing-title">Heredeirxs do Celta</h1>
        <h2 class="landing-subtitle">Benvidxs á vosa comunidade celeste</h2>
      </header>

      <main class="landing-main">
        <div class="auth-card">
          <div class="auth-tabs">
            <button
              class={`tab-btn ${modo === 'login' ? 'is-active' : ''}`}
              onClick={() => setModo('login')}
            >
              Entra
            </button>
            <button
              class={`tab-btn ${modo === 'register' ? 'is-active' : ''}`}
              onClick={() => setModo('register')}
            >
              Rexístrate
            </button>
          </div>

          <div class="tab-body">
            {modo === 'login' ? <Login /> : <Register />}
          </div>
        </div>
      </main>

      <footer class="landing-footer">
        © {new Date().getFullYear()} Heredeirxs do Celta | Feito por Iago Fernández
      </footer>
    </div>
  );
}


