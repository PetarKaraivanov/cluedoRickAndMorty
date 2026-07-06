"use client";

import { useMemo, useState } from "react";
import type { CardTypeId, ClientGameState, RoomConfig } from "@/lib/types";
import { CARD_TYPES, CARD_TYPE_LABELS } from "@/lib/types";
import { DEFAULT_CARDS } from "@/lib/cards";
import { MIN_CARD_TYPES, MIN_PLAYERS, MAX_PLAYERS } from "@/lib/engine";
import { useSocket } from "@/app/providers/SocketProvider";
import { SOCK_EVENTS } from "@/lib/socket-events";

export function WaitingRoom({ state }: { state: ClientGameState }) {
  const { socket } = useSocket();
  const me = state.players.find((p) => p.isMe);
  const isHost = !!me?.isHost;
  const [config, setConfig] = useState<RoomConfig>(state.config);

  const allReady = state.players.length >= MIN_PLAYERS && state.players.every((p) => p.ready);

  function toggleReady() {
    if (!me) return;
    socket?.emit(SOCK_EVENTS.READY, { ready: !me.ready });
  }

  function pushConfig(next: RoomConfig) {
    setConfig(next);
    socket?.emit(SOCK_EVENTS.CONFIG, next);
  }

  function toggleType(t: CardTypeId) {
    const set = new Set(config.cardTypes);
    if (set.has(t)) {
      if (set.size <= MIN_CARD_TYPES) return;
      set.delete(t);
    } else {
      set.add(t);
    }
    pushConfig({ ...config, cardTypes: Array.from(set) });
  }

  function setMax(t: CardTypeId, n: number) {
    pushConfig({ ...config, maxPerType: { ...config.maxPerType, [t]: n } });
  }

  function start() {
    socket?.emit(SOCK_EVENTS.START);
  }

  return (
    <div className="waiting-grid">
      <section className="panel">
        <h2 className="panel-title">Room {state.id}</h2>
        <p className="muted">Share this code with your friends. Open rooms are never listed.</p>
        <div className="code-display">{state.id}</div>
        <h3 className="section-h">Players ({state.players.length}/{MAX_PLAYERS})</h3>
        <ul className="player-list">
          {state.players.map((p) => (
            <li key={p.id} className={`player-row ${p.isMe ? "me" : ""}`}>
              <span className="player-name">
                {p.name} {p.isHost && <span className="badge badge-host">HOST</span>}
                {p.isMe && <span className="badge badge-me">YOU</span>}
              </span>
              <span className={`ready-dot ${p.ready ? "on" : "off"}`}>
                {p.ready ? "Ready" : "Not ready"}
              </span>
            </li>
          ))}
        </ul>
        <div className="ready-actions">
          <button
            type="button"
            className={`btn ${me?.ready ? "btn-secondary" : "btn-primary"}`}
            onClick={toggleReady}
          >
            {me?.ready ? "I'm not ready" : "I'm Ready"}
          </button>
          {isHost && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={start}
              disabled={!allReady}
              title={!allReady ? `Need ${MIN_PLAYERS}-8 players, all ready` : ""}
            >
              Start game
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Deck configuration</h2>
        {isHost ? (
          <p className="muted">Pick at least {MIN_CARD_TYPES} card types and how many of each to include.</p>
        ) : (
          <p className="muted">The host is configuring the deck. Sit tight.</p>
        )}

        <div className={`config-grid ${isHost ? "" : "readonly"}`}>
          {CARD_TYPES.map((t) => {
            const active = config.cardTypes.includes(t);
            const available = DEFAULT_CARDS[t].length;
            const current = config.maxPerType[t] ?? 0;
            return (
              <div key={t} className={`config-row ${active ? "active" : ""}`}>
                <label className="config-toggle">
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={!isHost || (active && config.cardTypes.length <= MIN_CARD_TYPES)}
                    onChange={() => toggleType(t)}
                  />
                  <span>{CARD_TYPE_LABELS[t]}</span>
                </label>
                {active && (
                  <div className="config-count">
                    <button
                      type="button"
                      disabled={!isHost || current <= 1}
                      onClick={() => setMax(t, Math.max(1, current - 1))}
                      aria-label={`fewer ${t}`}
                    >
                      -
                    </button>
                    <span>{current}</span>
                    <button
                      type="button"
                      disabled={!isHost || current >= available}
                      onClick={() => setMax(t, Math.min(available, current + 1))}
                      aria-label={`more ${t}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DeckPreview config={config} />
      </section>

      <section className="panel">
        <h2 className="panel-title">How it works</h2>
        <ul className="rules-list">
          <li>3-8 players. Everyone must press Ready.</li>
          <li>Host picks card types (min 3) and how many of each.</li>
          <li>The engine deals one of each type into the Confidential Envelope.</li>
          <li>Remaining cards are split evenly across all players.</li>
          <li>On your turn: suggest or accuse. Suggestions reveal one hidden card. Wrong accusation eliminates you.</li>
        </ul>
      </section>
    </div>
  );
}

function DeckPreview({ config }: { config: RoomConfig }) {
  const total = useMemo(() => {
    let sum = 0;
    for (const t of config.cardTypes) sum += config.maxPerType[t] ?? 0;
    return sum;
  }, [config]);
  const envelope = config.cardTypes.length;
  const dealt = total - envelope;
  return (
    <div className="deck-preview">
      <span>Total cards: <strong>{total}</strong></span>
      <span>Envelope: <strong>{envelope}</strong></span>
      <span>To deal: <strong>{dealt}</strong></span>
    </div>
  );
}
