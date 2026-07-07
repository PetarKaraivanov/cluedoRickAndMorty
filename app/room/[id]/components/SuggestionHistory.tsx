"use client";

import { useState } from "react";
import type { ClientGameState, SuggestionHistoryEntry } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";

function HistoryEntry({ entry, isMe }: { entry: SuggestionHistoryEntry; isMe: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const suggestionCards = Object.entries(entry.suggestion)
    .map(([, id]) => ALL_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  const revealedCard = entry.revealedCardId
    ? ALL_CARDS.find((c) => c.id === entry.revealedCardId)
    : null;

  return (
    <div className={`history-entry ${isMe ? "history-mine" : ""}`}>
      <button
        type="button"
        className="history-entry-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="history-entry-summary">
          <span className="history-suggester">
            {isMe ? "You" : entry.suggesterName}
          </span>
          <span className="history-action">suspected</span>
          <span className="history-expand-icon">{expanded ? "▼" : "▶"}</span>
        </div>
        <div className="history-entry-mini-cards">
          {suggestionCards.map((card) =>
            card ? (
              <span key={card.id} className="history-mini-card" title={card.name}>
                {card.name}
              </span>
            ) : null,
          )}
        </div>
      </button>

      {expanded && (
        <div className="history-entry-detail">
          {/* Full suggestion cards */}
          <div className="history-cards-row">
            {suggestionCards.map((card) =>
              card ? <Card key={card.id} card={card} size="sm" /> : null,
            )}
          </div>

          {/* Opposition info */}
          <div className="history-opposition">
            {entry.noOneOpposed ? (
              <p className="history-no-oppose">
                <span className="history-icon">✖</span> No one had a matching card
              </p>
            ) : (
              <>
                <p className="history-opposed-label">
                  <span className="history-icon">🛡️</span> Opposed by:{" "}
                  <strong>
                    {entry.opposingPlayers.map((p) => p.name).join(", ")}
                  </strong>
                </p>
                {entry.chosenOpponentName && (
                  <p className="history-chosen">
                    <span className="history-icon">👉</span>{" "}
                    {isMe ? "You" : entry.suggesterName} picked{" "}
                    <strong>{entry.chosenOpponentName}</strong>
                    {isMe && revealedCard ? (
                      <span className="history-revealed">
                        {" "}→ showed{" "}
                        <span className="history-revealed-card">{revealedCard.name}</span>
                      </span>
                    ) : (
                      <span className="history-revealed">
                        {" "}→ showed a card
                      </span>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SuggestionHistory({ state }: { state: ClientGameState }) {
  const me = state.players.find((p) => p.isMe);
  const history = state.suggestionHistory ?? [];

  if (history.length === 0) {
    return (
      <div className="suggestion-history">
        <p className="muted">No suggestions have been made yet.</p>
      </div>
    );
  }

  // Show newest first
  const reversed = [...history].reverse();

  return (
    <div className="suggestion-history">
      <p className="muted">
        Tap an entry to see the full suggestion. Only you can see cards shown to you.
      </p>
      <div className="history-list">
        {reversed.map((entry) => (
          <HistoryEntry
            key={entry.id}
            entry={entry}
            isMe={entry.suggesterId === me?.id}
          />
        ))}
      </div>
    </div>
  );
}
