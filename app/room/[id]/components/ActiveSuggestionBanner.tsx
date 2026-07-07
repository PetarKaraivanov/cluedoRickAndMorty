"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";

/**
 * A prominent banner visible to ALL players when a suggestion is active.
 * Shows who is suggesting, what cards they picked, and the current status.
 */
export function ActiveSuggestionBanner({ state }: { state: ClientGameState }) {
  const active = state.activeSuggestion;
  if (!active) return null;

  const suggestionCards = Object.entries(active.suggestion)
    .map(([, id]) => ALL_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  let statusText = "";
  let statusClass = "";

  if (active.waitingForResponses) {
    statusText = "⏳ Waiting for all players to respond...";
    statusClass = "";
  } else if (active.pickingOpponent) {
    const names = active.opposingPlayers.map((p) => p.name).join(", ");
    statusText = `🛡️ ${names} can oppose. ${active.suggesterName} is choosing...`;
    statusClass = "";
  } else if (active.chosenOpponentName) {
    statusText = `✅ ${active.suggesterName} picked ${active.chosenOpponentName}`;
    statusClass = "suggestion-banner-done";
  } else {
    statusText = "✅ Reveal cycle complete";
    statusClass = "suggestion-banner-done";
  }

  return (
    <section className="panel suggestion-banner">
      <div className="suggestion-banner-header">
        <span className="suggestion-banner-icon">🔍</span>
        <strong>{active.suggesterName}</strong> suspects:
      </div>
      <div className="suggestion-banner-cards">
        {suggestionCards.map((card) =>
          card ? <Card key={card.id} card={card} size="sm" /> : null,
        )}
      </div>
      <div className={`suggestion-banner-status ${statusClass}`}>
        {statusText}
      </div>
    </section>
  );
}
