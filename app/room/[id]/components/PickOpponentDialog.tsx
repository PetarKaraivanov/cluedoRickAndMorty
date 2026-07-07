"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";
import { Modal } from "@/components/Modal";

interface Props {
  state: ClientGameState;
  onPick: (opponentId: string) => void;
}

/**
 * Shown to the suggester when multiple opponents had matching cards.
 * The suggester picks ONE opponent to see their card from.
 */
export function PickOpponentDialog({ state, onPick }: Props) {
  const active = state.activeSuggestion;
  if (!active || !active.pickingOpponent) return null;

  const me = state.players.find((p) => p.isMe);
  if (!me || active.suggesterId !== me.id) return null;

  const suggestionCards = Object.entries(active.suggestion)
    .map(([, id]) => ALL_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <Modal
      open={true}
      title="Pick an opponent"
      onClose={() => {}} // Can't close — must pick
    >
      <p className="muted">
        Your suggestion:
      </p>
      <div className="reveal-suggestion">
        {suggestionCards.map((card) =>
          card ? <Card key={card.id} card={card} size="sm" /> : null,
        )}
      </div>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Multiple players have a matching card. Pick one to see their card:
      </p>
      <div className="pick-opponent-list">
        {active.opposingPlayers.map((opponent) => (
          <button
            key={opponent.id}
            type="button"
            className="btn btn-secondary pick-opponent-btn"
            onClick={() => onPick(opponent.id)}
          >
            <span className="pick-opponent-icon">🃏</span>
            <span className="pick-opponent-name">{opponent.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
