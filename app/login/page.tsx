"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/lobby");
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="portal-bg" aria-hidden />
      <form className="auth-card" onSubmit={onSubmit}>
        <h1 className="auth-title">
          <span className="auth-title-rick">Rick</span>
          <span className="auth-title-amp"> & </span>
          <span className="auth-title-morty">Morty</span>
        </h1>
        <p className="auth-sub">Cluedo · Friends only</p>
        <label className="field">
          <span>Shared password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the portal code"
            autoFocus
            required
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Opening portal..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
