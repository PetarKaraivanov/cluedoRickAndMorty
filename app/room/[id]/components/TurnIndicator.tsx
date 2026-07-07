"use client";

import type { ClientGameState } from "@/lib/types";

export function TurnIndicator({ state, actionRequired }: { state: ClientGameState; actionRequired?: boolean }) {
  const current = state.players[state.currentTurnIdx];
  const me = state.players.find((p) => p.isMe);
  const isMyTurn = me && state.currentTurnPlayerId === me.id;

  let stage = "";
  if (state.phase === "finished") stage = "Game over";
  else if (!current) stage = "";
  else if (state.turnStage === "accuse-or-end") stage = "Reviewing result — accuse or end turn";
  else if (state.turnStage === "picking-opponent") stage = `${current.name} is choosing an opponent`;
  else if (state.activeSuggestion?.waitingForResponses) stage = "Awaiting responses";
  else if (state.turnStage === "awaiting-turn") stage = "Suggest or accuse";
  else if (state.turnStage === "revealing") stage = "Awaiting reveals";

  return (
    <section className={`turn-indicator panel ${actionRequired ? "action-required" : ""}`}>
      <div>
        <p className="muted">Current turn</p>
        <p className="turn-name">
          {current?.eliminated && <span className="badge badge-out">OUT</span>}
          {!current?.connected && current && <span className="badge badge-dc">DC</span>}
          {" "}{current?.name ?? "—"}
          {isMyTurn && <span className="badge badge-you">YOU</span>}
        </p>
      </div>
      <div className="turn-stage-container">
        {actionRequired && (
          <span className="action-badge pulse turn-action-badge">⚡ ACT NOW</span>
        )}
        <span className="turn-stage">{stage}</span>
      </div>
    </section>
  );
}
