"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";
import { Modal } from "@/components/Modal";

export function RevealPrompt({
  state,
  onReveal,
}: {
  state: ClientGameState;
  onReveal: (cardId: string | null) => void;
}) {
  const active = state.activeSuggestion;
  if (!active) return null;

  // Show to me only if I must respond (I'm in queue and haven't responded yet)
  if (!active.iMustRespond) return null;

  const me = state.players.find((p) => p.isMe);
  if (!me) return null;

  const matches = state.myHand.filter((c) => active.suggestion[c.type] === c.id);

  return (
    <Modal
      open={true}
      title="Show a card?"
      onClose={() => {}}
      footer={
        <>
          <button
            className="btn btn-secondary"
            disabled={matches.length > 0}
            onClick={() => onReveal(null)}
          >
            Pass (no matches)
          </button>
          {matches.length === 0 && (
            <span className="muted small">You have no matching card.</span>
          )}
        </>
      }
    >
      <p className="muted">
        {active.suggesterName} suggested:
      </p>
      <div className="reveal-suggestion">
        {Object.entries(active.suggestion).map(([type, id]) => {
          const card = ALL_CARDS.find((c) => c.id === id);
          if (!card) return null;
          return <Card key={id} card={card} size="sm" />;
        })}
      </div>
      <p className="muted">
        You hold {matches.length} matching card{matches.length === 1 ? "" : "s"}.
        {matches.length > 0 ? " Pick one to secretly reveal:" : ""}
      </p>
      <div className="reveal-options">
        {matches.map((c) => (
          <Card
            key={c.id}
            card={c}
            size="sm"
            onClick={() => onReveal(c.id)}
          />
        ))}
      </div>
    </Modal>
  );
}
