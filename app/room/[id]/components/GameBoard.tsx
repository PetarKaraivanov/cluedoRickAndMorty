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
import { Notepad } from "./Notepad";
import { GameLog } from "./GameLog";
import { RevealPrompt } from "./RevealPrompt";
import { WinnerBanner } from "./WinnerBanner";
import { ActiveSuggestionBanner } from "./ActiveSuggestionBanner";

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
  const mustReveal =
    state.activeSuggestion?.revealingPlayerId === me?.id;

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
        <TurnIndicator state={state} />

        {/* Show active suggestion to ALL players */}
        <ActiveSuggestionBanner state={state} />

        <section className="actions-bar">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canAct}
            onClick={() => setShowSuggest(true)}
          >
            Suggest
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!canAct}
            onClick={() => setShowAccuse(true)}
          >
            Accuse
          </button>
        </section>

        <PlayerHand cards={state.myHand} seenIds={state.mySeenCards} />

        <Notepad state={state} />
      </main>

      <aside className="col-log">
        <GameLog entries={state.log} />
      </aside>

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

      {mustReveal && state.activeSuggestion && (
        <RevealPrompt
          state={state}
          onReveal={(cardId) => socket?.emit(SOCK_EVENTS.REVEAL, { cardId })}
        />
      )}
    </div>
  );
}
