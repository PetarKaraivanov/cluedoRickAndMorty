"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";

/**
 * A prominent banner visible to ALL players when a suggestion is active.
 * Shows who is suggesting, what cards they picked, and who must respond.
 */
export function ActiveSuggestionBanner({ state }: { state: ClientGameState }) {
  const active = state.activeSuggestion;
  if (!active) return null;

  const suggestionCards = Object.entries(active.suggestion)
    .map(([, id]) => ALL_CARDS.find((c) => c.id === id))
    .filter(Boolean);

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
      {active.revealingPlayerName && (
        <div className="suggestion-banner-status">
          ⏳ Waiting for <strong>{active.revealingPlayerName}</strong> to respond...
        </div>
      )}
      {!active.revealingPlayerId && (
        <div className="suggestion-banner-status suggestion-banner-done">
          ✅ Reveal cycle complete
        </div>
      )}
    </section>
  );
}
