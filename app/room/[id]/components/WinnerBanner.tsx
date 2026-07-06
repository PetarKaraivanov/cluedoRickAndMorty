"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { useRouter } from "next/navigation";

export function WinnerBanner({ state }: { state: ClientGameState }) {
  const router = useRouter();
  const winner = state.players.find((p) => p.id === state.winner);
  const env = state.revealedEnvelope;
  const envCards = env ? Object.values(env).filter(Boolean) : [];

  return (
    <main className="winner-shell">
      <div className="portal-bg" aria-hidden />
      <div className="winner-card">
        <h1 className="winner-title">
          {winner ? `${winner.name} solved it!` : "The killer escaped!"}
        </h1>
        <p className="muted">
          {winner
            ? "The killer's identity has been revealed from the Confidential Envelope."
            : "All detectives were eliminated. The case goes cold."}
        </p>

        {envCards.length > 0 && (
          <>
            <h2 className="section-h">The Confidential Envelope</h2>
            <div className="winner-envelope">
              {envCards.map((c) => (
                <Card key={c!.id} card={c!} size="md" />
              ))}
            </div>
          </>
        )}

        <div className="winner-actions">
          <button className="btn btn-secondary" onClick={() => router.push("/lobby")}>
            Back to lobby
          </button>
        </div>
      </div>
    </main>
  );
}
