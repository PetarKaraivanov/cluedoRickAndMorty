"use client";

import type { ClientGameState } from "@/lib/types";

export function TurnIndicator({ state }: { state: ClientGameState }) {
  const current = state.players[state.currentTurnIdx];
  const me = state.players.find((p) => p.isMe);
  const isMyTurn = me && state.currentTurnPlayerId === me.id;

  let stage = "";
  if (state.phase === "finished") stage = "Game over";
  else if (!current) stage = "";
  else if (state.activeSuggestion?.revealingPlayerId) {
    const revealer = state.players.find((p) => p.id === state.activeSuggestion!.revealingPlayerId);
    stage = `${revealer?.name ?? "?"} must respond`;
  } else if (state.turnStage === "awaiting-turn") stage = "Suggest or accuse";
  else if (state.turnStage === "revealing") stage = "Awaiting reveal";

  return (
    <section className="turn-indicator panel">
      <div>
        <p className="muted">Current turn</p>
        <p className="turn-name">
          {current?.eliminated && <span className="badge badge-out">OUT</span>}
          {!current?.connected && current && <span className="badge badge-dc">DC</span>}
          {" "}{current?.name ?? "—"}
          {isMyTurn && <span className="badge badge-you">YOU</span>}
        </p>
      </div>
      <div className="turn-stage">{stage}</div>
    </section>
  );
}
