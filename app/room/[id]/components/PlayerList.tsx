"use client";

import type { ClientGameState } from "@/lib/types";

export function PlayerList({ state }: { state: ClientGameState }) {
  return (
    <section className="panel">
      <h2 className="panel-title">Players</h2>
      <ul className="player-list game-player-list">
        {state.players.map((p, i) => {
          const isCurrent = i === state.currentTurnIdx;
          return (
            <li
              key={p.id}
              className={`player-row ${p.isMe ? "me" : ""} ${isCurrent ? "turn" : ""} ${p.eliminated ? "eliminated" : ""}`}
            >
              <span className="player-name">
                {p.name}
                {p.isHost && <span className="badge badge-host">HOST</span>}
                {p.isMe && <span className="badge badge-me">YOU</span>}
                {p.eliminated && <span className="badge badge-out">OUT</span>}
              </span>
              <span className="player-hand-count">{p.handCount} cards</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
