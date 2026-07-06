"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rememberName } from "@/lib/player-name";

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("Enter a display name.");
      return;
    }
    if (mode === "join") {
      const code = joinCode.trim().toUpperCase();
      if (code.length < 4) {
        setError("Enter the 6-character room code your friend gave you.");
        return;
      }
    }
    setError(null);
    setBusy(true);
    rememberName(trimmed);
    const params = new URLSearchParams({ name: trimmed, mode });
    if (mode === "join") params.set("roomId", joinCode.trim().toUpperCase());
    router.push(`/room/waiting?${params.toString()}`);
  }

  return (
    <main className="lobby-shell">
      <div className="portal-bg" aria-hidden />
      <div className="lobby-card">
        <h1 className="lobby-title">
          <span className="auth-title-rick">Rick</span>
          <span className="auth-title-amp"> & </span>
          <span className="auth-title-morty">Morty</span>
          <span className="lobby-title-sub">Cluedo</span>
        </h1>

        <div className="lobby-tabs">
          <button
            type="button"
            className={`tab ${mode === "create" ? "active" : ""}`}
            onClick={() => setMode("create")}
          >
            Create room
          </button>
          <button
            type="button"
            className={`tab ${mode === "join" ? "active" : ""}`}
            onClick={() => setMode("join")}
          >
            Join room
          </button>
        </div>

        <form onSubmit={go} className="lobby-form">
          <label className="field">
            <span>Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="e.g. Rick C-137"
              autoFocus
            />
          </label>

          {mode === "join" && (
            <label className="field">
              <span>Room code</span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="code-input"
              />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {mode === "create" ? "Open a portal (create)" : "Enter room (join)"}
          </button>
        </form>

        <p className="lobby-help">
          {mode === "create"
            ? "You'll get a 6-character code to text your friends. They join from this same screen."
            : "Ask the room creator for the code — open rooms are never listed."}
        </p>
      </div>
    </main>
  );
}
