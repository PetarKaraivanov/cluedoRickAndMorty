"use client";

import type { ClientGameState } from "@/lib/types";
import { Card } from "@/components/Card";
import { ALL_CARDS } from "@/lib/cards";
import { ActionTimer } from "./ActionTimer";

interface Props {
  state: ClientGameState;
  onReveal: (cardId: string | null) => void;
  onPickOpponent: (opponentId: string) => void;
  onEndTurn: () => void;
  onAccuse: () => void;
}

/**
 * Inline "Current Round" content. Shows the active suggestion,
 * reveal prompts, pick-opponent, and result summary — all inline,
 * no modals.
 */
export function CurrentRound({ state, onReveal, onPickOpponent, onEndTurn, onAccuse }: Props) {
  const active = state.activeSuggestion;
  const me = state.players.find((p) => p.isMe);
  const isMyTurn = !!me && state.currentTurnPlayerId === me.id && !me.eliminated;

  // No active suggestion — show idle state
  if (!active) {
    if (isMyTurn && state.turnStage === "awaiting-turn") {
      return (
        <div className="current-round-idle">
          <p className="current-round-prompt">It&apos;s your turn! Make a suggestion or accusation.</p>
        </div>
      );
    }
    if (isMyTurn && state.turnStage === "accuse-or-end") {
      return (
        <div className="current-round-idle">
          <p className="current-round-prompt">You can accuse or end your turn.</p>
          <div className="current-round-actions">
            <button type="button" className="btn btn-danger" onClick={onAccuse}>Accuse</button>
            <button type="button" className="btn btn-secondary" onClick={onEndTurn}>End Turn</button>
          </div>
        </div>
      );
    }
    const currentPlayer = state.players[state.currentTurnIdx];
    return (
      <div className="current-round-idle">
        <p className="current-round-waiting">Waiting for <strong>{currentPlayer?.name ?? "?"}</strong> to act...</p>
      </div>
    );
  }

  // Build suggestion cards
  const suggestionCards = Object.entries(active.suggestion)
    .map(([, id]) => ALL_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  const iAmSuggester = active.suggesterId === me?.id;
  const mustRespond = active.iMustRespond;
  const matches = mustRespond
    ? state.myHand.filter((c) => active.suggestion[c.type] === c.id)
    : [];

  return (
    <div className="current-round-content">
      {/* Suggestion header */}
      <div className="current-round-suggestion">
        <p className="current-round-who">
          <strong>{iAmSuggester ? "You" : active.suggesterName}</strong> suspect{iAmSuggester ? "" : "s"}:
        </p>
        <div className="current-round-cards">
          {suggestionCards.map((card) =>
            card ? <Card key={card.id} card={card} size="sm" /> : null,
          )}
        </div>
      </div>

      {/* Stage-specific content */}

      {/* A) Waiting for responses */}
      {active.waitingForResponses && !mustRespond && (
        <div className="current-round-status">
          <span className="status-icon">⏳</span>
          <span>Waiting for all players to respond...</span>
        </div>
      )}

      {/* B) I must respond — inline reveal prompt */}
      {mustRespond && (
        <div className="current-round-reveal">
          <div className="current-round-reveal-header">
            <span className="status-icon">⚡</span>
            <strong>Your response required!</strong>
            <ActionTimer resetKey={`reveal-${active.suggesterId}`} />
          </div>
          {matches.length > 0 ? (
            <>
              <p className="muted">
                You have {matches.length} matching card{matches.length === 1 ? "" : "s"}. Pick one to secretly show:
              </p>
              <div className="current-round-reveal-options">
                {matches.map((c) => (
                  <Card
                    key={c.id}
                    card={c}
                    size="sm"
                    onClick={() => onReveal(c.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="muted">You have no matching cards.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onReveal(null)}
              >
                Pass (no matches)
              </button>
            </>
          )}
        </div>
      )}

      {/* C) Picking opponent (suggester only) */}
      {active.pickingOpponent && iAmSuggester && (
        <div className="current-round-pick">
          <div className="current-round-reveal-header">
            <span className="status-icon">⚡</span>
            <strong>Pick an opponent to see their card!</strong>
            <ActionTimer resetKey={`pick-${active.suggesterId}`} />
          </div>
          <p className="muted">
            {active.opposingPlayers.length} player{active.opposingPlayers.length === 1 ? " has" : "s have"} a matching card:
          </p>
          <div className="pick-opponent-list">
            {active.opposingPlayers.map((opponent) => (
              <button
                key={opponent.id}
                type="button"
                className="btn btn-secondary pick-opponent-btn"
                onClick={() => onPickOpponent(opponent.id)}
              >
                <span className="pick-opponent-icon">🃏</span>
                <span className="pick-opponent-name">{opponent.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* C2) Picking opponent (not the suggester — just status) */}
      {active.pickingOpponent && !iAmSuggester && (
        <div className="current-round-status">
          <span className="status-icon">🛡️</span>
          <span>
            {active.opposingPlayers.map((p) => p.name).join(", ")} can oppose.{" "}
            <strong>{active.suggesterName}</strong> is choosing...
          </span>
        </div>
      )}

      {/* D) Resolved — result summary */}
      {active.resolved && (
        <div className="current-round-result">
          <div className="current-round-result-header">
            <span className="status-icon">✅</span>
            <strong>Round complete</strong>
          </div>

          {active.noOneOpposed ? (
            <p className="current-round-result-text">
              No one had a matching card. The mystery deepens...
            </p>
          ) : (
            <div className="current-round-result-detail">
              <p className="current-round-result-text">
                <strong>{active.chosenOpponentName}</strong> showed a card to{" "}
                <strong>{iAmSuggester ? "you" : active.suggesterName}</strong>.
              </p>
              {iAmSuggester && active.revealedToMe && (
                <div className="current-round-revealed-card">
                  <p className="muted">The card shown to you:</p>
                  <div className="current-round-cards">
                    {(() => {
                      const card = ALL_CARDS.find((c) => c.id === active.revealedToMe);
                      return card ? <Card card={card} size="sm" /> : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* End turn / Accuse actions for the current player */}
          {isMyTurn && (
            <div className="current-round-actions">
              <button type="button" className="btn btn-danger" onClick={onAccuse}>
                Accuse
              </button>
              <button type="button" className="btn btn-primary" onClick={onEndTurn}>
                End Turn
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
