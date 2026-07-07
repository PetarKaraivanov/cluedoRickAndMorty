"use client";

import { useState } from "react";
import type { ClientGameState, Suggestion } from "@/lib/types";
import { useSocket } from "@/app/providers/SocketProvider";
import { SOCK_EVENTS } from "@/lib/socket-events";
import { PlayerHand } from "./PlayerHand";
import { PlayerList } from "./PlayerList";
import { TurnIndicator } from "./TurnIndicator";
import { SuggestionDialog } from "./SuggestionDialog";
import { AccusationDialog } from "./AccusationDialog";
import { SuggestionHistory } from "./SuggestionHistory";
import { GameLog } from "./GameLog";
import { WinnerBanner } from "./WinnerBanner";
import { CollapsibleSection } from "./CollapsibleSection";
import { CurrentRound } from "./CurrentRound";

export function GameBoard({ state }: { state: ClientGameState }) {
  const { socket } = useSocket();
  const me = state.players.find((p) => p.isMe);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showAccuse, setShowAccuse] = useState(false);

  if (state.phase === "finished") {
    return <WinnerBanner state={state} />;
  }

  const isMyTurn = !!me && state.currentTurnPlayerId === me.id && !me.eliminated;
  const canAct = isMyTurn && state.turnStage === "awaiting-turn";
  const mustReveal = !!state.activeSuggestion?.iMustRespond;
  const mustPickOpponent =
    state.activeSuggestion?.pickingOpponent &&
    state.activeSuggestion?.suggesterId === me?.id;
  const isResolved = !!state.activeSuggestion?.resolved;
  const hasActionRequired = mustReveal || mustPickOpponent || (isMyTurn && isResolved);

  // Current round section should auto-expand when there's something to see
  const roundIsActive = !!state.activeSuggestion || isMyTurn;

  // Build action badge for current round header
  const actionBadge = mustReveal || mustPickOpponent ? (
    <span className="action-badge pulse">⚡ ACTION REQUIRED</span>
  ) : isResolved && isMyTurn ? (
    <span className="action-badge result-badge">📋 RESULT</span>
  ) : state.activeSuggestion ? (
    <span className="action-badge active-badge">ACTIVE</span>
  ) : null;

  function emitSuggest(s: Suggestion) {
    socket?.emit(SOCK_EVENTS.SUGGEST, s);
    setShowSuggest(false);
  }
  function emitAccuse(s: Suggestion) {
    socket?.emit(SOCK_EVENTS.ACCUSE, s);
    setShowAccuse(false);
  }

  return (
    <div className="game-grid">
      <aside className="col-players">
        <PlayerList state={state} />
      </aside>

      <main className="col-main">
        <TurnIndicator state={state} actionRequired={hasActionRequired} />

        {/* Action buttons — only when it's your turn and awaiting */}
        {canAct && (
          <section className="actions-bar">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowSuggest(true)}
            >
              🔍 Suggest
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowAccuse(true)}
            >
              ⚠️ Accuse
            </button>
          </section>
        )}

        {/* Current Round — collapsible, auto-expands when active */}
        <CollapsibleSection
          title="Current Round"
          icon="📋"
          badge={actionBadge}
          defaultOpen={true}
          forceOpen={hasActionRequired || !!state.activeSuggestion}
        >
          <CurrentRound
            state={state}
            onReveal={(cardId) => socket?.emit(SOCK_EVENTS.REVEAL, { cardId })}
            onPickOpponent={(opponentId) => socket?.emit(SOCK_EVENTS.PICK_OPPONENT, { opponentId })}
            onEndTurn={() => socket?.emit(SOCK_EVENTS.END_TURN)}
            onAccuse={() => setShowAccuse(true)}
          />
        </CollapsibleSection>

        {/* Your Hand — collapsible */}
        <CollapsibleSection title="Your Hand" icon="🃏" defaultOpen={true}>
          <PlayerHand cards={state.myHand} seenIds={state.mySeenCards} />
        </CollapsibleSection>

        {/* Investigation History — collapsible */}
        <CollapsibleSection title="Investigation History" icon="📜" defaultOpen={false}>
          <SuggestionHistory state={state} />
        </CollapsibleSection>
      </main>

      <aside className="col-log">
        <GameLog entries={state.log} />
      </aside>

      {/* Modals — only for complex card pickers */}
      <SuggestionDialog
        open={showSuggest}
        state={state}
        onClose={() => setShowSuggest(false)}
        onSubmit={emitSuggest}
      />
      <AccusationDialog
        open={showAccuse}
        state={state}
        onClose={() => setShowAccuse(false)}
        onSubmit={emitAccuse}
      />
    </div>
  );
}
