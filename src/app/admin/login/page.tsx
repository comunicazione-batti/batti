"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Inserisci email e password.");
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError("Credenziali non valide.");
      return;
    }
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <>
      <TopBar title="Amministratore" backHref="/" />
      <div className="shell-narrow" style={{ paddingTop: 60 }}>
        <div className="card">
          <span className="eyebrow">Area riservata</span>
          <h2 style={{ margin: "10px 0 20px", fontWeight: 500 }}>Accesso amministratore</h2>
          <div className="field">
            <label>Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@battibecco.it"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {error && <div className="err">{error}</div>}
          </div>
          <button className="btn btn-primary btn-block" onClick={handleLogin} disabled={loading}>
            {loading ? "Accesso in corso..." : "Entra"}
          </button>
        </div>
        <p className="privacy-note">
          L&apos;account amministratore va creato una volta in Supabase (Authentication → Users) e
          collegato alla tabella admin_profiles, come spiegato in supabase/schema.sql.
        </p>
      </div>
    </>
  );
}
