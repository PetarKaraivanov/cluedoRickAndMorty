"use client";

import type { ClientGameState } from "@/lib/types";

export function TurnIndicator({ state }: { state: ClientGameState }) {
  const current = state.players[state.currentTurnIdx];
  let stage = "";
  if (state.phase === "finished") stage = "Game over";
  else if (!current) stage = "";
  else if (state.activeSuggestion?.revealingPlayerId) {
    const revealer = state.players.find((p) => p.id === state.activeSuggestion!.revealingPlayerId);
    stage = `${revealer?.name ?? "?"} must respond`;
  } else if (state.turnStage === "awaiting-turn") stage = "Suggest or accuse";
  else if (state.turnStage === "accuse-or-end") stage = "Accuse or end turn";
  else if (state.turnStage === "revealing") stage = "Awaiting reveal";

  return (
    <section className="turn-indicator panel">
      <div>
        <p className="muted">Current turn</p>
        <p className="turn-name">
          {current?.eliminated && <span className="badge badge-out">OUT</span>} {current?.name ?? "—"}
        </p>
      </div>
      <div className="turn-stage">{stage}</div>
    </section>
  );
}
