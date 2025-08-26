// src/pages/LandingPage.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const [tab, setTab] = useState('login');

  return (
    <div class="landing">
      <header class="landing-header">
        <img src="/logoHDC.jpg" alt="HDC" class="landing-logo" />
        <h1 class="landing-title">Heredéirxs do Celta</h1>
        <p class="landing-subtitle">Benvidxs á vosa comunidade celeste</p>
      </header>

      <main class="landing-main">
        <div class="auth-card">
          <div class="auth-tabs">
            <button
              class={`tab-btn ${tab === 'login' ? 'is-active' : ''}`}
              onClick={() => setTab('login')}
              type="button"
            >
              Entra
            </button>
            <button
              class={`tab-btn ${tab === 'register' ? 'is-active' : ''}`}
              onClick={() => setTab('register')}
              type="button"
            >
              Rexístrate
            </button>
          </div>

          <div class="tab-body">
            {tab === 'login' ? <Login /> : <Register />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


