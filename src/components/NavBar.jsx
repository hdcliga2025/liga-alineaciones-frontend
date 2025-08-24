// src/components/NavBar.jsx
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function NavBar() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    route("/login", true);
  };

  return (
    <nav class="navbar">
      {/* ...o teu contido de navbar */}
      <button onClick={handleLogout} class="px-3 py-1 rounded border">
        Saír
      </button>
    </nav>
  );
}
